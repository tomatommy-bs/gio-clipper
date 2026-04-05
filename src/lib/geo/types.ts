/** 行政区画の粒度タグ */
export type GeoRegionTag = "prefecture" | "municipality";

/** 1つの行政区画エリア */
export interface GeoRegion {
  id: string;
  name: string;
  nameEn: string;
  tag: GeoRegionTag;
  /** d3-geo で生成した SVG path 文字列（キャンバス座標系） */
  path: string;
  /** キャンバス座標系での bounding box */
  bbox: { x: number; y: number; width: number; height: number };
  /** 離島オフセット量（px） */
  offset: { dx: number; dy: number };
}

/** テンプレートのメタデータ（regions を含まない一覧用） */
export interface GeoTemplateInfo {
  id: string;
  name: string;
  canvasWidth: number;
  canvasHeight: number;
}

/** fetch 後に使えるテンプレート（全データ含む） */
export interface GeoTemplate extends GeoTemplateInfo {
  regions: GeoRegion[];
}

/** テンプレートグループ（グループ内テンプレートは sort_order 昇順） */
export interface GeoTemplateGroup {
  id: string;
  name: string;
  sortOrder: number;
  templates: (GeoTemplateInfo & { sortOrder: number })[];
}

/** 正規化済みパス（0〜1 unit 座標系） */
export interface NormalizedRegion {
  id: string;
  name: string;
  nameEn: string;
  /** bounding box を 0〜1 に正規化した SVG path 文字列 */
  normalizedPath: string;
  /** 元の bbox（スケール計算用） */
  originalBbox: GeoRegion["bbox"];
}
