## 1. パッケージ導入

- [x] 1.1 `pnpm add -D topojson-server topojson-client` を追加する

## 2. generate-geo-data.mjs の汎用化

- [x] 2.1 N03 プロパティ（`N03_001`〜`N03_007`）を読み取る汎用パーサー関数を実装する
- [x] 2.2 `N03_003 + N03_004` を結合して `name` を生成する関数を実装する
- [x] 2.3 `N03_004` の有無から `tag`（`prefecture` / `municipality`）を生成する関数を実装する
- [x] 2.4 `topojson.topology` + `topojson.merge` を使い、同一 `N03_007` コードのフィーチャーを dissolve する関数を実装する
- [x] 2.5 `N03_007` が null のフィーチャーをスキップしてログ出力する処理を追加する
- [x] 2.6 `scripts/geo-source/` 以下の GeoJSON ファイルを一括処理できるよう CLI 引数（ファイルパス or ディレクトリ）に対応する
- [x] 2.7 既存の `japan-prefectures` 変換処理を新しい汎用関数ベースに書き直す

## 3. vitest によるユニットテスト

- [x] 3.1 `name` 生成関数のテストを作成する（政令市区・郡部・一般市の3パターン）
- [x] 3.2 `tag` 生成関数のテストを作成する（municipality/prefecture）
- [x] 3.3 dissolve 関数のテストをサンプルGeoJSONで作成する（複数フィーチャー → 1エントリ）
- [x] 3.4 `pnpm test` が通ることを確認する

## 4. seed-supabase.mjs の作成

- [x] 4.1 `scripts/seed-supabase.mjs` を新規作成し、Supabase サービスロールで接続する処理を実装する
- [x] 4.2 `geo_templates` に `ON CONFLICT DO UPDATE` で UPSERT する処理を実装する
- [x] 4.3 `geo_regions` に `ON CONFLICT DO UPDATE` で UPSERT する処理を実装する（バッチ分割で大量データに対応）
- [x] 4.4 `package.json` に `"seed": "node --env-file=.env.local scripts/seed-supabase.mjs"` スクリプトを追加する

## 5. 動作確認

- [x] 5.1 国土数値情報から東京都の GeoJSON を `scripts/geo-source/N03_13.geojson` に配置する
- [x] 5.2 `node scripts/generate-geo-data.mjs N03_13.geojson` を実行し、`pref-13` テンプレート JSON が生成されることを確認する
- [x] 5.3 `pnpm seed` を実行し、Supabase Studio（:54323）でデータが入っていることを確認する
- [x] 5.4 `GET /api/templates` と `GET /api/templates/pref-13` が正しいデータを返すことを確認する
