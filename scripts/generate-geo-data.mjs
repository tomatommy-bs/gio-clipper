/**
 * GeoJSON → SVGパス変換スクリプト（N03 汎用版）
 *
 * Usage:
 *   node scripts/generate-geo-data.mjs <file.geojson>
 *   node scripts/generate-geo-data.mjs <directory/>
 *   node scripts/generate-geo-data.mjs <file.geojson> --city <市名>
 *
 * 出力先: scripts/geo-output/<templateId>.json
 */

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { geoMercator, geoPath } from "d3-geo";
import { topology } from "topojson-server";
import { merge } from "topojson-client";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 900;

// -----------------------------------------------------------------------
// N03 パーサー
// -----------------------------------------------------------------------

/** N03 プロパティを読み取る */
export function parseN03Props(feature) {
  const p = feature.properties ?? {};
  return {
    code: p.N03_007 ?? null,
    pref: p.N03_001 ?? null,
    district: p.N03_003 ?? null,
    city: p.N03_004 ?? null,
  };
}

/**
 * N03_003 + N03_004 を結合して name を生成する
 *
 * - N03_003 が null → name = N03_004（一般市）
 * - N03_003 が存在 → name = N03_003 + N03_004（政令市区・郡部）
 * - N03_004 も null → name = N03_001（都道府県テンプレート）
 */
export function buildNameFromN03({ pref, district, city }) {
  if (!city) return pref ?? "";
  if (!district) return city;
  return district + city;
}

/**
 * N03_004 の有無から tag を生成する
 *
 * - N03_004 あり → 'municipality'（市区町村）
 * - N03_004 なし → 'prefecture'（都道府県）
 */
export function buildTagFromN03({ city }) {
  return city ? "municipality" : "prefecture";
}

// -----------------------------------------------------------------------
// Dissolve
// -----------------------------------------------------------------------

/**
 * 同一 N03_007 コードのフィーチャーを dissolve して1エントリにまとめる
 * N03_007 が null のフィーチャーはスキップしてログ出力する
 */
export function dissolveByCode(features) {
  const groups = {};

  for (const f of features) {
    const code = f.properties?.N03_007 ?? null;
    if (!code) {
      const name = f.properties?.N03_004 ?? f.properties?.N03_001 ?? "(unknown)";
      console.warn(`[skip] N03_007 is null — ${name}`);
      continue;
    }
    if (!groups[code]) groups[code] = [];
    groups[code].push(f);
  }

  const results = [];
  for (const [code, feats] of Object.entries(groups)) {
    const topo = topology({ g: { type: "FeatureCollection", features: feats } });
    const mergedGeometry = merge(topo, topo.objects.g.geometries);
    const props = parseN03Props(feats[0]);
    results.push({ code, props, geometry: mergedGeometry });
  }

  return results;
}

// -----------------------------------------------------------------------
// SVG ユーティリティ
// -----------------------------------------------------------------------

/** SVGパス文字列の全座標にオフセットを加算する */
export function applyOffset(pathStr, dx, dy) {
  if (dx === 0 && dy === 0) return pathStr;

  return pathStr.replace(/([MLHVCSQTAZ])([^MLHVCSQTAZ]*)/gi, (match, cmd, args) => {
    const upper = cmd.toUpperCase();
    if (upper === "Z") return cmd;

    const nums = parseNums(args);

    if (upper === "H") return cmd + nums.map((n) => round(n + dx)).join(",");
    if (upper === "V") return cmd + nums.map((n) => round(n + dy)).join(",");

    const shifted = nums.map((n, i) => (i % 2 === 0 ? round(n + dx) : round(n + dy)));
    return cmd + shifted.join(",");
  });
}

