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
pnpm dlx supabase start
```

起動後に表示される `API URL`・`anon key`・`service_role key` を `.env.local` に設定する。

4. テンプレートデータを投入する

```bash
# GeoJSON を生成（geo-source/ にファイルを配置してから）
pnpm generate-geo

# Supabase に投入
pnpm seed
```

詳細は [scripts/README.md](scripts/README.md) を参照。

5. 開発サーバーを起動する

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
| `pnpm generate-geo [file] [--city 市名]` | GeoJSON → SVGパスデータ変換 |
| `pnpm seed` | Supabase にテンプレートデータを投入 |

## アーキテクチャ

```
ブラウザ
  └─ template-registry.ts
       └─ geo-template.gateway.bff.ts   # BFF API 呼び出しの窓口
            └─ GET /api/templates/[id]  # Route Handler
                 └─ Supabase (geo_templates / geo_regions)
```

### テンプレート体系

| 種別 | ID 例 | 内容 |
|------|-------|------|
| 全国 | `japan-prefectures` | 47都道府県 |
| 都道府県 | `pref-13` | 東京都の市区町村 |
| 政令市 | `city-14100` | 横浜市の各区 |
