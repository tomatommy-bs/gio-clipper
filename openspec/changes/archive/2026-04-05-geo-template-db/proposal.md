## Why

テンプレートが静的ファイルとしてバンドルされているため、新しい都道府県の市区町村テンプレートを追加するたびにデプロイが必要になる。Supabase（PostgreSQL）にテンプレートデータを移行し、BFF API 経由で取得することで、データとコードを分離する。

## What Changes

- **BREAKING**: `template-registry.ts` の静的レジストリおよびローカルファイル取得を廃止し、BFF API 呼び出しに全面移行する
- **BREAKING**: 既存テンプレートID（`tokyo-wards` など）は廃止し、新規 ID 体系（`pref-{JIS2桁}`）に統一する
- Supabase CLI + Docker Compose によるローカル開発環境を整備する
- `geo_templates` / `geo_regions` の2テーブルを定義・マイグレーションで管理する
- `GeoRegion` 型に `tag` フィールド（`'都'|'道'|'府'|'県'|'市'|'区'|'町'|'村'`）を追加する
- BFF API `GET /api/templates` と `GET /api/templates/[id]` を実装する
- vitest を導入し、API ルートのユニットテストを整備する

## Capabilities

### New Capabilities

- `geo-bff-api`: テンプレート一覧・詳細を返す BFF API エンドポイント
- `supabase-local`: Supabase CLI を用いたローカル完結型の開発環境

### Modified Capabilities

- `geo-template-library`: テンプレートの取得元が静的ファイルから DB（BFF API 経由）に変わる。`tag` フィールドが追加される

## Impact

- `src/lib/geo/template-registry.ts`: 全面書き換え（静的レジストリ廃止）
- `src/lib/geo/types.ts`: `GeoRegion` に `tag` 追加
- `src/app/api/templates/` — 新規 Route Handlers
- `supabase/migrations/` — 新規 SQL マイグレーション
- 追加パッケージ: `@supabase/supabase-js`, `supabase` (CLI dev dep), `vitest`, `@vitejs/plugin-react`
- 既存コレクションデータ（localStorage）は templateId が変わるため無効になる（既存データは無視）
