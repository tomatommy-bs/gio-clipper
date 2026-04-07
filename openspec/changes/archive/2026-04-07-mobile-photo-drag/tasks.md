## 1. GeoMapCanvas — ブラウザピンチズーム抑制 & マップピンチズーム実装

- [x] 1.1 wrapper `<div>` に `containerRef` (`useRef<HTMLDivElement>(null)`) を追加する
- [x] 1.2 JSX から `onTouchStart` / `onTouchMove` / `onTouchEnd` / `onTouchCancel` props を削除する
- [x] 1.3 `useEffect` で `containerRef.current` に `touchstart` / `touchmove` / `touchend` / `touchcancel` を `{ passive: false }` で登録し、クリーンアップで `removeEventListener` する
- [x] 1.4 既存の1本指パンロジックをネイティブハンドラに移植する（`e.touches.length === 1` 時）
- [x] 1.5 `pinchStart` ref（`{ dist: number; scale: number }`）を追加し、2本指検出時（`e.touches.length === 2`）にピンチスケール計算を実装する
- [x] 1.6 `touchmove` で `e.preventDefault()` を呼び出してブラウザズームを抑制する
- [x] 1.7 `touchend` / `touchcancel` でピンチ状態をリセットし、指が1本以下になったらパン状態もリセットする

## 2. RegionEditModal — タッチドラッグ & ピンチスケール実装

- [x] 2.1 プレビュー `<div>` に `previewRef` (`useRef<HTMLDivElement>(null)`) を追加する
- [x] 2.2 `useEffect` で `previewRef.current` に `touchstart` / `touchmove` / `touchend` を `{ passive: false }` で登録し、クリーンアップで `removeEventListener` する
- [x] 2.3 1本指タッチドラッグハンドラを実装する（既存の `dragStart` ref を流用して `offsetX` / `offsetY` を更新）
- [x] 2.4 `touchmove` で `e.preventDefault()` と `e.stopPropagation()` を呼び出しページスクロールを抑制する
- [x] 2.5 2本指ピンチハンドラを実装する（指間距離比率で `scale` を更新）
- [x] 2.6 `touchend` / `touchcancel` でドラッグ・ピンチ状態をリセットする

## 3. 動作確認

- [ ] 3.1 Chrome DevTools モバイルエミュレーターで地図の2本指ピンチがブラウザズームを引き起こさないことを確認する
- [ ] 3.2 同エミュレーターで地図の1本指パンが正常に機能することを確認する
- [ ] 3.3 同エミュレーターで地図の2本指ピンチがマップをズームすることを確認する
- [ ] 3.4 同エミュレーターで `RegionEditModal` の1本指ドラッグが写真位置を変更することを確認する
- [ ] 3.5 同エミュレーターで `RegionEditModal` のピンチが写真スケールを変更することを確認する
- [ ] 3.6 デスクトップのマウス操作（ホイールズーム・マウスパン・ドラッグ）が壊れていないことを確認する

## 4. コード品質

- [x] 4.1 `pnpm lint` を実行してゼロエラー・ゼロ警告を確認する
- [x] 4.2 `pnpm test --run` を実行して既存テストが全て通ることを確認する
