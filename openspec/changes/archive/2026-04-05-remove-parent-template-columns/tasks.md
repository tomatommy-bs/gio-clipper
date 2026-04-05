## 1. DB マイグレーション

- [x] 1.1 `supabase/migrations/20260405000004_drop_parent_columns.sql` を作成し `ALTER TABLE geo_templates DROP COLUMN parent_template_id, DROP COLUMN parent_region_id;` を追加
- [x] 1.2 ローカルで `supabase db reset` を実行しマイグレーションが正常に適用されることを確認

## 2. スクリプト

- [x] 2.1 `scripts/generate-geo-data.mjs` から `parentTemplateId`・`parentRegionId` フィールドの生成コードを削除
- [x] 2.2 `scripts/seed-supabase.mjs` から `parent_template_id`・`parent_region_id` のINSERTカラムを削除

## 3. 型・API

- [x] 3.1 `src/lib/geo/types.ts` の `GeoTemplate` 型から `parentTemplateId?`・`parentRegionId?` を削除
- [x] 3.2 `src/app/api/templates/route.ts` のSELECT句・レスポンスマッピングからこれらフィールドを削除
- [x] 3.3 `src/app/api/templates/[id]/route.ts` のSELECT句・レスポンスマッピングからこれらフィールドを削除

## 4. テスト・確認

- [x] 4.1 `src/app/api/templates/__tests__/route.test.ts` のテストデータ・アサーションを更新
- [x] 4.2 `pnpm seed` でローカルDBへのシードが正常に完了することを確認
- [x] 4.3 `pnpm test` でテストがすべて通ることを確認
