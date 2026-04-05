## 1. Supabase ローカル環境セットアップ

- [x] 1.1 `brew install supabase/tap/supabase` で Supabase CLI をインストールする（README に手順を追記）
- [x] 1.2 `supabase init` でプロジェクトを初期化し、`supabase/` ディレクトリを生成する
- [x] 1.3 `supabase/migrations/20260405000001_geo_tags.sql` を作成し、`geo_tags` テーブルを定義してシードデータ（prefecture/municipality）を INSERT する
- [x] 1.4 `supabase/migrations/20260405000002_geo_templates.sql` を作成し、`geo_templates` テーブルを定義する
- [x] 1.5 `supabase/migrations/20260405000003_geo_regions.sql` を作成し、`geo_regions` テーブルと `tag_id → geo_tags(id)` 外部キー・複合主キー・インデックスを定義する
- [x] 1.6 `supabase start` でローカル環境を起動し、マイグレーションが正常に適用されることを確認する
- [x] 1.7 `.env.local.example` に `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` を追記する

## 2. パッケージ導入

- [x] 2.1 `pnpm add @supabase/supabase-js` でクライアントライブラリを追加する
- [x] 2.2 `pnpm add -D vitest @vitejs/plugin-react` でテストフレームワークを追加する
- [x] 2.3 `vitest.config.ts` を作成し、`src/` 配下の `*.test.ts` を対象にする
- [x] 2.4 `package.json` に `"test": "vitest"` スクリプトを追加する

## 3. Supabase クライアント

- [x] 3.1 `src/lib/supabase/client.ts` を作成し、ブラウザ用 Supabase クライアントを export する
- [x] 3.2 `src/lib/supabase/server.ts` を作成し、サーバー用（Route Handler 用）Supabase クライアントを export する

## 4. 型定義の更新

- [x] 4.1 `src/lib/geo/types.ts` に `GeoRegionTag = 'prefecture' | 'municipality'` を追加し、`GeoRegion` の `tag: GeoRegionTag` フィールドを追加する

## 5. BFF API 実装

- [x] 5.1 `src/app/api/templates/route.ts` を作成し、`GET /api/templates` を実装する（`geo_templates` を SELECT し `geo_regions` は含めない）
- [x] 5.2 `src/app/api/templates/[id]/route.ts` を作成し、`GET /api/templates/[id]` を実装する（`geo_regions` を JOIN して `GeoTemplate` 互換 JSON を返す）
- [x] 5.3 存在しない ID に対して HTTP 404 を返す処理を追加する

## 6. Gateway ファイルの作成

- [x] 6.1 `src/lib/geo/geo-template.gateway.bff.ts` を新規作成し、`listTemplatesFromApi()` を実装する（`GET /api/templates` を呼ぶ）
- [x] 6.2 `fetchTemplateFromApi(id: string)` を実装する（`GET /api/templates/[id]` を呼ぶ）

## 7. template-registry.ts の書き換え

- [x] 7.1 `TEMPLATE_REGISTRY` 定数と静的ファイル取得ロジックを削除する
- [x] 7.2 `listTemplates()` を `geo-template.gateway.bff.ts` の `listTemplatesFromApi()` を呼ぶよう実装する
- [x] 7.3 `fetchTemplate(id)` を `fetchTemplateFromApi(id)` を呼ぶよう書き換える
- [x] 7.4 `getTemplateInfo()` を `listTemplates()` ベースに更新するか削除する

## 8. テスト

- [x] 8.1 BFF API のロジック（404 ハンドリング・レスポンス形式）の vitest ユニットテストを作成する
- [x] 8.2 `pnpm test` が通ることを確認する
