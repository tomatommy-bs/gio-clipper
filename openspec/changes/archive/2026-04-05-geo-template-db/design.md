## Context

現状、テンプレートデータは `public/geo-data/*.json` として静的ファイルでバンドルされており、`template-registry.ts` のハードコードされた配列で管理されている。クライアントが直接 `/geo-data/*.json` をフェッチする構造のため、テンプレート追加にはビルド・デプロイが必要。

## Goals / Non-Goals

**Goals:**
- Supabase（ローカル）をデータストアとして導入し、テンプレートをDBで管理する
- Next.js Route Handlers による BFF API を定義し、クライアントとDBの間に置く
- `supabase start` 一発でローカル環境が完結するようにする
- vitest を導入してBFF APIのロジックをテストできるようにする

**Non-Goals:**
- データパイプライン（GeoJSON → DB 投入）は別 change（`geo-data-pipeline`）で行う
- 認証・認可（現時点では全テンプレートはパブリック）
- Supabase クラウド環境へのデプロイ設定

## Decisions

### DBスキーマ: 3テーブル構成

```sql
geo_tags      (id, label)
geo_templates (id, name, parent_template_id, parent_region_id, canvas_width, canvas_height)
geo_regions   (id, template_id, name, name_en, tag_id, path, bbox, offset)
```

`geo_regions.tag_id` は `geo_tags.id` への外部キー。`geo_regions.path` は TEXT（SVGパス文字列）、`bbox` / `offset` は JSONB。

#### geo_tags の定義とシードデータ

| id             | label  |
|----------------|--------|
| `prefecture`   | 都道府県 |
| `municipality` | 市区町村 |

`geo_tags` はマイグレーション内で INSERT（seed）する。アプリ側では `tag_id` の文字列のみを扱い、日本語はDBの `label` カラムに集約する。

**代替案**: `tag` を TEXT CHECK 制約で日本語を直接格納 → アプリコードに日本語リテラルが散らばるため不採用。

### BFF API: Next.js Route Handlers

`/api/templates` と `/api/templates/[id]` を Next.js の Route Handlers として実装。

- `GET /api/templates`: `geo_templates` のみ SELECT（geo_regions は JOIN しない）
- `GET /api/templates/[id]`: `geo_templates` + `geo_regions` を JOIN して `GeoTemplate` 型互換の JSON を返す

**代替案**: クライアントから Supabase JS を直接呼ぶ → Service Role Key をクライアントに露出するリスク、将来的なアクセス制御の困難さから不採用。

### ローカル環境: Supabase CLI

`supabase init` でプロジェクトを初期化し、`supabase start` でローカルの PostgreSQL + PostgREST + Studio を Docker Compose で起動。マイグレーションは `supabase/migrations/` で管理。

`.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<supabase start 出力値>
SUPABASE_SERVICE_ROLE_KEY=<supabase start 出力値>  # seed スクリプト用
```

### Gateway Layer: `*.gateway.bff.ts`

**設計方針**: API 呼び出しはすべて `*.gateway.bff.ts` ファイルを経由する。`fetch` を直接呼ぶコードをアプリケーション層（`template-registry.ts` 等）に書かない。

```ts
// src/lib/geo/geo-template.gateway.bff.ts
export async function listTemplatesFromApi(): Promise<GeoTemplateInfo[]> {
  const res = await fetch('/api/templates');
  if (!res.ok) throw new Error('Failed to fetch templates');
  return res.json();
}

export async function fetchTemplateFromApi(id: string): Promise<GeoTemplate> {
  const res = await fetch(`/api/templates/${id}`);
  if (!res.ok) throw new Error(`Failed to fetch template: ${id}`);
  return res.json();
}
```

このファイルが BFF API の唯一の呼び出し口になる。

### template-registry.ts の責務変更

既存の `TEMPLATE_REGISTRY` 定数と `fetchTemplate` 関数を廃止し、新たに以下を提供：

```ts
listTemplates(): Promise<GeoTemplateInfo[]>   // gateway 経由
fetchTemplate(id): Promise<GeoTemplate>        // gateway 経由
```

`template-registry.ts` は `geo-template.gateway.bff.ts` をインポートし、fetch を直接呼ばない。インターフェースを維持しつつ実装だけ差し替える。呼び出し元（`CollectionPage` など）の変更は不要。

### GeoRegion 型への tag 追加

```ts
export type GeoRegionTag = 'to' | 'do' | 'fu' | 'ken' | 'shi' | 'ku' | 'cho' | 'son'

export interface GeoRegion {
  id: string
  name: string       // 表示名（N03_003 + N03_004 結合済み）
  nameEn: string
  tag: GeoRegionTag
  path: string
  bbox: { x: number; y: number; width: number; height: number }
  offset: { dx: number; dy: number }
}
```

### vitest

Next.js の設定と独立した `vitest.config.ts` を用意し、`src/app/api/` 配下の Route Handler ロジックをユニットテストする。

## Risks / Trade-offs

- [Supabase CLI / Docker が未インストールの場合、`supabase start` が動かない] → README に手順を明記する
- [BFF API のレスポンスが大きい（北海道の市区町村等）] → `GET /api/templates/[id]` は大きくなりうるが、ページキャッシュ（`next: { revalidate }` 等）で対応可能。MVP では許容。
- [geo_regions.path が TEXT として大量行になる] → PostgreSQL は問題なく扱えるが、`SELECT *` を避け必要カラムのみ取得する

## Migration Plan

1. `supabase init` でローカル環境初期化
2. マイグレーションで `geo_templates` / `geo_regions` テーブルを作成
3. BFF API 実装
4. `template-registry.ts` を API 呼び出しに書き換え
5. 既存の `public/geo-data/` は削除しない（`geo-data-pipeline` で参照する可能性あり）