/** SVGパス文字列の bounding box を計算する */
export function computeBbox(pathStr) {
  const xs = [];
  const ys = [];

  pathStr.replace(/([MLHVCSQTAZ])([^MLHVCSQTAZ]*)/gi, (_, cmd, args) => {
    const upper = cmd.toUpperCase();
    if (upper === "Z") return;
    const values = parseNums(args);
    if (upper === "H") values.forEach((v) => xs.push(v));
    else if (upper === "V") values.forEach((v) => ys.push(v));
    else values.forEach((v, i) => (i % 2 === 0 ? xs.push(v) : ys.push(v)));
  });

  if (xs.length === 0 || ys.length === 0) return { x: 0, y: 0, width: 0, height: 0 };

  const minX = xs.reduce((a, b) => Math.min(a, b), Infinity);
  const maxX = xs.reduce((a, b) => Math.max(a, b), -Infinity);
  const minY = ys.reduce((a, b) => Math.min(a, b), Infinity);
  const maxY = ys.reduce((a, b) => Math.max(a, b), -Infinity);
  return {
    x: round(minX),
    y: round(minY),
    width: round(maxX - minX),
    height: round(maxY - minY),
  };
}

function parseNums(str) {
  return (str.match(/-?\d+\.?\d*/g) ?? []).map(Number);
}

function round(n) {
  return Math.round(n * 100) / 100;
}

// -----------------------------------------------------------------------
// N03 ファイル処理
// -----------------------------------------------------------------------

/**
 * N03 GeoJSON ファイルを処理して pref-XX テンプレート JSON を生成する
 * ファイル名は N03_XX.geojson 形式（XX = 2桁の都道府県コード）
 */
export function processN03File(inputPath) {
  const filename = path.basename(inputPath, ".geojson");
  const match = filename.match(/N03_0*(\d+)/);
  if (!match) throw new Error(`Invalid filename: ${filename} (expected N03_XX.geojson)`);

  const prefCode = match[1].padStart(2, "0");
  const templateId = `pref-${prefCode}`;

  const geojson = JSON.parse(fs.readFileSync(inputPath, "utf-8"));
  const dissolved = dissolveByCode(geojson.features);

  const prefName = geojson.features[0]?.properties?.N03_001 ?? "";

  const projection = geoMercator().fitExtent(
    [[10, 10], [CANVAS_WIDTH - 10, CANVAS_HEIGHT - 10]],
    geojson
  );
  const pathGenerator = geoPath().projection(projection);

  const regions = [];
  for (const { code, props, geometry } of dissolved) {
    const rawPath = pathGenerator({ type: "Feature", geometry, properties: {} });
    if (!rawPath) {
      console.warn(`[warn] empty path for code ${code}`);
      continue;
    }
    const bbox = computeBbox(rawPath);
    regions.push({
      id: code,
      name: buildNameFromN03(props),
      nameEn: "",
      tag: buildTagFromN03(props),
      path: rawPath,
      bbox,
      offset: { dx: 0, dy: 0 },
    });
  }

  console.log(`  ${templateId}: ${regions.length} regions (${dissolved.length} codes)`);

  return {
    template: {
      id: templateId,
      name: `${prefName}（市区町村）`,
      canvasWidth: CANVAS_WIDTH,
      canvasHeight: CANVAS_HEIGHT,
    },
    regions,
  };
}

// -----------------------------------------------------------------------
// 政令市テンプレート処理
// -----------------------------------------------------------------------

/**
 * N03 GeoJSON から特定の政令市の区テンプレートを生成する
 * テンプレート ID は ward コードの先頭3桁 + "00"（例: "14101" → "city-14100"）
 */
export function processCityFile(inputPath, cityName) {
  const geojson = JSON.parse(fs.readFileSync(inputPath, "utf-8"));

  const cityFeatures = geojson.features.filter(
    (f) => f.properties?.N03_003 === cityName
  );

  if (cityFeatures.length === 0) {
    throw new Error(`City not found in GeoJSON: "${cityName}"`);
  }

  const dissolved = dissolveByCode(cityFeatures);

  // ward コードの最小値 - 1 で市コードを導出（例: 14131→14130）
  const wardCodes = dissolved.map((d) => parseInt(d.code)).filter(Boolean);
  const cityCode = String(Math.min(...wardCodes) - 1);
  const templateId = `city-${cityCode}`;

  const projection = geoMercator().fitExtent(
    [[10, 10], [CANVAS_WIDTH - 10, CANVAS_HEIGHT - 10]],
    { type: "FeatureCollection", features: cityFeatures }
  );
  const pathGenerator = geoPath().projection(projection);

  const regions = [];
  for (const { code, props, geometry } of dissolved) {
    const rawPath = pathGenerator({ type: "Feature", geometry, properties: {} });
    if (!rawPath) {
      console.warn(`[warn] empty path for code ${code}`);
      continue;
    }
    const bbox = computeBbox(rawPath);
    regions.push({
      id: code,
      name: props.city ?? "",
      nameEn: "",
      tag: "municipality",
      path: rawPath,
      bbox,
      offset: { dx: 0, dy: 0 },
    });
  }

  console.log(`  ${templateId} (${cityName}): ${regions.length} wards`);

  return {
    template: {
      id: templateId,
      name: `${cityName}（区）`,
      canvasWidth: CANVAS_WIDTH,
      canvasHeight: CANVAS_HEIGHT,
    },
    regions,
  };
}

