## Why

スマートフォンでのマップ操作・写真編集に2つの問題がある。

1. **地図のピンチズームがブラウザ拡大になる**: `GeoMapCanvas` のタッチイベントが React 合成イベント（passive モード）で登録されているため、`e.preventDefault()` がブラウザのピンチズームを止められない。結果、2本指ピンチがマップではなくブラウザ全体を拡大縮小する。
2. **写真クリッピングモーダルでドラッグできない**: `RegionEditModal` のドラッグ処理がマウスイベントのみで実装されており、タッチ操作に対応していない。

## What Changes

- `GeoMapCanvas` のタッチイベントを `useEffect` + ネイティブ `addEventListener({ passive: false })` で登録し直し、ピンチズームでブラウザではなくマップをズームする
- `GeoMapCanvas` に2本指ピンチによるマップスケール調整を実装する
- `RegionEditModal` のプレビュー領域に `useEffect` + ネイティブ `addEventListener({ passive: false })` でタッチハンドラを追加し、1本指ドラッグによる写真位置調整を実現する
- `RegionEditModal` に2本指ピンチによる写真スケール調整を実装する
- 既存のマウスイベント処理はいずれも変更しない（デスクトップ互換を維持）

## Capabilities

### New Capabilities

- `touch-drag-photo`: RegionEditModal のプレビュー領域でタッチドラッグによる写真位置調整とピンチによるスケール調整を実現する
- `map-pinch-zoom`: GeoMapCanvas でブラウザ拡大を抑制し、ピンチ操作でマップをズームする

### Modified Capabilities

- `region-photo-clip`: 写真のドラッグ移動シナリオにタッチ操作の要件を追加し、ピンチ操作によるスケール調整シナリオを追加する

## Impact

- **変更ファイル**: `src/components/map/GeoMapCanvas.tsx`, `src/components/map/RegionEditModal.tsx`
- **スペック更新**: `openspec/specs/region-photo-clip/spec.md`（タッチ操作要件の追記）
- **依存ライブラリ追加なし**: ブラウザネイティブの Touch Events API を使用
- **No Supabase / localStorage 変更なし**
