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
      canvas_width: template.canvasWidth,
      canvas_height: template.canvasHeight,
    },
    { onConflict: "id", ignoreDuplicates: true }
  );
  if (error) throw new Error(`upsert geo_templates [${template.id}]: ${error.message}`);
}

async function upsertGroups(supabase) {
  const groups = [
    { id: "group-japan",             name: "日本",           sort_order: 10 },
    { id: "group-hokkaido-tohoku",   name: "北海道・東北",   sort_order: 20 },
    { id: "group-kanto",             name: "関東地方",       sort_order: 30 },
    { id: "group-chubu",             name: "中部地方",       sort_order: 40 },
    { id: "group-kinki",             name: "近畿地方",       sort_order: 50 },
    { id: "group-chugoku-shikoku",   name: "中国・四国地方", sort_order: 60 },
    { id: "group-kyushu-okinawa",    name: "九州・沖縄地方", sort_order: 70 },
  ];

  const { error } = await supabase
    .from("geo_template_groups")
    .upsert(groups, { onConflict: "id" });
  if (error) throw new Error(`upsert geo_template_groups: ${error.message}`);
}

async function upsertGroupMembers(supabase) {
  // 各グループのメンバー: 都道府県の直後にその県の市区を並べる (10刻み)
  const members = [
    // group-japan
    { group_id: "group-japan", template_id: "japan-prefectures", sort_order: 10 },

    // group-hokkaido-tohoku (北海道〜福島: pref-01〜07)
    { group_id: "group-hokkaido-tohoku", template_id: "pref-01", sort_order: 10 },
    { group_id: "group-hokkaido-tohoku", template_id: "city-1100", sort_order: 20 }, // 札幌
    { group_id: "group-hokkaido-tohoku", template_id: "pref-02", sort_order: 30 },
    { group_id: "group-hokkaido-tohoku", template_id: "pref-03", sort_order: 40 },
    { group_id: "group-hokkaido-tohoku", template_id: "pref-04", sort_order: 50 },
    { group_id: "group-hokkaido-tohoku", template_id: "city-4100", sort_order: 60 }, // 仙台
    { group_id: "group-hokkaido-tohoku", template_id: "pref-05", sort_order: 70 },
    { group_id: "group-hokkaido-tohoku", template_id: "pref-06", sort_order: 80 },
    { group_id: "group-hokkaido-tohoku", template_id: "pref-07", sort_order: 90 },

    // group-kanto (茨城〜神奈川: pref-08〜14)
    { group_id: "group-kanto", template_id: "pref-08", sort_order: 10 },
    { group_id: "group-kanto", template_id: "pref-09", sort_order: 20 },
    { group_id: "group-kanto", template_id: "pref-10", sort_order: 30 },
    { group_id: "group-kanto", template_id: "pref-11", sort_order: 40 },
    { group_id: "group-kanto", template_id: "city-11100", sort_order: 50 }, // さいたま
    { group_id: "group-kanto", template_id: "pref-12", sort_order: 60 },
    { group_id: "group-kanto", template_id: "city-12100", sort_order: 70 }, // 千葉
    { group_id: "group-kanto", template_id: "pref-13", sort_order: 80 },
    { group_id: "group-kanto", template_id: "pref-14", sort_order: 90 },
    { group_id: "group-kanto", template_id: "city-14100", sort_order: 100 }, // 横浜
    { group_id: "group-kanto", template_id: "city-14130", sort_order: 110 }, // 川崎
    { group_id: "group-kanto", template_id: "city-14150", sort_order: 120 }, // 相模原

    // group-chubu (新潟〜愛知: pref-15〜23)
    { group_id: "group-chubu", template_id: "pref-15", sort_order: 10 },
    { group_id: "group-chubu", template_id: "city-15100", sort_order: 20 }, // 新潟
    { group_id: "group-chubu", template_id: "pref-16", sort_order: 30 },
    { group_id: "group-chubu", template_id: "pref-17", sort_order: 40 },
    { group_id: "group-chubu", template_id: "pref-18", sort_order: 50 },
    { group_id: "group-chubu", template_id: "pref-19", sort_order: 60 },
    { group_id: "group-chubu", template_id: "pref-20", sort_order: 70 },
    { group_id: "group-chubu", template_id: "pref-21", sort_order: 80 },
    { group_id: "group-chubu", template_id: "pref-22", sort_order: 90 },
    { group_id: "group-chubu", template_id: "city-22100", sort_order: 100 }, // 静岡
    { group_id: "group-chubu", template_id: "city-22130", sort_order: 110 }, // 浜松
    { group_id: "group-chubu", template_id: "pref-23", sort_order: 120 },
    { group_id: "group-chubu", template_id: "city-23100", sort_order: 130 }, // 名古屋

    // group-kinki (三重〜和歌山: pref-24〜30)
    { group_id: "group-kinki", template_id: "pref-24", sort_order: 10 },
    { group_id: "group-kinki", template_id: "pref-25", sort_order: 20 },
    { group_id: "group-kinki", template_id: "pref-26", sort_order: 30 },
    { group_id: "group-kinki", template_id: "city-26100", sort_order: 40 }, // 京都
    { group_id: "group-kinki", template_id: "pref-27", sort_order: 50 },
    { group_id: "group-kinki", template_id: "city-27101", sort_order: 60 }, // 大阪
    { group_id: "group-kinki", template_id: "city-27140", sort_order: 70 }, // 堺
    { group_id: "group-kinki", template_id: "pref-28", sort_order: 80 },
    { group_id: "group-kinki", template_id: "city-28100", sort_order: 90 }, // 神戸
    { group_id: "group-kinki", template_id: "pref-29", sort_order: 100 },
    { group_id: "group-kinki", template_id: "pref-30", sort_order: 110 },

    // group-chugoku-shikoku (鳥取〜高知: pref-31〜39)
    { group_id: "group-chugoku-shikoku", template_id: "pref-31", sort_order: 10 },
    { group_id: "group-chugoku-shikoku", template_id: "pref-32", sort_order: 20 },
    { group_id: "group-chugoku-shikoku", template_id: "pref-33", sort_order: 30 },
    { group_id: "group-chugoku-shikoku", template_id: "city-33100", sort_order: 40 }, // 岡山
    { group_id: "group-chugoku-shikoku", template_id: "pref-34", sort_order: 50 },
    { group_id: "group-chugoku-shikoku", template_id: "city-34100", sort_order: 60 }, // 広島
    { group_id: "group-chugoku-shikoku", template_id: "pref-35", sort_order: 70 },
    { group_id: "group-chugoku-shikoku", template_id: "pref-36", sort_order: 80 },
    { group_id: "group-chugoku-shikoku", template_id: "pref-37", sort_order: 90 },
    { group_id: "group-chugoku-shikoku", template_id: "pref-38", sort_order: 100 },
    { group_id: "group-chugoku-shikoku", template_id: "pref-39", sort_order: 110 },

    // group-kyushu-okinawa (福岡〜沖縄: pref-40〜47)
    { group_id: "group-kyushu-okinawa", template_id: "pref-40", sort_order: 10 },
    { group_id: "group-kyushu-okinawa", template_id: "city-40100", sort_order: 20 }, // 北九州
    { group_id: "group-kyushu-okinawa", template_id: "city-40130", sort_order: 30 }, // 福岡
    { group_id: "group-kyushu-okinawa", template_id: "pref-41", sort_order: 40 },
    { group_id: "group-kyushu-okinawa", template_id: "pref-42", sort_order: 50 },
    { group_id: "group-kyushu-okinawa", template_id: "pref-43", sort_order: 60 },
    { group_id: "group-kyushu-okinawa", template_id: "city-43100", sort_order: 70 }, // 熊本
    { group_id: "group-kyushu-okinawa", template_id: "pref-44", sort_order: 80 },
    { group_id: "group-kyushu-okinawa", template_id: "pref-45", sort_order: 90 },
    { group_id: "group-kyushu-okinawa", template_id: "pref-46", sort_order: 100 },
    { group_id: "group-kyushu-okinawa", template_id: "pref-47", sort_order: 110 },
  ];

  const { error } = await supabase
    .from("geo_template_group_members")
    .upsert(members, { onConflict: "group_id,template_id" });
  if (error) throw new Error(`upsert geo_template_group_members: ${error.message}`);
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
      .upsert(batch, { onConflict: "id,template_id", ignoreDuplicates: true });
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

  console.log("Seeding template groups...");
  await upsertGroups(supabase);
  await upsertGroupMembers(supabase);
  console.log("Done.");
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
