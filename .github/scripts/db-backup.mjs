// Nightly backup of THIS project's own Supabase database.
//
// Every Mako project runs its own copy of this. Nothing reaches across
// projects, and this repo's credentials open this repo's database and nothing
// else. That is the point: the previous arrangement had one control panel
// holding a Management API token that unlocked all 22 databases, pulling each
// one's service-role key on demand and parking every result — including
// GLBA-regulated client PII — in a single bucket. One token compromised meant
// the entire fleet. It is also why deleting that control panel would have
// taken the whole fleet's only backups with it.
//
// WHY NOT pg_dump. A real pg_dump needs the database password, and resetting
// passwords across the fleet risks breaking anything holding a direct
// connection string. PostgREST needs only the service-role key this repo
// already owns. Schema is not dumped here because it is already versioned in
// supabase/migrations/ — replay those, then load this data.
//
// WHAT IT PRODUCES: <project>-<date>.tar.gz containing one gzipped JSON array
// per table plus a manifest.json recording each table's row count.
//
// HOW IT FAILS: loudly. A table that errors, a table whose dump is SHORT of the
// rows it had, or a dump whose total row count is zero, exits non-zero so the
// workflow goes red and GitHub emails about it. The arrangement this replaces
// reported "partial" every night for weeks while 41% of MakoPulse's biggest
// table was missing, and nobody read it. A warning nobody acts on is not a
// safeguard, so this does not warn — it fails.
//
// LIVE TABLES (2026-09-29). The row check used to demand that the dump match a
// count taken before it EXACTLY. On a table that is written to all night —
// MakoPulse's `checks` (1.3M rows), Bulldog's `analytics_events` — rows land
// while the dump is still paging, so the check failed 10 of 15 nights on
// MakoPulse for growth, not loss. Now:
//   * every table is read in a STABLE order (keyset on its primary key where
//     it has a single-column one, otherwise ORDER BY its key/columns), so a row
//     inserted mid-dump can never shift a page and make another row be skipped;
//   * the table is counted before AND after the dump, and the dump must land
//     between those two counts. Growth passes; anything short of the smaller
//     count means rows went missing, and fails.

import { mkdirSync, rmSync, createWriteStream } from "node:fs";
import { writeFileSync } from "node:fs";
import { createGzip } from "node:zlib";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
import { once } from "node:events";

const URL_BASE = process.env.BACKUP_SUPABASE_URL;
const KEY = process.env.BACKUP_SUPABASE_SERVICE_ROLE_KEY;
const PROJECT = process.env.BACKUP_PROJECT_NAME || "project";
const DATE = process.env.BACKUP_DATE || new Date().toISOString().slice(0, 10);

if (!URL_BASE || !KEY) {
  console.error(
    "Missing BACKUP_SUPABASE_URL or BACKUP_SUPABASE_SERVICE_ROLE_KEY.\n" +
      "Both are repository secrets. Without them there is no backup, so this is fatal.",
  );
  process.exit(1);
}

const OUT = resolve("backup-out");
rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

// Sites that live in their own folder (schema) of a shared company project set
// BACKUP_DB_SCHEMA, so the dump reads that folder and no other site's tables.
const SCHEMA = process.env.BACKUP_DB_SCHEMA || "";
const headers = {
  apikey: KEY,
  Authorization: `Bearer ${KEY}`,
  ...(SCHEMA ? { "Accept-Profile": SCHEMA } : {}),
};

// Every request goes through here. A dropped socket makes fetch THROW
// ("fetch failed") rather than return a 5xx, so a retry that only inspects
// res.status never sees it — that is how one network blip failed a whole
// night's backup on 2026-09-26. Network errors, 429 and 5xx are retried with
// backoff; any other status is returned for the caller to judge.
async function fetchRetry(url, init, label) {
  let lastErr;
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const res = await fetch(url, { ...init, signal: AbortSignal.timeout(60_000) });
      if (res.ok || (res.status < 500 && res.status !== 429)) return res;
      lastErr = new Error(`${label}: HTTP ${res.status}`);
    } catch (e) {
      lastErr = new Error(`${label}: ${e.cause?.code || e.message || e}`);
    }
    if (attempt < 4) await new Promise((r) => setTimeout(r, 800 * attempt));
  }
  throw lastErr;
}

