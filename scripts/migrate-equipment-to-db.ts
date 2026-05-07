// One-time data migration: src/lib/equipment.ts → bndt-prod tables
//
// Strategy:
// 1. Walk the CATEGORIES tree in equipment.ts.
// 2. For each top-level category, INSERT into catalog_categories (parent=null).
// 3. For each product within (subcategory is just a label, not a separate row),
//    INSERT into catalog_products with the parent's UUID and subcategory text.
//
// Idempotent via the unique (slug) constraint on categories and (category_id,
// slug) on products: re-running the script is a no-op (UPSERTs the same rows).
//
// Run with:
//   npx tsx scripts/migrate-equipment-to-db.ts
//
// Reads SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY from .env.local.

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { CATEGORIES } from "../src/lib/equipment.js";

// Manual .env.local load (Node doesn't read it by default).
try {
  const envText = readFileSync(resolve(process.cwd(), ".env.local"), "utf8");
  for (const line of envText.split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
} catch {
  // proceed; values may already be in process.env
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(2);
}

const supa = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
let categoriesUpserted = 0;
let productsUpserted = 0;
let productsFailed = 0;

for (const [catIndex, cat] of CATEGORIES.entries()) {
  // Upsert the category.
  const { data: catRow, error: catErr } = await supa
    .from("catalog_categories")
    .upsert(
      {
        slug: cat.slug,
        name: cat.name,
        short: cat.short,
        tagline: cat.tagline,
        description: cat.description,
        sort_order: catIndex,
        is_published: true,
      },
      { onConflict: "slug" },
    )
    .select("id, slug")
    .single();

  if (catErr || !catRow) {
    console.error(`[FAIL] category ${cat.slug}:`, catErr?.message);
    continue;
  }
  categoriesUpserted += 1;
  console.log(`[OK] category  ${cat.slug.padEnd(16)} ${catRow.id}`);

  // Walk subcategories → products
  let productSortOrder = 0;
  for (const sub of cat.subcategories) {
    for (const p of sub.products) {
      const { error: prodErr } = await supa
        .from("catalog_products")
        .upsert(
          {
            slug: p.slug,
            category_id: catRow.id,
            subcategory: sub.name,
            name: p.name,
            manufacturer: p.manufacturer ?? null,
            description: p.description ?? null,
            applications: p.applications ?? [],
            image: p.image,
            pdf: p.pdf ?? null,
            specs: {},
            sort_order: productSortOrder++,
            is_published: true,
          },
          { onConflict: "category_id,slug" },
        );
      if (prodErr) {
        console.error(`[FAIL] product ${cat.slug}/${p.slug}:`, prodErr.message);
        productsFailed += 1;
      } else {
        productsUpserted += 1;
      }
    }
  }
  console.log(
    `       ${cat.subcategories.reduce((n, s) => n + s.products.length, 0)} products in ${cat.slug}`,
  );
}

console.log("");
console.log("===========================================");
console.log(`  Categories upserted: ${categoriesUpserted}`);
console.log(`  Products upserted:   ${productsUpserted}`);
if (productsFailed > 0) {
  console.log(`  Products FAILED:     ${productsFailed}`);
}
console.log("===========================================");

if (productsFailed > 0) {
  process.exit(1);
}
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
