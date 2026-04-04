import type { GeoRegion, NormalizedRegion } from "./types";

/**
 * SVG path 文字列のすべての絶対座標を変換する汎用関数
 * callback(x, y) → [newX, newY] で各座標を変換する
 */
function transformPathCoords(
  pathStr: string,
  callback: (x: number, y: number) => [number, number]
): string {
  return pathStr.replace(
    /([MLHVCSQTAZ])([^MLHVCSQTAZ]*)/gi,
    (_, cmd: string, args: string) => {
      const upper = cmd.toUpperCase();
      if (upper === "Z") return cmd;

      const nums = (args.match(/-?\d+\.?\d*/g) ?? []).map(Number);
      const round = (n: number) => Math.round(n * 10000) / 10000;

      if (upper === "H") {
        return cmd + nums.map((x) => round(callback(x, 0)[0])).join(",");
      }
      if (upper === "V") {
        return cmd + nums.map((y) => round(callback(0, y)[1])).join(",");
      }

      const transformed: number[] = [];
      for (let i = 0; i < nums.length; i += 2) {
        const [nx, ny] = callback(nums[i], nums[i + 1]);
        transformed.push(round(nx), round(ny));
      }
      return cmd + transformed.join(",");
    }
  );
}

/**
 * GeoRegion の path を bounding box 基準で 0〜1 のunit空間に正規化する
 * クリップ編集モーダルで任意サイズにスケーリングするために使う
 */
export function normalizeRegion(region: GeoRegion): NormalizedRegion {
  const { x, y, width, height } = region.bbox;
  const size = Math.max(width, height);

  const normalizedPath = transformPathCoords(region.path, (px, py) => [
    (px - x) / size,
    (py - y) / size,
  ]);

  return {
    id: region.id,
    name: region.name,
    nameEn: region.nameEn,
    normalizedPath,
    originalBbox: region.bbox,
  };
}

/**
 * 正規化済みパスを指定サイズ (displaySize px の正方形) にスケーリングした
 * SVG path 文字列を返す
 */
export function scaledPath(
  normalizedPath: string,
  displaySize: number,
  padding = 8
): string {
  const scale = displaySize - padding * 2;
  return transformPathCoords(normalizedPath, (x, y) => [
    x * scale + padding,
    y * scale + padding,
  ]);
}
