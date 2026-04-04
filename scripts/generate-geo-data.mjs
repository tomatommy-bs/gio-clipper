/**
 * GeoJSON → SVGパス変換スクリプト
 * 日本の行政区画GeoJSONをSVGパス文字列とbounding boxのJSONに変換する
 *
 * Usage: node scripts/generate-geo-data.mjs
 */

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { geoMercator, geoPath } from "d3-geo";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

// -----------------------------------------------------------------------
// 設定
// -----------------------------------------------------------------------

/** 出力先SVGのキャンバスサイズ */
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 900;

/**
 * 離島オフセット設定
 * 本土から遠い島を天気予報風にずらして表示する
 * key: GeoJSON の id プロパティ
 * value: [dx, dy] ピクセル単位のオフセット量（正規化前の投影座標ではなくキャンバス座標）
 */
const ISLAND_OFFSETS = {
  47: { dx: 160, dy: -340 }, // 沖縄県: 本来の位置から北東にずらす
};

// -----------------------------------------------------------------------
// メイン処理
// -----------------------------------------------------------------------

function main() {
  const geojsonPath = path.join(
    ROOT,
    "scripts/geo-source/japan-prefectures.geojson"
  );
  const outputDir = path.join(ROOT, "public/geo-data");
  const outputPath = path.join(outputDir, "japan-prefectures.json");

  const geojson = JSON.parse(fs.readFileSync(geojsonPath, "utf-8"));

  // メルカトル投影を設定（日本全体が収まるようにfitExtentで自動スケール）
  const projection = geoMercator().fitExtent(
    [
      [10, 10],
      [CANVAS_WIDTH - 10, CANVAS_HEIGHT - 10],
    ],
    geojson
  );

  const pathGenerator = geoPath().projection(projection);

  const regions = geojson.features.map((feature) => {
    const id = feature.properties.id;
    const offset = ISLAND_OFFSETS[id] ?? { dx: 0, dy: 0 };

    // SVGパス文字列を生成
    const rawPath = pathGenerator(feature);
    if (!rawPath) {
      console.warn(`Warning: empty path for ${feature.properties.nam_ja}`);
      return null;
    }

    // オフセットを適用したパスに変換
    const svgPath = applyOffset(rawPath, offset.dx, offset.dy);

    // bounding boxを計算（オフセット後）
    const bbox = computeBbox(svgPath);

    return {
      id: String(id),
      name: feature.properties.nam_ja,
      nameEn: feature.properties.nam,
      path: svgPath,
      bbox,
      offset: { dx: offset.dx, dy: offset.dy },
    };
  }).filter(Boolean);

  // 出力ディレクトリを作成
  fs.mkdirSync(outputDir, { recursive: true });

  const output = {
    canvasWidth: CANVAS_WIDTH,
    canvasHeight: CANVAS_HEIGHT,
    regions,
  };

  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), "utf-8");

  console.log(`✓ Generated ${regions.length} prefectures → ${outputPath}`);
  console.log(`  Canvas: ${CANVAS_WIDTH}x${CANVAS_HEIGHT}`);
  console.log(
    `  Offsets applied: ${
      Object.keys(ISLAND_OFFSETS)
        .map((id) => regions.find((r) => r?.id === id)?.name)
        .filter(Boolean)
        .join(", ") || "none"
    }`
  );
}

// -----------------------------------------------------------------------
// ユーティリティ
// -----------------------------------------------------------------------

/**
 * SVGパス文字列の全座標にオフセットを加算する
 * translate変換を使わずにパス座標を直接シフトする
 */
function applyOffset(pathStr, dx, dy) {
  if (dx === 0 && dy === 0) return pathStr;

  // SVGパスコマンドを解析して座標にオフセットを加算
  // 絶対座標コマンド (M, L, C, Q, A, Z) のみを対象とする
  return pathStr.replace(
    /([MLHVCSQTAZ])([^MLHVCSQTAZ]*)/gi,
    (match, cmd, args) => {
      const upper = cmd.toUpperCase();

      if (upper === "Z") return cmd;

      if (upper === "H") {
        // 水平線: x座標のみ
        const nums = parseNums(args);
        return cmd + nums.map((n) => round(n + dx)).join(",");
      }
      if (upper === "V") {
        // 垂直線: y座標のみ
        const nums = parseNums(args);
        return cmd + nums.map((n) => round(n + dy)).join(",");
      }

      // その他のコマンド: 座標ペアとして処理
      const nums = parseNums(args);
      const shifted = nums.map((n, i) =>
        i % 2 === 0 ? round(n + dx) : round(n + dy)
      );
      return cmd + shifted.join(",");
    }
  );
}

function parseNums(str) {
  return (str.match(/-?\d+\.?\d*/g) || []).map(Number);
}

function round(n) {
  return Math.round(n * 100) / 100;
}

/**
 * SVGパス文字列のbounding boxを近似計算する
 * (パス内の全座標の最小・最大値を使う簡易実装)
 */
function computeBbox(pathStr) {
  const xs = [];
  const ys = [];

  pathStr.replace(/([MLHVCSQTAZ])([^MLHVCSQTAZ]*)/gi, (_, cmd, args) => {
    const upper = cmd.toUpperCase();
    if (upper === "Z") return;

    const values = parseNums(args);

    if (upper === "H") {
      values.forEach((v) => xs.push(v));
    } else if (upper === "V") {
      values.forEach((v) => ys.push(v));
    } else {
      values.forEach((v, i) => {
        if (i % 2 === 0) xs.push(v);
        else ys.push(v);
      });
    }
  });

  if (xs.length === 0 || ys.length === 0) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }

  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const maxX = Math.max(...xs);
  const maxY = Math.max(...ys);

  return {
    x: round(minX),
    y: round(minY),
    width: round(maxX - minX),
    height: round(maxY - minY),
  };
}

function generateTokyoWards() {
  const geojsonPath = path.join(ROOT, "scripts/geo-source/tokyo-wards.geojson");
  const outputDir = path.join(ROOT, "public/geo-data");
  const outputPath = path.join(outputDir, "tokyo-wards.json");

  const geojson = JSON.parse(fs.readFileSync(geojsonPath, "utf-8"));

  // 23特別区のみ抽出
  const filtered = {
    ...geojson,
    features: geojson.features.filter(
      (f) => f.properties.area_ja === "都区部"
    ),
  };

  const projection = geoMercator().fitExtent(
    [
      [10, 10],
      [CANVAS_WIDTH - 10, CANVAS_HEIGHT - 10],
    ],
    filtered
  );
  const pathGenerator = geoPath().projection(projection);

  const regions = filtered.features.map((feature) => {
    const code = String(feature.properties.code);
    const rawPath = pathGenerator(feature);
    if (!rawPath) return null;
    const bbox = computeBbox(rawPath);
    return {
      id: code,
      name: feature.properties.ward_ja,
      nameEn: feature.properties.ward_en,
      path: rawPath,
      bbox,
      offset: { dx: 0, dy: 0 },
    };
  }).filter(Boolean);

  fs.mkdirSync(outputDir, { recursive: true });
  const output = { canvasWidth: CANVAS_WIDTH, canvasHeight: CANVAS_HEIGHT, regions };
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), "utf-8");
  console.log(`✓ Generated ${regions.length} Tokyo wards → ${outputPath}`);
}

main();
generateTokyoWards();
