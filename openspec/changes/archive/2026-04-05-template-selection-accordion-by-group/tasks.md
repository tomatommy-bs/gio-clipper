## 1. 依存コンポーネントの追加

- [x] 1.1 `pnpm dlx shadcn@latest add accordion` を実行して Accordion コンポーネントをインストールする（`src/components/ui/accordion.tsx` が生成されることを確認）

## 2. フロントエンド実装

- [x] 2.1 `src/app/page.tsx` の state を `templates: GeoTemplateInfo[]` から `groups: GeoTemplateGroup[]` に変更する
- [x] 2.2 `useEffect` 内の `listTemplates()` 呼び出しを `fetch('/api/template-groups')` に置き換え、`GeoTemplateGroup[]` として state にセットする
- [x] 2.3 ダイアログ内のテンプレートリスト部分を `Accordion`（`type="multiple"`）で書き直す。各 `AccordionItem` がグループ、`AccordionContent` 内がテンプレート選択ボタン群
- [x] 2.4 テンプレート選択ボタンのスタイル・クリック時の `setSelectedTemplateId` ロジックは既存のものを踏襲する
- [x] 2.5 不要になった `listTemplates` import と `GeoTemplateInfo` import を削除する

## 3. 動作確認

- [ ] 3.1 開発サーバーでダイアログを開き、グループ別アコーディオンが表示されることを確認する
- [ ] 3.2 各グループの展開・折りたたみが動作することを確認する
- [ ] 3.3 複数グループを同時に展開できることを確認する
- [ ] 3.4 テンプレートを選択して「作成」ボタンが有効になり、コレクション作成が正常に動作することを確認する

## 4. 品質チェック

- [x] 4.1 `pnpm lint` を実行してエラー・警告がゼロであることを確認する
- [x] 4.2 `pnpm test --run` を実行してすべてのテストが通ることを確認する
