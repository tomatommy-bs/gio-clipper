## Requirements

### Requirement: Remote environment provisioning
開発者は Supabase remote に dev / production の 2 環境を作成し、それぞれ独立した DB を持つ。

#### Scenario: Dev and production projects exist
- **WHEN** 開発者がプロジェクトを確認する
- **THEN** Supabase 上に dev と production の 2 プロジェクトが存在し、それぞれ異なる API URL を持つ

### Requirement: Schema migration applied to remote
マイグレーションファイルは `supabase db push` コマンドで remote に適用できる。

#### Scenario: Migration push succeeds
- **WHEN** 開発者が `pnpm dlx supabase db push --project-ref <ref>` を実行する
- **THEN** `supabase/migrations/` 内のすべての migration が remote DB に適用される

### Requirement: Master data seeding to remote
マスターデータ（geo_tags / geo_templates / geo_regions）を local dump から remote に投入できる。

#### Scenario: Seed script generates dump
- **WHEN** 開発者が `pnpm seed:dump` を実行する
- **THEN** `supabase/seed.sql` にデータのみの SQL dump が生成される

#### Scenario: Remote seed succeeds
- **WHEN** 開発者が `pnpm seed:remote -- --project-ref <ref>` を実行する
- **THEN** `supabase/seed.sql` が remote DB に適用され、マスターデータが投入される

### Requirement: Local seed.sql is Git-managed
`supabase/seed.sql` は Git にコミットされ、環境再現の単一ソースとなる。

#### Scenario: Seed file present in repo
- **WHEN** 開発者がリポジトリをクローンする
- **THEN** `supabase/seed.sql` が存在し、マスターデータの全レコードを含む
