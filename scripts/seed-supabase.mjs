/**
 * Supabase シードスクリプト
 * scripts/geo-output/ 以下の JSON を geo_templates / geo_regions にアップサートする
 *
 * Usage: node --env-file=.env.local scripts/seed-supabase.mjs
 */

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const GEO_OUTPUT_DIR = path.join(ROOT, "scripts/geo-output");

const BATCH_SIZE = 500;

// -----------------------------------------------------------------------
// Supabase 接続
// -----------------------------------------------------------------------

function createSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set");
  }
  return createClient(url, key);
}

// -----------------------------------------------------------------------
// UPSERT 処理
// -----------------------------------------------------------------------

async function upsertTemplate(supabase, template) {
  const { error } = await supabase.from("geo_templates").upsert(
    {
      id: template.id,
      name: template.name,
      parent_template_id: template.parentTemplateId ?? null,
      parent_region_id: template.parentRegionId ?? null,
      canvas_width: template.canvasWidth,
      canvas_height: template.canvasHeight,
    },
    { onConflict: "id" }
  );
  if (error) throw new Error(`upsert geo_templates [${template.id}]: ${error.message}`);
}

async function upsertRegions(supabase, templateId, regions) {
  const rows = regions.map((r) => ({
    id: r.id,
    template_id: templateId,
    name: r.name,
    name_en: r.nameEn ?? "",
    tag_id: r.tag,
    path: r.path,
    bbox: r.bbox,
    geo_offset: r.offset,
  }));

  // バッチ分割で大量データに対応
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const { error } = await supabase
      .from("geo_regions")
      .upsert(batch, { onConflict: "id,template_id" });
    if (error) throw new Error(`upsert geo_regions batch [${i}]: ${error.message}`);
  }
}

// -----------------------------------------------------------------------
// メイン処理
// -----------------------------------------------------------------------

async function main() {
  const supabase = createSupabaseClient();

  if (!fs.existsSync(GEO_OUTPUT_DIR)) {
    console.error(`geo-output directory not found: ${GEO_OUTPUT_DIR}`);
    console.error("Run `pnpm generate-geo` first.");
    process.exit(1);
  }

  // 親テンプレートを先に処理: japan-* → pref-* → city-* の順
  const files = fs.readdirSync(GEO_OUTPUT_DIR)
    .filter((f) => f.endsWith(".json"))
    .sort((a, b) => {
      const order = (f) => f.startsWith("japan-") ? 0 : f.startsWith("pref-") ? 1 : 2;
      return order(a) - order(b) || a.localeCompare(b);
    });
  if (files.length === 0) {
    console.error("No JSON files found in geo-output/. Run `pnpm generate-geo` first.");
    process.exit(1);
  }

  console.log(`Seeding ${files.length} template(s) to Supabase...`);

  for (const file of files) {
    const filePath = path.join(GEO_OUTPUT_DIR, file);
    const { template, regions } = JSON.parse(fs.readFileSync(filePath, "utf-8"));

    process.stdout.write(`  ${template.id} (${regions.length} regions)... `);

    await upsertTemplate(supabase, template);
    await upsertRegions(supabase, template.id, regions);

    console.log("✓");
  }

  console.log("Done.");
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
