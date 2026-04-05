## Context

現在のインフラ構成:
- **local**: `supabase start` で Docker コンテナを起動し、`pnpm seed` でマスターデータを投入
- **Vercel**: デプロイ済みだが DB 接続先が未設定（環境変数なし）
- マスターデータ（geo_tags / geo_templates / geo_regions）はアプリ動作に必須で、すべて静的・変更不要なリードオンリーデータ

課題:
- Vercel 上で動くアプリが Supabase に接続できず、テンプレート一覧 API が機能しない
- dev / production の DB 環境が存在しないため、ステージング検証ができない

## Goals / Non-Goals

**Goals:**
- Supabase remote に 1 プロジェクトを作成し、Vercel の Preview / Production デプロイ両方から接続する
- マスターデータを local dump → remote apply する再現可能なフローを確立
- `pnpm seed:remote` スクリプトで remote への投入を自動化

**Non-Goals:**
- dev / production の DB 環境分離（マスターデータのみのため不要。ユーザーデータが増えたタイミングで再検討）
- ユーザーデータのマイグレーション（MVP ではユーザーデータなし）
- CI での自動テスト実行（将来フェーズ）
- Supabase RLS / Auth 設定（別 change で対応）

## Decisions

### D1: Supabase プロジェクト構成

**選択: 1 プロジェクト（dev/prod 共用）**

- Supabase branching は Pro プラン以上が必要
- マスターデータのみで dev/prod 分離のメリットが薄い
- Free tier の 2 プロジェクト枠を温存できる
- 将来ユーザーデータが増えたタイミングで分離を検討する

### D2: マスターデータの投入方法

**選択: SQL dump ファイルを Migration として管理**

- `supabase db dump --data-only --schema public > supabase/seed.sql` で local データを dump
- `supabase db push --remote` で migration + seed を remote に適用
- seed.sql を Git 管理することで環境再現性を担保

代替案: `pnpm seed` を remote 接続で直接実行 → DB_URL 環境変数が必要で CI では扱いにくい

### D3: Vercel 環境変数管理

- Vercel CLI (`vercel env add`) で dev / production それぞれに `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` を設定
- `vercel link` でプロジェクトを紐づけ、`vercel env pull` でローカルに同期できるようにする

### D4: デプロイフロー

- `dev` ブランチ push → Vercel Preview デプロイ（dev Supabase に接続）
- `main` ブランチ push → Vercel Production デプロイ（production Supabase に接続）
- GitHub Actions は使わない（Vercel の Git integration で自動デプロイ）

## Risks / Trade-offs

- **Free tier の制限**: Supabase Free は 2 プロジェクトまで。将来プロジェクトが増えると有料化が必要 → MVP 範囲では許容
- **seed.sql のサイズ**: 都道府県 + 市区町村全データで数MB になる可能性 → Git LFS または generate-on-demand で対応
- **migration と seed の適用順序**: `supabase db push` は migration のみ適用。seed.sql を別途実行する手順が必要 → README / scripts で明示
- **環境変数の秘匿**: anon key は公開可能だが service_role key は非公開。seed スクリプトは service_role key を使う場合は CI 環境変数に格納 → `.env.local` に留め、コミットしない
