## Context

`parent_template_id` と `parent_region_id` は「地図リージョンクリック → 子テンプレートへ遷移」というドリルダウンナビゲーションのために設計されたが、UI実装が存在せず完全に未使用。`geo_template_groups` の導入と概念が重複するため削除する。

## Goals / Non-Goals

**Goals:**
- DB・API・型・スクリプト・テストの全レイヤーから一貫してこれらのフィールドを除去する

**Non-Goals:**
- ドリルダウンナビゲーションの代替実装（別途検討）
- `geo_template_groups` の実装（別チェンジ）

## Decisions

### D1: カラム削除は単一マイグレーションで行う

`ALTER TABLE geo_templates DROP COLUMN parent_template_id, DROP COLUMN parent_region_id;` を1つのマイグレーションファイルにまとめる。

### D2: ロールバックは提供しない

フロントエンドでの利用実績がゼロであり、ロールバックの必要性がない。マイグレーションは非可逆とする。

## Risks / Trade-offs

- **[リスク] シードデータの再生成が必要** → `generate-geo-data.mjs` の出力JSONにまだこれらフィールドが含まれる場合、`pnpm seed` 実行時にエラーになる → スクリプト側も同時に修正する

## Migration Plan

1. `supabase/migrations/` に DROP COLUMN マイグレーションを追加
2. `generate-geo-data.mjs` からフィールド生成コードを削除
3. `seed-supabase.mjs` から INSERT 対象カラムを削除
4. API ルート・型・テストを更新
5. `pnpm seed` でローカル確認
6. `supabase db reset` → `pnpm seed` でマイグレーション込みの動作確認
