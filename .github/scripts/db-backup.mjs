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
// WHAT IT PRODUCES: <project>-<date>.tar.gz containing one gzipped JSON file
// per table plus a manifest.json recording each table's row count.
//
// HOW IT FAILS: loudly. A table that errors, or a dump whose total row count
// is zero, exits non-zero so the workflow goes red and GitHub emails about it.
// The arrangement this replaces reported "partial" every night for weeks while
// 41% of MakoPulse's biggest table was missing, and nobody read it. A warning
// nobody acts on is not a safeguard, so this does not warn — it fails.

import { writeFileSync, mkdirSync, rmSync } from "node:fs";
import { gzipSync } from "node:zlib";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";

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

const headers = { apikey: KEY, Authorization: `Bearer ${KEY}` };

// PostgREST publishes an OpenAPI document at the API root listing every table
// it exposes. Discovering tables this way means a new table is backed up the
// night it is created, with nothing to remember to update.
async function listTables() {
  const res = await fetch(`${URL_BASE}/rest/v1/`, { headers });
  if (!res.ok) throw new Error(`table discovery failed: HTTP ${res.status} ${await res.text()}`);
  const doc = await res.json();
  const defs = doc.definitions || doc.components?.schemas || {};
  // Paths are the reliable list; definitions can include composite types.
  const fromPaths = Object.keys(doc.paths || {})
    .filter((p) => p.startsWith("/") && p.length > 1 && !p.startsWith("/rpc/"))
    .map((p) => p.slice(1));
  return [...new Set(fromPaths.length ? fromPaths : Object.keys(defs))].sort();
}

const PAGE = 1000;

async function countRows(table) {
  const res = await fetch(`${URL_BASE}/rest/v1/${table}?select=*&limit=1`, {
    headers: { ...headers, Prefer: "count=exact", Range: "0-0" },
  });
  if (!res.ok) throw new Error(`count ${table}: HTTP ${res.status}`);
  return Number((res.headers.get("content-range") || "").split("/")[1] ?? NaN);
}

async function dumpTable(table, expected) {
  const rows = [];
  for (let from = 0; from < Math.max(expected, 1); from += PAGE) {
    let ok = false;
    for (let attempt = 1; attempt <= 4 && !ok; attempt++) {
      const res = await fetch(`${URL_BASE}/rest/v1/${table}?select=*`, {
        headers: { ...headers, Range: `${from}-${from + PAGE - 1}` },
      });
      if (res.ok) {
        rows.push(...(await res.json()));
        ok = true;
        break;
      }
      if (res.status < 500 && res.status !== 429) {
        throw new Error(`read ${table}: HTTP ${res.status} ${(await res.text()).slice(0, 200)}`);
      }
      await new Promise((r) => setTimeout(r, 800 * attempt));
    }
    if (!ok) throw new Error(`read ${table}: gave up at rows ${from}+`);
    if (expected === 0) break;
  }
  // Row count is verified, not assumed. A short table is a failed backup.
  if (rows.length !== expected) {
    throw new Error(`${table}: got ${rows.length} rows, expected ${expected}`);
  }
  writeFileSync(resolve(OUT, `${table}.json.gz`), gzipSync(JSON.stringify(rows)));
  return rows.length;
}

const tables = await listTables();
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
    const expected = await countRows(t);
    const got = await dumpTable(t, expected);
    total += got;
    manifest.tables.push({ table: t, rows: got });
    console.log(`  ${t}: ${got}`);
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
console.log("Every table matched its exact row count.");
