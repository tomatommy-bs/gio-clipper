/** 1つの行政区画エリア */
export interface GeoRegion {
  id: string;
  name: string;
  nameEn: string;
  /** d3-geo で生成した SVG path 文字列（キャンバス座標系） */
  path: string;
  /** キャンバス座標系での bounding box */
  bbox: { x: number; y: number; width: number; height: number };
  /** 離島オフセット量（px） */
  offset: { dx: number; dy: number };
}

/** テンプレートのメタデータ（fetch 前に使える情報） */
export interface GeoTemplateInfo {
  id: string;
  name: string;
  /** 親テンプレートID（都道府県テンプレートの場合、対応する都道府県ID） */
  parentId?: string;
  /** 含まれるエリア数 */
  regionCount: number;
  /** geo-data/ 以下の JSON ファイル名 */
  dataFile: string;
}

/** fetch 後に使えるテンプレート（全データ含む） */
export interface GeoTemplate extends GeoTemplateInfo {
  canvasWidth: number;
  canvasHeight: number;
  regions: GeoRegion[];
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
