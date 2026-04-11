## Why

モバイル端末（Android）でGoogle PhotosのクラウドのみのAの写真を選択すると、プレビューが表示されないままサイレントに失敗する。原因はAndroidのcontent:// URIがクラウドからのダウンロード完了を待たずにFileオブジェクトを返すため、Blobの実体が空のままSVG描画を試みるから。iOSではHEIC形式のBlobをSVG `<image>` がレンダリングできないという別ルートの同症状も存在する。どちらもエラーが表示されないため、ユーザーは操作が成功したか失敗したかわからない。

## What Changes

- 写真選択後にCanvas経由で画像を読み込み・正規化するパイプラインを導入する
  - `File` → `<img>.onload`（ここでクラウドダウンロード完了を待機）→ `Canvas.drawImage` → `canvas.toBlob("image/jpeg")` の順で処理
  - HEIC含むあらゆる形式をJPEGに統一して以降の処理に渡す
  - 読み込み中は UI でローディング状態を表示し、エラー時はユーザーに通知する
- `handleFileChange` に try/catch とエラー表示を追加し、サイレント失敗をなくす
- `handleSave` の無音 `return` にエラーフィードバックを追加する

## Capabilities

### New Capabilities

なし

### Modified Capabilities

- `region-photo-clip`: 写真選択後の処理をCanvas正規化パイプラインに変更。クラウド写真・HEIC形式に対応し、エラー時にユーザーへフィードバックを返す要件を追加。

## Impact

- `src/components/map/RegionEditModal.tsx`: `handleFileChange` を async に変更、Canvas正規化ロジックを追加
- `src/lib/storage/photo-db.ts`: 変更なし（保存するBlobの形式がJPEGに統一されることで、むしろ信頼性向上）
- 外部依存・APIへの影響なし
- IndexedDB に保存される写真がすべてJPEGになる（既存保存データとの互換性には影響しない）
