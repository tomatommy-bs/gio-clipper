## Why

現在のマップキャンバスはホイールスクロールとドラッグのみでズーム・パンを操作する。これらのジェスチャーは慣れたユーザーには快適だが、現在のズーム率が視覚的にわからず、意図した倍率に調整しにくい。また、マウスのないタッチパッド環境やモバイルブラウザでは操作が直感的でない。Figmaのように画面端に常駐するコントロールパネルを設けることで、操作の発見可能性と精度を高める。

## What Changes

- マップキャンバス上に常駐するズームコントロールパネルを追加する
- 現在のズーム率をパーセント表示する
- ズームイン・ズームアウトボタンを設ける
- 上下左右の矢印ボタンでパン移動できるようにする
- 「マップ全体を表示」（フィットビュー）ボタンを設ける

## Capabilities

### New Capabilities

- `map-zoom-controls`: マップキャンバス上のズーム・パン操作UIパネル

### Modified Capabilities

- `geo-map-canvas`: ズーム・パン操作の外部制御インターフェースを追加（既存のホイール・ドラッグ操作は維持）

## Impact

- `src/components/map/GeoMapCanvas.tsx` — transform 状態の外部制御 props を追加
- `src/components/map/MapZoomControls.tsx` — 新規コンポーネント
- `src/app/collections/[id]/page.tsx` — ZoomControls の配置
