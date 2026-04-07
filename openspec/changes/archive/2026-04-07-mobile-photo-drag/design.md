## Context

2つのコンポーネントにスマートフォン操作の問題がある。

**GeoMapCanvas**: タッチイベントを React 合成イベント (`onTouchStart` / `onTouchMove` / `onTouchEnd`) で処理している。React 17以降、合成イベントは passive モードで DOM に登録されるため、ハンドラ内の `e.preventDefault()` がブラウザのネイティブピンチズームを阻止できない。また、2本指ピンチによるマップスケール変更も未実装（1本指パンのみ対応）。

**RegionEditModal**: 写真ドラッグ処理がマウスイベント (`onMouseDown` / `onMouseMove` / `onMouseUp`) のみで実装されており、タッチ操作に非対応。

両コンポーネントとも `"use client"` のクライアント専用コンポーネントであり、外部ライブラリ追加なしに Touch Events API で拡張できる。

## Goals / Non-Goals

**Goals:**
- `GeoMapCanvas`: ブラウザのピンチズームを抑制し、2本指ピンチでマップをズームする
- `GeoMapCanvas`: 既存の1本指パン・ホイールズーム・マウス操作を壊さない
- `RegionEditModal`: 1本指タッチドラッグで写真の offsetX / offsetY を調整する
- `RegionEditModal`: 2本指ピンチで写真スケールを調整する
- 両コンポーネントで `e.preventDefault()` が確実に機能するよう `{ passive: false }` で登録する

**Non-Goals:**
- タッチ対応を他コンポーネントに波及させない
- react-use-gesture / @use-gesture/react 等のライブラリ導入
- ピンチ中心点を考慮したズーム（ピンチ中心でのスケール）は v1 非対応（中心点固定でシンプルに実装）

## Decisions

### 1. React 合成イベントをやめて `useEffect` + ネイティブ `addEventListener({ passive: false })` を使う

**理由**: React の合成イベントは passive で登録されるため `e.preventDefault()` が iOS Safari で無効。`useEffect` でコンテナの `ref.current` に直接バインドすることで `{ passive: false }` を指定できる。

**GeoMapCanvas**: 既存の `onTouchStart` / `onTouchMove` / `onTouchEnd` / `onTouchCancel` props を JSX から削除し、`useEffect` でネイティブ登録に移行する。

**RegionEditModal**: 新たに `previewRef` を追加し、同様に `useEffect` でバインドする。

**代替案**: react-use-gesture はピンチ中心点対応など高機能だが、依存追加コストが大きいため却下。

### 2. ピンチスケールは2点間距離の比率で算出する

開始時の指間距離 `startDist` を記録し、`currentDist / startDist * startScale` でスケールを算出する。シンプルかつ自然なピンチ感が得られる。

### 3. GeoMapCanvas の既存タッチ ref をピンチにも流用する

現在の `touchStart` ref（`{ x, y, tx, ty }`）に加えて、ピンチ用の `pinchStart` ref（`{ dist, scale }`）を追加する。2本指検出時はパンを無効化しピンチのみ処理する。

## Risks / Trade-offs

- **[Risk] `useEffect` のクリーンアップ漏れ**: `removeEventListener` を確実に呼ばないとイベントリークが発生する。→ Mitigation: `useEffect` の return でクリーンアップを明示的に実装する。
- **[Risk] `e.stopPropagation()` の副作用**: Dialog の外側クリック検知が妨げられる可能性がある。→ Mitigation: `RegionEditModal` は `stopPropagation` を `touchmove` のみに限定し `touchstart` には付けない。
- **[Trade-off] ピンチ中心点を無視**: ピンチズームは現在の `transform.scale` を変えるだけで、ピンチ中心点でのスケール計算は行わない。実装をシンプルに保つ意図的な制限。

## Migration Plan

1. `GeoMapCanvas`: `svgRef` の代わりに wrapper `<div>` に `containerRef` を追加、`useEffect` でタッチイベントを移行、JSX の `onTouch*` props を削除
2. `RegionEditModal`: `previewRef` を追加し `useEffect` でタッチイベントをバインド
3. Chrome DevTools モバイルエミュレーターで確認
4. ロールバック: 変更は2ファイルのみ。`git revert` で即時復元可能。
