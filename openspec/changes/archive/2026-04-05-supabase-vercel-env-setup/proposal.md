## Why

現在 local Supabase のみで開発しており、Vercel へのデプロイ時に DB 接続先が存在せずアプリが動作しない。dev 環境を用意してステージング検証・統合テストを実施できるようにする。また、geo_templates / geo_regions などのマスターデータは env 間で共通であるため、local dump → dev/production へのコピーという一元管理フローを確立し、データ不整合を防ぐ。

## What Changes

- Supabase プロジェクトに **dev** / **production** ブランチ（または個別プロジェクト）を作成し、Vercel の dev / production デプロイと接続する
- マスターデータ（geo_tags, geo_templates, geo_regions）の投入を `supabase db dump --data-only` → 各環境へ `psql` または Migration として適用するフローにする
- `pnpm seed:dev` / `pnpm seed:prod` スクリプトを追加し、local で生成したシードを remote に push できるようにする
- Vercel の環境変数（NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY）を dev/production それぞれに設定する（Vercel の Git integration で自動デプロイは設定済み）

## Capabilities

### New Capabilities

- `supabase-remote-env`: Supabase remote (dev/production) 環境への接続・マイグレーション適用・シードデータ投入フロー
- `vercel-env-deployment`: Vercel dev / production 環境への自動デプロイと環境変数管理

### Modified Capabilities

- `supabase-local`: ローカル開発フローにリモート push 手順を追記（運用ドキュメントの拡張）

## Impact

- `package.json`: `seed:dev`, `seed:prod` スクリプト追加
- `scripts/seed-supabase.mjs`: リモート接続オプション追加
- `supabase/`: remote project ID / linked config 追加
- Vercel プロジェクト設定: 環境変数の dev/production 分離
