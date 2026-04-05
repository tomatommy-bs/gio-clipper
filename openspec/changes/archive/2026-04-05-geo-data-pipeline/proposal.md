## Why

`geo-template-db` で Supabase DB 基盤を整備したが、実際のテンプレートデータが DB に入っていない。国土交通省（国土数値情報）の GeoJSON を元に全47都道府県の市区町村 SVG データを生成し、Supabase にシードするパイプラインが必要。

## What Changes

- `scripts/generate-geo-data.mjs` を汎用化する（N03 プロパティ対応、dissolve 対応、複数ファイル一括処理）
- `scripts/seed-supabase.mjs` を新規作成し、生成 JSON を `geo_templates` / `geo_regions` テーブルに UPSERT する
- `topojson-server` / `topojson-client` を導入し、同一行政区域コードのポリゴンを dissolve（マージ）する
- 既存の `japan-prefectures` テンプレートも新スキーマで再生成・再投入する
- vitest で dissolve ロジック・name 生成ロジックをユニットテストする

## Capabilities

### New Capabilities

- `geo-data-pipeline`: GeoJSON → SVG path 変換 + dissolve + Supabase seed の一連のスクリプト群

### Modified Capabilities

なし（`geo-template-library` の要件はすでに `geo-template-db` で変更済み）

## Impact

- `scripts/generate-geo-data.mjs`: 全面改修
- `scripts/seed-supabase.mjs`: 新規作成
- `scripts/geo-source/`: 国土数値情報 GeoJSON（47 ファイル）を配置する場所
- 追加パッケージ: `topojson-server`, `topojson-client`（scripts 専用、devDependencies）
- 前提: `geo-template-db` が実装済みで `supabase start` でローカル DB が起動していること
