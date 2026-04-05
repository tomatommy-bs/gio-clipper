## Context

現在 `geo_templates` テーブルに68件のテンプレートがフラットに存在する（japan-prefectures × 1、都道府県 × 47、政令市等 × 20）。グルーピングの概念がなく、UI側でテンプレート一覧を構造的に表示する手段がない。

グループはナビゲーション/UI整理のための概念であり、既存の `parent_template_id`（ドリルダウン階層）とは独立した軸。

## Goals / Non-Goals

**Goals:**
- `geo_template_groups` / `geo_template_group_members` の2テーブルでグループ定義を管理する
- グループ間の表示順、グループ内のテンプレート表示順を保持する
- 1テンプレートが複数グループに所属できる（多対多）
- 地方区分グループ（日本全体 + 8地方）のシードデータを投入する

**Non-Goals:**
- グループの階層化（将来別テーブルで対応する予定）
- フロントエンドのUI実装（別チェンジで対応）
- グループのCRUD管理画面

## Decisions

### D1: 中間テーブル方式（多対多）

`geo_templates` にカラムを追加する案（1対多）ではなく、中間テーブル `geo_template_group_members` で管理する。

**理由:** 将来「政令市グループ」など横断的なグルーピングが必要になる可能性があり、1テンプレートが複数グループに属せる設計が必要。

### D2: `sort_order` は integer（スパース）

`sort_order` を `10, 20, 30...` のように10刻みで割り振り、途中挿入時に全件更新を避ける。

### D3: グループ内順序の規則（シードデータ）

都道府県テンプレートの直後に、その都道府県配下の市区テンプレートを並べる。

```
例: 関東グループ
  sort=10  pref-08 (茨城)
  sort=20  pref-09 (栃木)
  sort=30  pref-10 (群馬)
  sort=40  pref-11 (埼玉)
  sort=50  pref-12 (千葉)
  sort=60  pref-13 (東京)
  sort=70  city-13100 (東京23区)
  sort=80  pref-14 (神奈川)
  sort=90  city-14100 (横浜市)
  sort=100 city-14130 (川崎市)
  sort=110 city-14150 (相模原市)
```

### D4: API は新規エンドポイント `GET /api/template-groups`

既存の `GET /api/templates` のレスポンス形式を変更すると既存クライアントに影響する。新規エンドポイントとして `GET /api/template-groups` を追加し、グループ一覧とその配下のテンプレートメタデータをネストして返す。

```json
[
  {
    "id": "group-japan",
    "name": "日本",
    "sort_order": 10,
    "templates": [
      { "id": "japan-prefectures", "name": "日本全国（都道府県）", "sort_order": 10 }
    ]
  },
  {
    "id": "group-kanto",
    "name": "関東地方",
    "sort_order": 40,
    "templates": [...]
  }
]
```

## Risks / Trade-offs

- **シードデータの保守コスト**: グループメンバーシップはコードで管理するため、新テンプレート追加時に手動で `seed-supabase.mjs` を更新する必要がある → テンプレート追加時の手順書に明記する
- **sort_order の衝突**: 10刻みでも大量挿入時に衝突するが、このデータ規模では問題なし

## Migration Plan

1. マイグレーションSQL作成（2テーブル追加）
2. `seed-supabase.mjs` にグループデータ追加
3. `pnpm seed` → `pnpm seed:remote` でローカル・リモート両方に適用
4. `GET /api/template-groups` エンドポイント追加
5. ロールバック: テーブルDROPのみ、既存テーブルに手を加えていないため影響なし
