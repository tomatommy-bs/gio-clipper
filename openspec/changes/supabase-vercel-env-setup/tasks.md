## 1. スキーマを Remote に適用

- [x] 1.1 `pnpm dlx supabase db push --linked` で migration を適用する
- [x] 1.2 remote で3テーブル（geo_tags / geo_templates / geo_regions）が作成されていることを確認する

## 2. seed.sql 生成と Git 管理

- [x] 2.1 `pnpm dlx supabase db dump --local --data-only --schema public -f supabase/seed.sql` でローカルデータを dump する
- [ ] 2.2 `supabase/seed.sql` を Git にコミットする
- [x] 2.3 `package.json` に `"seed:dump"` スクリプトを追加する

## 3. Remote Seed スクリプト

- [x] 3.1 `seed:remote` は `seed-supabase.mjs` を `.env.remote` で実行する方式に変更（psql 不要）
- [x] 3.2 `package.json` に `"seed:remote"` スクリプトを追加する
- [x] 3.3 `pnpm seed:remote` を実行しマスターデータが投入されることを確認する

## 4. Vercel 環境変数設定

- [x] 4.1 `vercel link` でローカルリポジトリを Vercel プロジェクトに紐づける（済: `.vercel/project.json` 存在）
- [x] 4.2 Vercel の環境変数（Production / Preview 共通）が Supabase プロジェクトを向いていることを確認する
- [x] 4.3 `.env.remote` に remote 用環境変数を保存（`vercel env pull .env.remote`）

## 5. デプロイ検証

- [x] 5.1 Vercel Git integration により `dev`/`main` ブランチの自動デプロイは設定済み
- [x] 5.2 dev デプロイ URL で `GET /api/templates` を呼び出し、テンプレート一覧が返ることを確認する（HTTP 200）
- [ ] 5.3 Production URL で `GET /api/templates` を呼び出し、テンプレート一覧が返ることを確認する

## 6. ドキュメント更新

- [x] 6.1 `README.md` に remote 環境のセットアップ手順（`db push` / `seed:remote`）を追記する
- [x] 6.2 `.env.local.example` に `.env.remote` の説明を追記し、`.gitignore` に `.env.remote` を追加する
