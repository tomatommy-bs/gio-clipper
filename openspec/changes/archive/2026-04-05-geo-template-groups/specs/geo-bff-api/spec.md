## ADDED Requirements

### Requirement: テンプレートグループ一覧 API
システムは `GET /api/template-groups` エンドポイントを提供しなければならない（SHALL）。レスポンスはグループ一覧と各グループに所属するテンプレートのメタデータ（SVGパスを含まない）を JSON で返す。

#### Scenario: グループ一覧の取得
- **WHEN** クライアントが `GET /api/template-groups` をリクエストする
- **THEN** グループが `sort_order` 昇順で返され、各グループは `id`, `name`, `sort_order`, `templates` 配列を含む

#### Scenario: グループ内テンプレートの順序
- **WHEN** クライアントが `GET /api/template-groups` をリクエストする
- **THEN** 各グループの `templates` 配列はグループ内 `sort_order` 昇順で返される

#### Scenario: グループが存在しない場合
- **WHEN** DB にグループが1件も登録されていない状態で `GET /api/template-groups` をリクエストする
- **THEN** 空配列 `[]` が返される

#### Scenario: テンプレートメタデータの内容
- **WHEN** クライアントが `GET /api/template-groups` をリクエストする
- **THEN** 各テンプレートは `id`, `name`, `parentTemplateId`, `parentRegionId`, `canvasWidth`, `canvasHeight`, `sort_order` を含む（SVGパスは含まない）
