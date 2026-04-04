## 1. mapMode state の導入

- [x] 1.1 `CollectionPage` に `mapMode: 'edit' | 'pan'` state を追加し、デフォルトを `'edit'` にする
- [x] 1.2 `GeoMapCanvas` の props に `mapMode` を追加し、CollectionPage から渡す

## 2. モード切り替えボタン

- [x] 2.1 `CollectionPage` の `div.flex-1.min-h-0.relative` 内に `absolute bottom-4 left-4` でモード切り替えボタンを追加する
- [x] 2.2 edit モード時は ✋（`Hand` アイコン）、pan モード時は ↖（`MousePointer2` アイコン）を表示し、クリックでトグルする

## 3. GeoMapCanvas のモード対応

- [x] 3.1 `onClick` ハンドラを edit モード時のみ `onRegionClick` を呼ぶように変更する（pan モード時は無視）

## 4. タッチイベントの実装

- [x] 4.1 `onTouchStart` ハンドラを追加してパン開始（`e.preventDefault()` を呼び、1本目のタッチ座標と現在の transform を記録）
- [x] 4.2 `onTouchMove` ハンドラを追加してパン実行（移動量を計算し `onTransformChange` を呼ぶ）
- [x] 4.3 `onTouchEnd` / `onTouchCancel` ハンドラを追加してパン終了（edit モードかつ移動量4px未満のとき、タッチ位置のエリアを特定して `onRegionClick` を呼ぶ）
