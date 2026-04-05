## ADDED Requirements

### Requirement: Vercel project linked to repository
Vercel プロジェクトはリポジトリと連携し、ブランチごとに自動デプロイが行われる。

#### Scenario: Dev branch deploys to preview
- **WHEN** `dev` ブランチに push される
- **THEN** Vercel が Preview デプロイを実行し、dev Supabase に接続された URL が生成される

#### Scenario: Main branch deploys to production
- **WHEN** `main` ブランチに push される
- **THEN** Vercel が Production デプロイを実行し、production Supabase に接続された URL が生成される

### Requirement: Environment variables configured per environment
`NEXT_PUBLIC_SUPABASE_URL` と `NEXT_PUBLIC_SUPABASE_ANON_KEY` が Vercel の dev / production 環境それぞれに設定される。

#### Scenario: Dev environment variables set
- **WHEN** Vercel の dev / Preview 環境でアプリが起動する
- **THEN** `process.env.NEXT_PUBLIC_SUPABASE_URL` が dev Supabase プロジェクトの URL を返す

#### Scenario: Production environment variables set
- **WHEN** Vercel の Production 環境でアプリが起動する
- **THEN** `process.env.NEXT_PUBLIC_SUPABASE_URL` が production Supabase プロジェクトの URL を返す

### Requirement: Template list API functional on deployed environment
デプロイされた環境で `GET /api/templates` が正常に動作し、マスターデータを返す。

#### Scenario: Templates API returns data on dev
- **WHEN** dev デプロイ環境で `GET /api/templates` を呼び出す
- **THEN** HTTP 200 とテンプレート一覧 JSON が返る
