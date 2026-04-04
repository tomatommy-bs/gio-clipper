## 1. GeoMapCanvas のリファクタリング

- [x] 1.1 `transform` state を `GeoMapCanvas` から `CollectionPage` に引き上げる
- [x] 1.2 `GeoMapCanvas` に `transform` と `onTransformChange` props を追加する
- [x] 1.3 既存のホイール・ドラッグ操作が引き上げ後も正常に動作することを確認する

## 2. MapZoomControls コンポーネント

- [x] 2.1 `src/components/map/MapZoomControls.tsx` を新規作成する
- [x] 2.2 上下左右のパン矢印ボタンを実装する（中央にフィットビューボタン）
- [x] 2.3 ズームイン（+）・ズームアウト（−）ボタンを実装する
- [x] 2.4 現在のズーム率をパーセント表示する
- [x] 2.5 フィットビューボタンで transform をリセットする

## 3. CollectionPage への組み込み

- [x] 3.1 `CollectionPage` に `MapZoomControls` を画面右下に配置する
- [x] 3.2 transform state・ハンドラを `GeoMapCanvas` と `MapZoomControls` に渡す
