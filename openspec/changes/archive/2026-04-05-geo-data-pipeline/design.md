## Context

国土数値情報の行政区域データ（N03）は都道府県ごとに GeoJSON ファイルが提供される。同一市区町村が島・飛び地で複数フィーチャーに分割されているため、dissolve（マージ）が必要。現在の `generate-geo-data.mjs` は tokyo-wards 専用のプロパティ名に依存しており、汎用化が必要。

## Goals / Non-Goals

**Goals:**
- N03 プロパティ構造（`N03_001`〜`N03_007`）を処理する汎用変換スクリプト
- 同一 `N03_007` コードのポリゴンを dissolve して1つのSVGパスに合成する
- 変換結果を Supabase の `geo_templates` / `geo_regions` にシードするスクリプト
- dissolve ロジックと name 生成ロジックを vitest でテストする

**Non-Goals:**
- GeoJSON ファイルのダウンロード自動化（手動配置を前提とする）
- topojson の simplify（解像度は国土数値情報原データのまま）

## Decisions

### Dissolve: topojson-server + topojson-client

```js
import { topology } from 'topojson-server';
import { merge }    from 'topojson-client';

// 同一コードでグループ化
const groups = groupBy(features, f => f.properties.N03_007);

for (const [code, feats] of Object.entries(groups)) {
  const topo = topology({ g: { type: 'FeatureCollection', features: feats } });
  const mergedGeometry = merge(topo, topo.objects.g.geometries);
  // mergedGeometry → Polygon or MultiPolygon
}
```

**代替案**: `@turf/union` → topojson より API が複雑でパフォーマンス劣る。不採用。

### name 生成ルール

```
N03_003 が null  → name = N03_004                      (例: "札幌市")
N03_003 が存在   → name = N03_003 + N03_004             (例: "横浜市鶴見区", "三浦郡葉山町")
都道府県テンプレート → name = N03_001                   (例: "東京都")
```

### tag 生成ルール

```
N03_001 末尾:  都/道/府/県 → tag
N03_004 末尾:  市/区/町/村 → tag
```

末尾1文字で判定。政令市の区（"鶴見区" 等）は `'区'` になる。

### テンプレートID

```
japan-prefectures   → 既存IDを踏襲（canvasWidth:800, canvasHeight:900）
pref-01             → 北海道市区町村
pref-13             → 東京都市区町村（旧 tokyo-wards を置き換え）
...
pref-47             → 沖縄県市区町村
```

### canvas サイズ

各都道府県テンプレートは `d3-geo` の `fitExtent` で自動スケールするため、個別の canvas 調整は不要。全て `800×900` で統一。

### seed スクリプトの冪等性

`geo_templates` は `ON CONFLICT (id) DO UPDATE`、`geo_regions` は `ON CONFLICT (id, template_id) DO UPDATE` で UPSERT する。何度実行しても同じ結果になる。

## Risks / Trade-offs

- [N03_007 が null のフィーチャーが存在する（一部の飛び地・湖沼等）] → null コードはスキップしてログ出力する
- [北海道（179市町村）の SVG path が巨大になる] → 生成は問題ないが、BFF API の `GET /api/templates/pref-01` レスポンスが数MB になりうる。MVP では許容
- [topojson の merge が複雑ジオメトリで失敗する可能性] → vitest でサンプルデータを使ってテストする
