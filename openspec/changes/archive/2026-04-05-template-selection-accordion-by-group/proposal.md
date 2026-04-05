## Why

テンプレート選択ダイアログ（コレクション新規作成時）が現在フラットなリストのままであり、`geo_template_groups` によるグループ構造が UI に反映されていない。68件のテンプレートを地方区分ごとのアコーディオンで折りたたむことで、目的のテンプレートを素早く見つけられるようにする。

## What Changes

- 新規作成ダイアログのテンプレート取得を `listTemplates()` から `GET /api/template-groups` に切り替える
- テンプレート一覧を `GeoTemplateGroup` ごとのアコーディオン UI で表示する（グループ名が見出し、配下テンプレートが選択肢）
- 選択済みテンプレートが属するグループは自動的に展開された状態で開く

## Capabilities

### New Capabilities

- `template-selection-accordion`: テンプレート選択ダイアログ内のアコーディオン UI。グループ単位で折りたたみ展開でき、テンプレートを選択できる。

### Modified Capabilities

（なし — バックエンド・API・型定義の変更はない）

## Impact

- フロントエンドのみの変更（`src/app/page.tsx` のダイアログ部分）
- `GET /api/template-groups` を新たに呼び出す（エンドポイント自体は既実装済み）
- `listTemplates()` / `GET /api/templates` の呼び出しを削除（ページ内で不要になる）
- Next.js rendering strategy: Client Component（既存の `'use client'` を維持）