// PostgREST publishes an OpenAPI document at the API root listing every table
// it exposes. Discovering tables this way means a new table is backed up the
// night it is created, with nothing to remember to update. The same document
// marks primary-key columns (a "<pk/>" note in the column description), which
// is what gives each table a stable order to page by.
async function discover() {
  const res = await fetchRetry(`${URL_BASE}/rest/v1/`, { headers }, "table discovery");
  if (!res.ok) throw new Error(`table discovery failed: HTTP ${res.status} ${await res.text()}`);
  const doc = await res.json();
  const defs = doc.definitions || doc.components?.schemas || {};
  // Paths are the reliable list; definitions can include composite types.
  const fromPaths = Object.keys(doc.paths || {})
    .filter((p) => p.startsWith("/") && p.length > 1 && !p.startsWith("/rpc/"))
    .map((p) => p.slice(1));
  const tables = [...new Set(fromPaths.length ? fromPaths : Object.keys(defs))].sort();
  return { tables, defs };
}

// json (not jsonb) has no ordering operator, so it can never be in an ORDER BY.
const UNORDERABLE = new Set(["json"]);

function orderPlan(def) {
  const props = Object.entries(def?.properties || {});
  const pk = props.filter(([, v]) => /<pk\/>/.test(v.description || "")).map(([k]) => k);
  if (pk.length === 1) return { mode: "keyset", cols: pk };
  if (pk.length > 1) return { mode: "ordered", cols: pk, dedupe: true };
  const cols = props.filter(([, v]) => !UNORDERABLE.has(v.format)).map(([k]) => k);
  return cols.length ? { mode: "ordered", cols, dedupe: false } : { mode: "unordered", cols: [] };
}

const PAGE = 1000;
const col = (c) => encodeURIComponent(c);

async function countRows(table) {
  const res = await fetchRetry(
    `${URL_BASE}/rest/v1/${table}?select=*&limit=1`,
    { headers: { ...headers, Prefer: "count=exact", Range: "0-0" } },
    `count ${table}`,
  );
  if (!res.ok) throw new Error(`count ${table}: HTTP ${res.status}`);
  const n = Number((res.headers.get("content-range") || "").split("/")[1] ?? NaN);
  if (!Number.isFinite(n)) throw new Error(`count ${table}: no exact count returned`);
  return n;
}

