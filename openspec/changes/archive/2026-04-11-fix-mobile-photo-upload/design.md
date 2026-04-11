## Context

現在、`RegionEditModal` の写真選択は `<input type="file" accept="image/*">` → `URL.createObjectURL(file)` → SVG `<image href>` という最短経路で処理している。これはローカルファイル（カメラロール）では問題ないが、以下の2ケースでサイレントに失敗する：

1. **Android + Google Photos クラウド写真**: Androidの `content://` URIはバックグラウンドダウンロードを隠ぺいする。Chromeがダウンロード完了を待たずに `File` オブジェクトを返すため、`createObjectURL` は成功するがBlobの実体が空、またはアクセス不能な状態になる。
2. **iOS + HEIC写真**: `<img>` 要素はOSレベルで変換されるがSVG `<image>` はブラウザのデコーダーを直接使うため、HEICをレンダリングできないことがある。

どちらも例外が発生せずUIに何も表示されないため、ユーザーは原因不明の失敗を経験する。

## Goals / Non-Goals

**Goals:**
- Android Google Photos クラウド写真のプレビューと保存が成功する
- HEIC形式の写真が正常にプレビューされ保存される
- 写真読み込み失敗時にユーザーへエラーメッセージを表示する
- 読み込み中はローディング状態を表示する

**Non-Goals:**
- 既存のIndexedDB保存データの再エンコード・マイグレーション
- アップロード前のリサイズ・圧縮品質の設定UI
- GIF・動画形式のサポート

## Decisions

### Decision 1: Canvas正規化パイプラインの導入

`File` を直接 `createObjectURL` するのではなく、一度 `<img>` 要素でロードしてからCanvasに描画してJPEG Blobに変換する。

```
File
  → URL.createObjectURL(file)（一時URL）
  → new Image() + img.onload（ここでクラウドダウンロード完了を待つ）
  → canvas.drawImage(img, ...)
  → canvas.toBlob("image/jpeg", 0.92)
  → 確実にJPEGのBlobとして以降の処理に渡す
```

**Alternatives considered:**
- `file.arrayBuffer()` → `new Blob([buffer])` だけでも読み込み待機はできるが、HEICをSVGで表示できない問題は解決しない。Canvasアプローチなら両方を同時に解決できる。
- `FileReader.readAsDataURL` → Base64のData URLを使うことも可能だが、大きなファイルでメモリ使用量が増える。Blobアプローチの方が効率的。

### Decision 2: 変換処理は `RegionEditModal` の `handleFileChange` 内にインライン実装

変換ロジックは `src/lib/storage/photo-normalize.ts` などの独立したユーティリティ関数として切り出す。これによりテスタビリティを確保し、将来他の箇所で再利用可能にする。

**Alternatives considered:**
- `handleFileChange` にインラインで書く → テストが書きにくい。

### Decision 3: 最大出力サイズの制限

Canvas変換時に長辺を2048px以内に制限する（元画像がそれ以下の場合はそのまま）。モバイルで撮った写真は4000px以上になることがあり、IndexedDBへの保存量を適切に抑える。

## Risks / Trade-offs

- **[Risk] 変換に時間がかかる** → Mitigation: ローディングスピナーを表示し、ユーザーが待機中であることを認識できるようにする
- **[Risk] 変換後のJPEGがPNG透過情報を失う** → Mitigation: このアプリで扱う写真（旅行写真）に透過は不要。許容できるトレードオフ。
- **[Risk] 既存の保存データとの不整合** → 既存データはそのまま動作する。新規保存からJPEGに統一されるだけで後方互換性への影響はない。
- **[Risk] 変換処理でメモリが逼迫する（低スペックモバイル）** → Mitigation: 最大2048px制限で緩和。

## Migration Plan

- データベース・IndexedDB のスキーマ変更なし
- 既存の保存写真はそのまま引き続き読み込み・表示できる
- 変換処理はクライアントサイドのみ。Supabase・API変更なし
- デプロイはVercelへの通常のPush

## Open Questions

なし
