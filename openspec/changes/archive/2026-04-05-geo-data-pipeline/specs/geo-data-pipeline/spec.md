## ADDED Requirements

### Requirement: GeoJSON から SVGパスへの変換
スクリプトは国土数値情報（N03）形式の GeoJSON を入力として受け取り、`geo_regions` 投入用の JSON を生成しなければならない（SHALL）。

#### Scenario: N03 プロパティからの name 生成（政令市区）
- **WHEN** `N03_003` が "横浜市"、`N03_004` が "鶴見区" のフィーチャーを変換する
- **THEN** `name` は "横浜市鶴見区" となる

#### Scenario: N03 プロパティからの name 生成（一般市）
- **WHEN** `N03_003` が null、`N03_004` が "札幌市" のフィーチャーを変換する
- **THEN** `name` は "札幌市" となる

#### Scenario: tag の生成
- **WHEN** `N03_004` が "千代田区" のフィーチャーを変換する
- **THEN** `tag` は "区" となる

### Requirement: 同一区域コードのポリゴン dissolve
同一 `N03_007`（行政区域コード）を持つ複数フィーチャーは、1つのポリゴン（または MultiPolygon）にマージされなければならない（SHALL）。

#### Scenario: 離島を持つ市のdissolve
- **WHEN** 同一コードの本土フィーチャーと離島フィーチャーが存在する
- **THEN** 変換結果は1つの `id` に統合され、SVGパスに両方の形状が含まれる

#### Scenario: N03_007 が null のフィーチャーはスキップ
- **WHEN** `N03_007` が null のフィーチャーが存在する
- **THEN** そのフィーチャーは変換結果に含まれず、警告ログが出力される

### Requirement: Supabase へのシード
`seed-supabase.mjs` は生成された JSON を `geo_templates` と `geo_regions` テーブルに UPSERT しなければならない（SHALL）。スクリプトは冪等でなければならない。

#### Scenario: 初回シード
- **WHEN** 空の DB に対して seed スクリプトを実行する
- **THEN** `geo_templates` と `geo_regions` にデータが挿入される

#### Scenario: 再実行時の冪等性
- **WHEN** すでにデータが存在する DB に対して seed スクリプトを再実行する
- **THEN** データが重複せず、最新の値に更新される