async function readPage(table, query, label) {
  const res = await fetchRetry(`${URL_BASE}/rest/v1/${table}?select=*${query}`, { headers }, label);
  if (!res.ok) {
    const err = new Error(`read ${table}: HTTP ${res.status} ${(await res.text()).slice(0, 200)}`);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

// Rows are streamed straight into the gzip file one page at a time, so a
// multi-million-row table never has to exist as one giant string in memory.
// The file is still a single JSON array, exactly what restore expects.
async function dumpTable(table, plan) {
  const gz = createGzip();
  const file = createWriteStream(resolve(OUT, `${table}.json.gz`));
  gz.pipe(file);
  const write = async (s) => {
    if (!gz.write(s)) await once(gz, "drain");
  };
  await write("[");
  let written = 0;
  const emit = async (rows) => {
    for (const r of rows) {
      await write((written ? "," : "") + JSON.stringify(r));
      written++;
    }
  };

  if (plan.mode === "keyset") {
    // WHERE pk > last ORDER BY pk LIMIT n. Inserts and deletes elsewhere in
    // the table cannot move this cursor, so nothing is skipped or repeated.
    // It stops on an EMPTY page, not a short one, so a server-side max-rows
    // cap smaller than PAGE cannot end the dump early.
    const [pk] = plan.cols;
    let last;
    for (;;) {
      const after = last === undefined ? "" : `&${col(pk)}=gt.${encodeURIComponent(String(last))}`;
      const rows = await readPage(
        table,
        `&order=${col(pk)}.asc&limit=${PAGE}${after}`,
        `read ${table} after ${pk}=${last ?? "(start)"}`,
      );
      if (!rows.length) break;
      const next = rows[rows.length - 1][pk];
      if (next === null || next === undefined) throw new Error(`${table}: row with no ${pk}`);
      if (typeof next === "number" && !Number.isSafeInteger(next) && Number.isInteger(next)) {
        throw new Error(`${table}: ${pk} ${next} is beyond exact JSON precision; cannot page by it`);
      }
      if (last !== undefined && String(next) === String(last)) {
        throw new Error(`${table}: keyset cursor did not advance past ${pk}=${last}`);
      }
      await emit(rows);
      last = next;
    }
  } else {
    // Offset paging, but always in a fixed ORDER BY so a mid-dump insert
    // cannot reshuffle pages. A composite key is also de-duplicated, because
    // an insert that sorts before the cursor pushes one row onto the next page
    // twice. Advances by what actually came back and stops on an empty page,
    // so a max-rows cap cannot silently skip rows.
    let order = plan.cols.length ? `&order=${plan.cols.map((c) => `${col(c)}.asc`).join(",")}` : "";
    const seen = plan.dedupe ? new Set() : null;
    for (let from = 0; ; ) {
      let rows;
      try {
        rows = await readPage(table, `${order}&limit=${PAGE}&offset=${from}`, `read ${table} at rows ${from}+`);
      } catch (e) {
        // A column type with no ordering (a custom type, say) — fall back to
        // the old unordered read rather than lose the table. The before/after
        // count check below still catches anything short.
        if (order && from === 0 && e.status === 400) {
          console.log(`  ${table}: cannot ORDER BY its columns (${e.message.slice(0, 120)}); reading unordered`);
          order = "";
          continue;
        }
        throw e;
      }
      if (!rows.length) break;
      from += rows.length;
      await emit(seen ? rows.filter((r) => {
        const k = JSON.stringify(plan.cols.map((c) => r[c]));
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      }) : rows);
    }
  }

  await write("]");
  gz.end();
  await once(file, "finish");
  return written;
}

const { tables, defs } = await discover();
if (!tables.length) {
  console.error("No tables discovered. Refusing to publish an empty backup.");
  process.exit(1);
}
console.log(`${tables.length} tables to back up\n`);

const manifest = { project: PROJECT, date: DATE, taken_at: new Date().toISOString(), tables: [] };
const failures = [];
let total = 0;

for (const t of tables) {
  try {
    const plan = orderPlan(defs[t]);
    const before = await countRows(t);
    const got = await dumpTable(t, plan);
    const after = await countRows(t);
    // The dump ran between two counts, so its size must land between them.
    // Growth during the dump (after > before) is fine. Fewer rows than the
    // smaller count means rows were missed — a failed backup.
    const lo = Math.min(before, after);
    const hi = Math.max(before, after);
    if (got < lo || got > hi) {
      throw new Error(`got ${got} rows, but the table held ${before} before and ${after} after the dump`);
    }
    total += got;
    manifest.tables.push({ table: t, rows: got, count_before: before, count_after: after, order: plan.mode });
    console.log(`  ${t}: ${got}${after !== before ? ` (table went ${before} -> ${after} during the dump)` : ""}`);
  } catch (e) {
    failures.push({ table: t, error: String(e.message || e) });
    console.error(`  ${t}: FAILED — ${e.message || e}`);
  }
}

manifest.total_rows = total;
manifest.failures = failures;
writeFileSync(resolve(OUT, "manifest.json"), JSON.stringify(manifest, null, 2));

const archive = `${PROJECT}-${DATE}.tar.gz`;
execFileSync("tar", ["-czf", archive, "-C", OUT, "."], { stdio: "inherit" });
console.log(`\n${archive} — ${tables.length - failures.length}/${tables.length} tables, ${total} rows`);

if (failures.length) {
  console.error(`\n${failures.length} table(s) failed. This backup is INCOMPLETE.`);
  process.exit(1);
}
// A project with tables but no rows anywhere is more likely a broken key than
// a genuinely empty database — do not let that publish quietly as success.
if (total === 0) {
  console.error("\nEvery table came back empty. Treating as a failure, not a backup.");
  process.exit(1);
}
console.log("Every table's row count was verified against counts taken before and after its dump.");
