## Context

`GeoMapCanvas` は現在マウスイベント（`onMouseDown/Move/Up`）のみでパン操作を実装しており、タッチデバイスでは一切動作しない。モード概念も存在せず、ドラッグとクリックの区別は `hasDragged` refで行っている。

## Goals / Non-Goals

**Goals:**
- `edit` / `pan` の2モードを導入し、CollectionPage でモード状態を管理する
- `GeoMapCanvas` にタッチイベントを追加してスマートフォンでのパン・選択を可能にする
- 左下フローティングボタンでモードを切り替えられるようにする

**Non-Goals:**
- ピンチズーム（2本指ズーム）は対象外
- RegionEditModal のタッチ対応は別 change で行う
- キーボードショートカット（Space+ドラッグ等）は対象外

## Decisions

### mapMode state は CollectionPage に置く

`mapMode: 'edit' | 'pan'` を `CollectionPage` で管理し、`GeoMapCanvas` と新設するモード切り替えボタンに props として渡す。

**理由**: transform state と同様に、mapMode はキャンバス外のUIにも影響する横断的な状態。コンポーネント間で共有しやすい位置に置く。

### タッチ操作の「タップ」判定は hasDragged と同じ閾値を使う

`onTouchEnd` 時に移動距離が4px未満であればタップとみなし、editモード時のみ `onRegionClick` を呼ぶ。マウスの `hasDragged` ロジックと統一する。

**理由**: 別の閾値を持つと挙動が分岐して混乱する。

### モード切り替えボタンは CollectionPage 内に直接配置する

`MapZoomControls` を変更せず、`CollectionPage` の `div.flex-1.min-h-0.relative` 内に `absolute bottom-4 left-4` でボタンを配置する。

**理由**: ズームコントロールと責務が異なるため別管理が自然。シンプルな `<button>` で十分。

### タッチ中の `hoveredRegionId` は更新しない

タッチでは hover ラベルを表示しない（`onTouchStart/Move` では `setHoveredRegionId` を呼ばない）。

**理由**: タッチデバイスに hover の概念は不自然。

## Risks / Trade-offs

- [タッチイベントとマウスイベントが両方発火する端末（一部Windows タブレット等）] → タッチイベントハンドラ内で `e.preventDefault()` を呼ぶことでマウスイベントの重複発火を防ぐ
- [タッチ操作中に `isPanning` state が true のまま残るケース] → `onTouchEnd` と `onTouchCancel` の両方でリセットする
