# gio-clipper

旅行写真を、訪れた土地の形状で切り抜いてコレクションとして並べるWebサービス。

## セットアップ

### 前提条件

- Node.js 20+
- pnpm
- Docker Desktop（Supabase ローカル環境に必要）
- Supabase CLI

### Supabase CLI のインストール

```bash
brew install supabase/tap/supabase
```

### 手順

1. 依存パッケージをインストールする

```bash
pnpm install
```

2. 環境変数を設定する

```bash
cp .env.local.example .env.local
```

3. Supabase ローカル環境を起動する

```bash
supabase start
```

起動後に表示される `API URL` と `anon key`、`service_role key` を `.env.local` に設定する。

4. 開発サーバーを起動する

```bash
pnpm dev
```

http://localhost:3000 を開く。

## スクリプト

| コマンド | 説明 |
|---------|------|
| `pnpm dev` | 開発サーバー起動 |
| `pnpm build` | プロダクションビルド |
| `pnpm test` | ユニットテスト実行 |
| `pnpm generate-geo` | GeoJSON から SVG データ生成 |
| `pnpm seed` | Supabase にテンプレートデータを投入 |
