## ADDED Requirements

### Requirement: Remote push workflow documented
開発者はローカルの migration と seed を remote 環境に適用する手順を README から確認できる。

#### Scenario: README に remote push 手順が記載されている
- **WHEN** 開発者が README.md を参照する
- **THEN** `supabase db push` と `pnpm seed:remote` の使い方が記載されている
