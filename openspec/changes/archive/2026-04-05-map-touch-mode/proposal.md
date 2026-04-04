## Why

現在の地図操作はマウスイベントのみに依存しており、スマートフォンではパン・タップのいずれも動作しない。スマートフォンでも地図を移動させてエリアを選択できるようにするため、タッチ対応とモード切り替えUIを導入する。

## What Changes

- `edit` / `pan` の2モードを導入する。デフォルトは `edit`（エリアのクリック/タップでモーダルを開く）
- 地図左下にモード切り替えフローティングボタンを追加する（editモード時は ✋ アイコン、panモード時は ↖ アイコン）
- `GeoMapCanvas` にタッチイベント（`onTouchStart` / `onTouchMove` / `onTouchEnd`）を追加する
  - panモード: タッチドラッグ → パン、タップ → 無視
  - editモード: タッチドラッグ → パン、タップ（移動量小） → エリア選択

## Capabilities

### New Capabilities

- `map-mode-toggle`: edit/panモードの切り替えUIと状態管理

### Modified Capabilities

- `geo-map-canvas`: タッチ操作によるパンおよびエリア選択の要件を追加

## Impact

- `src/app/collections/[id]/page.tsx`: `mapMode` stateの追加、モード切り替えボタンの配置
- `src/components/map/GeoMapCanvas.tsx`: タッチイベントハンドラの追加、`mapMode` propの受け取り
