// Incremental backup of THIS project's Supabase storage buckets.
//
// Databases are handled by db-backup.mjs. This covers the files — which
// nothing has ever backed up, on any project. The control panel's fleet export
// copied tables only, so TopPaws' 76,598 pet photos, PixelCopy's release
// binaries and Makologics' compliance documents have existed in exactly one
// place since the day they were uploaded.
//
// WHY INCREMENTAL. A nightly full copy of TopPaws would push ~1.8 GB per run
// into release assets and blow past what is reasonable to keep. Uploaded files
// are effectively immutable, so after a one-off baseline each night only has
// to carry what is genuinely new.
//
//   storage-index   release  -> index.json: every object name -> size + etag
//   storage-<date>  release  -> tarball of objects new or changed that day
//
// Restoring means: take the baseline, then apply each dated tarball in date
// order. deleted.json in each increment records objects that disappeared, so a
// restore can choose to honour deletions or ignore them.
//
// HOW IT FAILS: loudly. Any object that cannot be downloaded after retries
// fails the run. A partial file copy that reports success is worse than no
// backup, because it invites you to trust it.

import { writeFileSync, readFileSync, mkdirSync, existsSync, rmSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { resolve, dirname } from "node:path";

const URL_BASE = process.env.BACKUP_SUPABASE_URL;
const KEY = process.env.BACKUP_SUPABASE_SERVICE_ROLE_KEY;
const PROJECT = process.env.BACKUP_PROJECT_NAME || "project";
const DATE = process.env.BACKUP_DATE || new Date().toISOString().slice(0, 10);

if (!URL_BASE || !KEY) {
  console.error("Missing BACKUP_SUPABASE_URL / BACKUP_SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const headers = { apikey: KEY, Authorization: `Bearer ${KEY}` };
const OUT = resolve("storage-out");
rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

// --------------------------------------------------------------- list objects
// storage.objects is not exposed through PostgREST, so the listing comes from
// the storage API's own search endpoint, walked bucket by bucket, prefix by
// prefix. limit is capped server-side, hence the paging.
async function listBucket(bucket) {
  const found = [];
  const walk = async (prefix) => {
    let offset = 0;
    for (;;) {
      const res = await fetch(`${URL_BASE}/storage/v1/object/list/${bucket}`, {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ prefix, limit: 1000, offset, sortBy: { column: "name", order: "asc" } }),
      });
      if (!res.ok) throw new Error(`list ${bucket}/${prefix}: HTTP ${res.status}`);
      const batch = await res.json();
      if (!batch.length) break;
      for (const o of batch) {
        // A row with no id is a folder placeholder, not a file — recurse.
        if (o.id === null || o.id === undefined) await walk(`${prefix}${o.name}/`);
        else found.push({
          bucket,
          name: `${prefix}${o.name}`,
          size: o.metadata?.size ?? 0,
          etag: o.metadata?.eTag ?? o.updated_at ?? "",
        });
      }
      if (batch.length < 1000) break;
      offset += 1000;
    }
  };
  await walk("");
  return found;
}

async function listBuckets() {
  const res = await fetch(`${URL_BASE}/storage/v1/bucket`, { headers });
  if (!res.ok) throw new Error(`bucket list: HTTP ${res.status}`);
  return (await res.json()).map((b) => b.name ?? b.id);
}

// ------------------------------------------------------------ previous index
// gh is used rather than the REST API so the workflow's own token is reused.
function ghTry(args) {
  try {
    return execFileSync("gh", args, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
  } catch {
    return null;
  }
}

let index = {};
let baselineExists = false;
if (ghTry(["release", "view", "storage-index"])) {
  rmSync("idx", { recursive: true, force: true });
  mkdirSync("idx", { recursive: true });
  if (ghTry(["release", "download", "storage-index", "--dir", "idx", "--clobber"])) {
    if (existsSync("idx/index.json")) {
      index = JSON.parse(readFileSync("idx/index.json", "utf8"));
      baselineExists = true;
    }
  }
}
console.log(baselineExists ? `Previous index: ${Object.keys(index).length} objects` : "No previous index — this run is the baseline.");

// ------------------------------------------------------------------- diff
const buckets = await listBuckets();
console.log(`${buckets.length} bucket(s): ${buckets.join(", ") || "(none)"}`);

let all = [];
for (const b of buckets) all = all.concat(await listBucket(b));
console.log(`${all.length} object(s) currently stored`);

if (!all.length && !baselineExists) {
  console.log("Nothing stored and no baseline to maintain. Nothing to do.");
  process.exit(0);
}

const current = {};
for (const o of all) current[`${o.bucket}/${o.name}`] = { size: o.size, etag: o.etag };

const changed = all.filter((o) => {
  const key = `${o.bucket}/${o.name}`;
  const prev = index[key];
  return !prev || prev.etag !== o.etag || prev.size !== o.size;
});
const deleted = Object.keys(index).filter((k) => !(k in current));

console.log(`${changed.length} new or changed, ${deleted.length} deleted since last run`);

// ---------------------------------------------------------------- download
let bytes = 0;
const failures = [];
let done = 0;

async function grab(o) {
  const dest = resolve(OUT, "files", o.bucket, o.name);
  const path = o.name.split("/").map(encodeURIComponent).join("/");
  const url = `${URL_BASE}/storage/v1/object/${encodeURIComponent(o.bucket)}/${path}`;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(url, { headers, signal: AbortSignal.timeout(120_000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buf = Buffer.from(await res.arrayBuffer());
      if (o.size > 0 && buf.length !== o.size) {
        throw new Error(`size mismatch: got ${buf.length}, expected ${o.size}`);
      }
      mkdirSync(dirname(dest), { recursive: true });
      writeFileSync(dest, buf);
      bytes += buf.length;
      done++;
      if (done % 250 === 0) console.log(`  ${done}/${changed.length} · ${(bytes / 1048576).toFixed(0)} MB`);
      return;
    } catch (e) {
      if (attempt === 3) { failures.push({ ...o, error: String(e.message || e) }); done++; return; }
      await new Promise((r) => setTimeout(r, 800 * attempt));
    }
  }
}

const queue = [...changed];
await Promise.all(Array.from({ length: 10 }, async () => {
  for (;;) { const o = queue.shift(); if (!o) return; await grab(o); }
}));

if (failures.length) {
  console.error(`\n${failures.length} object(s) failed to download. This backup is INCOMPLETE.`);
  for (const f of failures.slice(0, 20)) console.error(`  ${f.bucket}/${f.name}: ${f.error}`);
  process.exit(1);
}

// ----------------------------------------------------------------- publish
writeFileSync(resolve(OUT, "deleted.json"), JSON.stringify(deleted, null, 2));
writeFileSync(resolve(OUT, "manifest.json"), JSON.stringify({
  project: PROJECT, date: DATE, taken_at: new Date().toISOString(),
  baseline: !baselineExists, buckets,
  objects_total: all.length, objects_in_this_increment: changed.length,
  bytes_in_this_increment: bytes, deleted,
}, null, 2));

if (changed.length || deleted.length) {
  // Split so no single asset approaches GitHub's 2 GB per-file ceiling; a
  // TopPaws baseline is ~1.8 GB and would otherwise sit right on the edge.
  execFileSync("bash", ["-c",
    `tar -czf - -C "${OUT}" . | split -b 1500m - "${PROJECT}-storage-${DATE}.tar.gz.part-"`],
    { stdio: "inherit" });
  console.log(`\nPublished increment: ${changed.length} objects, ${(bytes / 1048576).toFixed(1)} MB`);
} else {
  console.log("\nNothing changed — no increment to publish.");
}

writeFileSync("index.json", JSON.stringify(current));
console.log(`Index now tracks ${Object.keys(current).length} objects.`);
