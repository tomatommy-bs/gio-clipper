## MODIFIED Requirements

### Requirement: テンプレート階層の提供
システムは日本の行政区画を階層構造で提供しなければならない（SHALL）。テンプレートデータは Supabase DB に格納され、BFF API 経由で取得する。MVPでは「国レベル（日本全体 → 都道府県47件）」と「都道府県レベル（各県 → 市区町村）」の2階層を提供する。各テンプレートは、対象エリアのリスト・各エリアのSVGパス・地理的配置情報・行政区画タグを含む。

#### Scenario: 国レベルテンプレートの選択
- **WHEN** ユーザーが「日本全国」テンプレートを選択する
- **THEN** 47都道府県それぞれのSVGパスが、地理的配置で表示されるマップキャンバスが生成される

#### Scenario: 都道府県レベルテンプレートの選択
- **WHEN** ユーザーが特定の都道府県（例: 東京都）を選択する
- **THEN** その都道府県内の市区町村それぞれのSVGパスが表示されるマップキャンバスが生成される

#### Scenario: テンプレートの動的取得
- **WHEN** アプリケーションがテンプレートを必要とする
- **THEN** 静的ファイルではなく BFF API（`/api/templates/[id]`）から取得される

## ADDED Requirements

### Requirement: エリアの行政区画タグ
各エリアは自身が都道府県レベル（`prefecture`）か市区町村レベル（`municipality`）かを示す `tag` を持たなければならない（SHALL）。

#### Scenario: 都道府県テンプレートのタグ
- **WHEN** 日本全国テンプレートの regions を参照する
- **THEN** 各 region の `tag` は `'prefecture'` である

#### Scenario: 市区町村テンプレートのタグ
- **WHEN** 都道府県レベルテンプレートの regions を参照する
- **THEN** 各 region の `tag` は `'municipality'` である

## REMOVED Requirements

### Requirement: 静的ファイルによるテンプレート提供
**Reason**: Supabase DB + BFF API に移行するため、`public/geo-data/` からの直接フェッチを廃止する
**Migration**: `GET /api/templates/[id]` を使用する