// -----------------------------------------------------------------------
// japan-prefectures 処理（既存フォーマット）
// -----------------------------------------------------------------------

const ISLAND_OFFSETS = {
  47: { dx: 160, dy: -340 },
};

export function processJapanPrefectures() {
  const geojsonPath = path.join(ROOT, "scripts/geo-source/japan-prefectures.geojson");
  const geojson = JSON.parse(fs.readFileSync(geojsonPath, "utf-8"));

  const projection = geoMercator().fitExtent(
    [[10, 10], [CANVAS_WIDTH - 10, CANVAS_HEIGHT - 10]],
    geojson
  );
  const pathGenerator = geoPath().projection(projection);

  const regions = geojson.features
    .map((feature) => {
      const id = feature.properties.id;
      const offset = ISLAND_OFFSETS[id] ?? { dx: 0, dy: 0 };
      const rawPath = pathGenerator(feature);
      if (!rawPath) {
        console.warn(`[warn] empty path for ${feature.properties.nam_ja}`);
        return null;
      }
      const svgPath = applyOffset(rawPath, offset.dx, offset.dy);
      return {
        id: String(id),
        name: feature.properties.nam_ja,
        nameEn: feature.properties.nam,
        tag: "prefecture",
        path: svgPath,
        bbox: computeBbox(svgPath),
        offset,
      };
    })
    .filter(Boolean);

  console.log(`  japan-prefectures: ${regions.length} regions`);

  return {
    template: {
      id: "japan-prefectures",
      name: "日本全国（都道府県）",
      canvasWidth: CANVAS_WIDTH,
      canvasHeight: CANVAS_HEIGHT,
    },
    regions,
  };
}

// -----------------------------------------------------------------------
// 出力
// -----------------------------------------------------------------------

function writeOutput(result, outputDir) {
  fs.mkdirSync(outputDir, { recursive: true });
  const outputPath = path.join(outputDir, `${result.template.id}.json`);
  fs.writeFileSync(outputPath, JSON.stringify(result, null, 2), "utf-8");
  return outputPath;
}

// -----------------------------------------------------------------------
// CLI エントリポイント
// -----------------------------------------------------------------------

function main() {
  const args = process.argv.slice(2);
  const outputDir = path.join(ROOT, "scripts/geo-output");

  if (args.length === 0) {
    // 引数なし: japan-prefectures のみ生成
    console.log("Generating japan-prefectures...");
    const result = processJapanPrefectures();
    const out = writeOutput(result, outputDir);
    console.log(`✓ Written: ${out}`);
    return;
  }

  // --city <市名> オプションの解析
  const cityFlagIdx = args.indexOf("--city");
  const cityName = cityFlagIdx !== -1 ? args[cityFlagIdx + 1] : null;
  const fileArgs = cityFlagIdx !== -1
    ? args.filter((a, i) => i !== cityFlagIdx && i !== cityFlagIdx + 1)
    : args;

  const target = path.resolve(fileArgs[0]);
  const stat = fs.statSync(target);

  const files = stat.isDirectory()
    ? fs.readdirSync(target)
        .filter((f) => f.endsWith(".geojson"))
        .map((f) => path.join(target, f))
    : [target];

  console.log(`Processing ${files.length} file(s)${cityName ? ` (city: ${cityName})` : ""}...`);

  for (const file of files) {
    try {
      const result = cityName
        ? processCityFile(file, cityName)
        : processN03File(file);
      const out = writeOutput(result, outputDir);
      console.log(`✓ Written: ${out}`);
    } catch (err) {
      console.error(`✗ Failed: ${file} — ${err.message}`);
    }
  }
}

// スクリプトとして直接実行された場合のみ main() を呼ぶ
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
