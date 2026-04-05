# scripts

GeoJSON データの変換・投入スクリプト群。

## ディレクトリ構成

```
scripts/
├── geo-source/          # 入力 GeoJSON（手動配置、git 管理外）
├── geo-output/          # 生成 JSON（git 管理外）
├── generate-geo-data.mjs
└── seed-supabase.mjs
```

---

## generate-geo-data.mjs

GeoJSON を SVGパスデータに変換し、`geo-output/` に JSON を出力する。

### Usage

```bash
# 引数なし: japan-prefectures のみ生成
node scripts/generate-geo-data.mjs

# 都道府県テンプレートを生成
node scripts/generate-geo-data.mjs scripts/geo-source/N03_13.geojson

# 政令市テンプレートを生成（--city で市名を指定）
node scripts/generate-geo-data.mjs scripts/geo-source/N03_14.geojson --city 横浜市

# ディレクトリを指定（.geojson を一括処理）
node scripts/generate-geo-data.mjs scripts/geo-source/
```

または:

```bash
pnpm generate-geo
pnpm generate-geo scripts/geo-source/N03_13.geojson
pnpm generate-geo scripts/geo-source/N03_14.geojson --city 横浜市
```

### 入力フォーマット

| ファイル名 | 用途 |
|-----------|------|
| `geo-source/japan-prefectures.geojson` | 日本全国（都道府県）テンプレート用。引数なしで処理される |
| `geo-source/N03_XX.geojson` | 都道府県・政令市テンプレート用。XX は 2 桁の都道府県コード。[国土数値情報](https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-N03-v3_1.html) からダウンロードして配置する |

### テンプレート種別と ID 体系

| 種別 | テンプレート ID | 例 |
|------|---------------|-----|
| 全国（都道府県） | `japan-prefectures` | 47都道府県 |
| 都道府県（市区町村） | `pref-{2桁コード}` | `pref-13`（東京都） |
| 政令市（区） | `city-{5桁市コード}` | `city-14100`（横浜市） |

政令市コードはward コードの最小値 - 1 で自動導出される（例: ward `14101` → city `14100`）。

### 処理内容

1. N03 プロパティ（`N03_001`〜`N03_007`）を読み取り、同一 `N03_007`（行政区域コード）のフィーチャーを topojson で dissolve してマージする（`--city` 指定時は該当市の features のみ対象）
2. `N03_007` が null のフィーチャーは警告を出してスキップする
3. d3-geo の `geoMercator` + `fitExtent` でキャンバス（800×900）に投影し、SVGパスを生成する
4. `name`（`N03_003` + `N03_004`）、`tag`（`prefecture` / `municipality`）を付与する
5. `geo-output/<templateId>.json` に出力する

### 出力フォーマット

```json
{
  "template": {
    "id": "pref-13",
    "name": "東京都（市区町村）",
    "parentTemplateId": "japan-prefectures",
    "parentRegionId": "13",
    "canvasWidth": 800,
    "canvasHeight": 900
  },
  "regions": [
    {
      "id": "13101",
      "name": "千代田区",
      "nameEn": "",
      "tag": "municipality",
      "path": "M...",
      "bbox": { "x": 0, "y": 0, "width": 100, "height": 100 },
      "offset": { "dx": 0, "dy": 0 }
    }
  ]
}
```

---

## seed-supabase.mjs

`geo-output/` の JSON を Supabase の `geo_templates` / `geo_regions` テーブルに UPSERT する。冪等（何度実行しても同じ結果になる）。

### Usage

```bash
pnpm seed
```

内部的には `node --env-file=.env.local scripts/seed-supabase.mjs` を実行する。

### 前提条件

- `supabase start` でローカル環境が起動していること
- `.env.local` に `NEXT_PUBLIC_SUPABASE_URL` と `SUPABASE_SERVICE_ROLE_KEY` が設定されていること
- `geo-output/` に JSON ファイルが存在すること（先に `pnpm generate-geo` を実行する）

### 処理内容

1. `geo-output/*.json` を読み込み、`japan-*` → `pref-*` → `city-*` の順に処理する（FK 制約のため）
2. `geo_templates` に `ON CONFLICT (id) DO UPDATE` で UPSERT する
3. `geo_regions` に `ON CONFLICT (id, template_id) DO UPDATE` で UPSERT する（500件ずつバッチ処理）

---

## 典型的なワークフロー

```bash
# 1. Supabase 起動
pnpm dlx supabase start

# 2. 国土数値情報から GeoJSON を配置
#    https://nlftp.mlit.go.jp/ksj/ からダウンロード → scripts/geo-source/N03_XX.geojson

# 3. SVGパスデータを生成
pnpm generate-geo                                               # japan-prefectures
pnpm generate-geo scripts/geo-source/N03_13.geojson            # 東京都（市区町村）
pnpm generate-geo scripts/geo-source/N03_14.geojson            # 神奈川県（市区町村）
pnpm generate-geo scripts/geo-source/N03_14.geojson --city 横浜市  # 横浜市（区）
pnpm generate-geo scripts/geo-source/N03_14.geojson --city 川崎市  # 川崎市（区）

# 4. Supabase に投入
pnpm seed
```
