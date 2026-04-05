## 1. DB マイグレーション

- [x] 1.1 `geo_template_groups` テーブルを作成するマイグレーションSQLを追加
- [x] 1.2 `geo_template_group_members` テーブルを作成するマイグレーションSQLを追加
- [x] 1.3 ローカル DB にマイグレーションを適用して動作確認

## 2. シードデータ

- [x] 2.1 `seed-supabase.mjs` に地方グループ定義データを追加（7グループ）
- [x] 2.2 `seed-supabase.mjs` に各グループのメンバーデータを追加（都道府県 + 市区の順序付き）
- [x] 2.3 `pnpm seed` でローカル DB にシードを適用して確認
- [x] 2.4 `pnpm seed:remote` でリモート DB にシードを適用

## 3. BFF API

- [x] 3.1 `GET /api/template-groups` エンドポイントを実装（グループ一覧 + テンプレートメタデータ）
- [x] 3.2 グループ内テンプレートが `sort_order` 昇順で返ることを確認

## 4. 型定義

- [x] 4.1 `GeoTemplateGroup` 型を追加（`id`, `name`, `sort_order`, `templates`）
- [x] 4.2 Supabase の TypeScript 型を再生成（`pnpm supabase:gen-types` 等）
