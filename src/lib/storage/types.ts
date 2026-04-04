/** エリアへの写真割り当て設定 */
export interface RegionAssignment {
  regionId: string;
  /** IndexedDB に保存された写真のキー */
  photoKey: string;
  /** クリップ編集での表示設定 */
  photoSettings: {
    scale: number;   // 倍率（1.0 = デフォルト）
    offsetX: number; // 正規化座標系でのX方向ずらし量
    offsetY: number; // 正規化座標系でのY方向ずらし量
  };
}

/** コレクション */
export interface Collection {
  id: string;
  templateId: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  /** regionId → RegionAssignment */
  assignments: Record<string, RegionAssignment>;
}

/** localStorage に保存するコレクションメタデータ（写真バイナリを除く） */
export type CollectionMeta = Omit<Collection, never>;
