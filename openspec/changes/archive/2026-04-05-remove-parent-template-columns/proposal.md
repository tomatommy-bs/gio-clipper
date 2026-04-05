## Why

`geo_templates` の `parent_template_id` と `parent_region_id` はドリルダウンナビゲーション用として定義されたが、フロントエンドで一度も参照されておらず未使用のまま残っている。`geo_template_groups` によるグループ管理を導入するにあたり、用途の重複・混乱を避けるために削除する。

## What Changes

- **BREAKING** `geo_templates` テーブルから `parent_template_id`、`parent_region_id` カラムを削除するマイグレーションを追加
- `GET /api/templates` および `GET /api/templates/[id]` のレスポンスから `parentTemplateId`、`parentRegionId` フィールドを削除
- `GeoTemplate` 型定義からこれらのフィールドを削除
- シード生成スクリプト (`generate-geo-data.mjs`) および投入スクリプト (`seed-supabase.mjs`) からこれらのフィールドを削除
- テストを更新

## Capabilities

### New Capabilities

なし

### Modified Capabilities

- `geo-bff-api`: テンプレート一覧・詳細 API のレスポンスから `parentTemplateId`、`parentRegionId` を削除
- `geo-template-library`: テンプレート階層の表現方法が変わる（ドリルダウン用カラムを持たない）

## Impact

- DB: マイグレーションでカラム削除（非可逆）
- API: レスポンスのフィールド減少（破壊的変更だがクライアントで未使用）
- 型: `GeoTemplate` 型から2フィールド削除
- スクリプト: `generate-geo-data.mjs`, `seed-supabase.mjs`
- テスト: `src/app/api/templates/__tests__/route.test.ts`
