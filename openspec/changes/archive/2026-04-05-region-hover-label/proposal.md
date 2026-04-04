## Why

マップ上のエリアをホバーしたとき、どの県・区なのかが視覚的にわかりにくい。特にエリアが密集している地域では、クリックする前に対象を確認できないため誤操作につながる。

## What Changes

- エリアにマウスオーバーした際、そのエリア名（都道府県名・区名など）をツールチップまたはラベルとして表示する
- ホバー離脱時にラベルを非表示にする
- GeoMapCanvas 内のホバー状態管理を追加する

## Capabilities

### New Capabilities

- `region-hover-label`: マップ上のエリアをホバーしたときにエリア名ラベルを表示する機能

### Modified Capabilities

- `geo-map-canvas`: ホバー状態の管理とラベル表示のための要件を追加

## Impact

- `src/components/map/GeoMapCanvas.tsx`: ホバー状態の追跡・ラベルレンダリングを追加
- GeoJSONテンプレートの各リージョンに `name` フィールドが必要（既存データの確認が必要）
