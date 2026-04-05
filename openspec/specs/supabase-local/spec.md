## Requirements

### Requirement: ローカル完結型 Supabase 環境
開発者は `supabase start` 一コマンドでローカル DB・API・Studio を起動できなければならない（SHALL）。外部サービスへの接続は不要とする。

#### Scenario: ローカル環境の起動
- **WHEN** 開発者が `supabase start` を実行する
- **THEN** PostgreSQL（:54322）、PostgREST API（:54321）、Supabase Studio（:54323）が起動し、接続可能になる

#### Scenario: マイグレーションの自動適用
- **WHEN** `supabase start` を実行する
- **THEN** `supabase/migrations/` 内の SQL が順番に適用され、`geo_tags`・`geo_templates`・`geo_regions` テーブルが存在する状態になる

### Requirement: DBスキーマ定義
`geo_tags`・`geo_templates`・`geo_regions` の3テーブルがマイグレーションで管理されなければならない（SHALL）。

#### Scenario: geo_tags テーブルの構造
- **WHEN** マイグレーション適用後に `geo_tags` を参照する
- **THEN** `id TEXT PRIMARY KEY`, `label TEXT` カラムが存在し、`prefecture` と `municipality` の2行が初期データとして挿入されている

#### Scenario: geo_templates テーブルの構造
- **WHEN** マイグレーション適用後に `geo_templates` を参照する
- **THEN** `id TEXT PRIMARY KEY`, `name TEXT`, `parent_template_id TEXT`, `parent_region_id TEXT`, `canvas_width INTEGER`, `canvas_height INTEGER` カラムが存在する

#### Scenario: geo_regions テーブルの構造
- **WHEN** マイグレーション適用後に `geo_regions` を参照する
- **THEN** `id TEXT`, `template_id TEXT`, `name TEXT`, `name_en TEXT`, `tag_id TEXT`, `path TEXT`, `bbox JSONB`, `geo_offset JSONB` カラムが存在し、`(id, template_id)` が複合主キー、`tag_id` が `geo_tags(id)` への FK になっている

### Requirement: Remote push workflow documented
開発者はローカルの migration と seed を remote 環境に適用する手順を README から確認できる。

#### Scenario: README に remote push 手順が記載されている
- **WHEN** 開発者が README.md を参照する
- **THEN** `supabase db push` と `pnpm seed:remote` の使い方が記載されている
