## 1. 写真正規化ユーティリティの作成

- [x] 1.1 `src/lib/storage/photo-normalize.ts` を新規作成し、`normalizePhoto(file: File): Promise<Blob>` を実装する（Canvas経由でJPEG変換、長辺2048px制限）
- [x] 1.2 エラーハンドリングを実装する（画像ロード失敗・Canvas変換失敗時に明示的にrejectする）

## 2. RegionEditModal の修正

- [x] 2.1 `isLoading` stateを追加し、写真読み込み中のUI状態を管理する
- [x] 2.2 `handleFileChange` を async 化し `normalizePhoto` を呼び出す形に書き換える
- [x] 2.3 エラー発生時にユーザーへメッセージを表示する（インラインエラー表示）
- [x] 2.4 ローディング中は写真選択ボタン・保存ボタンを disabled にする

## 3. 動作確認

- [ ] 3.1 通常のJPEG写真（カメラロール）を選択してプレビューと保存が正常に動作することを確認する
- [ ] 3.2 Android Chrome + Google Photos クラウド写真でプレビューが表示されることを確認する（または再現できる環境で確認）
- [ ] 3.3 HEIC形式の写真を選択してプレビューが正常に表示されることを確認する（iOSまたはHEICファイルで確認）

## 4. 品質チェック

- [x] 4.1 `pnpm lint` を実行してエラー・警告が0件であることを確認する
- [x] 4.2 `pnpm test --run` を実行して全テストがpassすることを確認する
