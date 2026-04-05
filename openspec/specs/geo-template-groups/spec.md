## Requirements

### Requirement: テンプレートグループの定義
システムはテンプレートをグループに分類する機能を提供しなければならない（SHALL）。グループは名前と表示順を持ち、グループ内のテンプレートも表示順を持つ。1つのテンプレートは複数のグループに所属できる（多対多）。

#### Scenario: グループへの所属
- **WHEN** テンプレートグループ一覧を取得する
- **THEN** 各グループは `id`, `name`, `sort_order` を持ち、配下のテンプレートメタデータがグループ内 `sort_order` 順に含まれる

#### Scenario: 複数グループへの所属
- **WHEN** 1つのテンプレートが複数のグループに登録されている
- **THEN** そのテンプレートはそれぞれのグループの一覧に表示される

### Requirement: グループ内テンプレートの順序規則
グループ内では都道府県テンプレートの直後に、その都道府県配下の市区テンプレートを並べなければならない（SHALL）。

#### Scenario: 都道府県と市区の並び順
- **WHEN** 関東地方グループのテンプレート一覧を取得する
- **THEN** 東京都テンプレートの直後に東京23区テンプレートが続き、次の都道府県テンプレートが続く順序で返される

### Requirement: グループシードデータ
MVPでは日本の地方区分に基づく以下のグループを提供しなければならない（SHALL）。

| sort_order | id | name |
|---|---|---|
| 10 | group-japan | 日本 |
| 20 | group-hokkaido-tohoku | 北海道・東北 |
| 30 | group-kanto | 関東地方 |
| 40 | group-chubu | 中部地方 |
| 50 | group-kinki | 近畿地方 |
| 60 | group-chugoku-shikoku | 中国・四国地方 |
| 70 | group-kyushu-okinawa | 九州・沖縄地方 |

#### Scenario: 地方グループの存在
- **WHEN** `GET /api/template-groups` をリクエストする
- **THEN** 上記7グループが `sort_order` 昇順で返される
