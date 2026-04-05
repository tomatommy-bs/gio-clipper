## Requirements

### Requirement: テンプレート一覧 API
システムは `GET /api/templates` エンドポイントを提供しなければならない（SHALL）。レスポンスはテンプレートのメタデータ一覧（SVGパスを含まない）を JSON で返す。

#### Scenario: テンプレート一覧の取得
- **WHEN** クライアントが `GET /api/templates` をリクエストする
- **THEN** 全テンプレートの `id`, `name`, `parentTemplateId`, `parentRegionId`, `canvasWidth`, `canvasHeight` を含む JSON 配列が返される

#### Scenario: テンプレートが存在しない場合
- **WHEN** DB にテンプレートが1件も登録されていない状態で `GET /api/templates` をリクエストする
- **THEN** 空配列 `[]` が返される

### Requirement: テンプレート詳細 API
システムは `GET /api/templates/[id]` エンドポイントを提供しなければならない（SHALL）。レスポンスは SVGパスを含む全 region データを含む `GeoTemplate` 互換の JSON を返す。

#### Scenario: 存在するテンプレートの取得
- **WHEN** クライアントが `GET /api/templates/japan-prefectures` をリクエストする
- **THEN** `id`, `name`, `canvasWidth`, `canvasHeight`, `regions` 配列を含む JSON が返される

#### Scenario: 存在しないテンプレートの取得
- **WHEN** クライアントが存在しない ID で `GET /api/templates/nonexistent` をリクエストする
- **THEN** HTTP 404 が返される

#### Scenario: regions に tag が含まれる
- **WHEN** テンプレート詳細を取得する
- **THEN** 各 region に `tag`（`'prefecture'` または `'municipality'`）フィールドが含まれる
