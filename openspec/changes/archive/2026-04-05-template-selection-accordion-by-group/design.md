## Context

新規コレクション作成ダイアログ（`src/app/page.tsx`）は現在 `listTemplates()` で `GET /api/templates` を呼び出し、全テンプレートをフラットなボタンリストで表示している。一方、`GET /api/template-groups`（`src/app/api/template-groups/route.ts`）はグループ構造を返す API として実装済みだが、フロントエンドで未使用の状態にある。

## Goals / Non-Goals

**Goals:**
- ダイアログ内テンプレートリストを `GeoTemplateGroup` 単位のアコーディオンに置き換える
- `GET /api/templates` の呼び出しを廃止し `GET /api/template-groups` に一本化する
- テンプレート選択の状態管理（`selectedTemplateId`）は既存のまま維持する

**Non-Goals:**
- アコーディオン以外のページ・コンポーネントへの変更
- API・DB スキーマ・型定義の変更
- グループ未所属テンプレートの扱い（MVPでは全テンプレートがいずれかのグループに属する前提）

## Decisions

### アコーディオン実装: shadcn/ui Accordion を使用する

**理由**: プロジェクトはすでに shadcn/ui を採用しており（`@/components/ui/`）、Accordion コンポーネントが利用可能な場合は追加インストールなしで使える。Base UI の Accordion も候補だが、shadcn/ui との一貫性を優先する。

**代替案**: 自前の `<details>`/`<summary>` — shadcn/ui がある環境では不要な重複。

### データ取得: `useEffect` + `fetch('/api/template-groups')` のままにする

**理由**: 既存コードが `listTemplates()` を `useEffect` 内で呼んでいるパターンを踏襲する。`page.tsx` は `'use client'` コンポーネントであり、Server Component 化は今回のスコープ外。

### デフォルト展開: 全グループを閉じた状態で開く

**理由**: グループ数が少ない（7件）ため、ユーザーは目的のグループを素早く見つけられる。選択済みテンプレートがある場合はそのグループを展開する。`Accordion` の `type="multiple"` を使い複数グループを同時展開可能にする。

## Risks / Trade-offs

- **shadcn/ui Accordion が未インストールの場合** → `pnpm dlx shadcn@latest add accordion` で追加。インストール済みであれば不要。
- **`GET /api/template-groups` のレスポンス遅延** → 既存の `listTemplates()` と同等の遅延。ローディング状態は既存 `templates` state の初期値（空配列）で対応済み。
- **グループ未所属テンプレート** → MVPシードデータでは全テンプレートが所属しているため問題なし。将来的にグループ外テンプレートが生じた場合は別途対応する。
