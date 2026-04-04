## Context

現在の `GeoMapCanvas` は transform 状態（x・y・scale）を内部で保持している。コントロールパネルからズーム・パンを制御するには、この状態を親コンポーネント（`CollectionPage`）に引き上げ、パネルと GeoMapCanvas の両方から共有する必要がある。

## Goals / Non-Goals

**Goals:**
- 画面右下に Figma 風の常駐コントロールパネルを追加する
- GeoMapCanvas の transform 状態を親に引き上げ、パネルと共有する
- ホイール・ドラッグによる既存操作を維持する

**Non-Goals:**
- ズームのアニメーション（トランジション）
- キーボードショートカット
- ピンチズームのモバイル対応（別途対応）

## Decisions

### 決定1: transform 状態を CollectionPage に引き上げる

**採用**: `GeoMapCanvas` が持っていた `transform` state を `CollectionPage` に移動し、`MapZoomControls` と `GeoMapCanvas` の両方に props として渡す。

**理由**: パネルとマップが同じ状態を操作するため、共通の親で管理するのが自然。Context は今回の規模では不要。

```
CollectionPage
  ├── transform state { x, y, scale }
  ├── GeoMapCanvas  ← transform / onTransformChange
  └── MapZoomControls ← transform / onZoom / onPan / onFit
```

### 決定2: コントロールパネルのレイアウト

Figma に倣い、右下固定の縦積みレイアウト:

```
┌─────────┐
│  ↑      │  ← パン上
│← ⌂ →  │  ← パン左 / フィット / パン右
│  ↓      │  ← パン下
├─────────┤
│  +      │  ← ズームイン
│ 125%    │  ← ズーム率表示
│  −      │  ← ズームアウト
└─────────┘
```

### 決定3: ズームステップとパン移動量

- ズームステップ: ×1.25 / ÷1.25（ホイールと同じ係数）
- パン移動量: 現在のビューポートの 20%（scale に依存しない絶対ピクセル）
- スケール範囲: 0.3〜20（既存と同じ）

## Risks / Trade-offs

| リスク | 緩和策 |
|--------|--------|
| モバイルで右下パネルが操作しにくい | パネルサイズを十分に確保（タップ領域 40px 以上） |
| transform state の引き上げで GeoMapCanvas の変更が大きい | props の追加のみで既存ロジックは保持 |
