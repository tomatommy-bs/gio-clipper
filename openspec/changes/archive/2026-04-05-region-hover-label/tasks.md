## 1. GeoMapCanvas にホバー状態を追加

- [x] 1.1 `hoveredRegionId: string | null` を useState で追加する
- [x] 1.2 各 `<g>` に `onMouseEnter` / `onMouseLeave` ハンドラを追加し、ドラッグ中（`isPanning`）は無視する

## 2. ホバーラベルの描画

- [x] 2.1 ホバー中のエリアのbboxセンターに `<text>` 要素でエリア名を描画する
- [x] 2.2 フォントサイズに `1 / transform.scale` を乗じてズーム倍率に依存しない表示サイズにする
- [x] 2.3 `pointer-events: none` を設定してラベルがクリック・ホバーイベントに干渉しないようにする
