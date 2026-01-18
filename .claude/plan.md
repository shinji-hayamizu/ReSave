# 実装計画: Cmd/Ctrl + Enter でカード投稿機能

## 概要
ホーム画面の「覚えたいこと」入力欄で `Cmd + Enter`（Mac）または `Ctrl + Enter`（Windows）を押すとカードを投稿できるようにする。

## 現状分析

### ファイル
- `apps/web/src/components/home/quick-input-form.tsx`

### 現在の動作
1. `handleFrontKeyDown` 関数が定義されている（30-35行目）
2. しかし、「覚えたいこと」欄の TextareaAutosize に `onKeyDown` が **設定されていない**
3. 「答え」欄には `handleBackKeyDown` が正しく設定されている（119-127行目）
4. `handleFrontKeyDown` の現在の実装: 「答え」欄にフォーカス移動

### 投稿可否の判定
```typescript
const isSubmitDisabled = createCard.isPending || !front.trim();
```
- `createCard.isPending` = 投稿処理中
- `!front.trim()` = 「覚えたいこと」が空

## 実装計画

### 修正内容

1. **`handleFrontKeyDown` 関数を修正**
   - 現在: 「答え」欄にフォーカス移動
   - 変更後: 投稿可能なら `form.requestSubmit()` でフォーム送信

2. **「覚えたいこと」欄に `onKeyDown` を追加**
   - TextareaAutosize に `onKeyDown={handleFrontKeyDown}` を追加

3. **フォームへの参照を追加**
   - 「答え」欄では `e.currentTarget.form?.requestSubmit()` を使用中
   - 「覚えたいこと」欄でも同様に `e.currentTarget.form?.requestSubmit()` を使用

### 変更後のコード

```typescript
const handleFrontKeyDown: TextareaAutosizeProps['onKeyDown'] = (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
    e.preventDefault();
    if (!isSubmitDisabled) {
      e.currentTarget.form?.requestSubmit();
    }
  }
};
```

TextareaAutosize への追加:
```tsx
<TextareaAutosize
  // ... 既存のprops
  onKeyDown={handleFrontKeyDown}
/>
```

## テスト観点

1. Mac: 「覚えたいこと」入力中に `Cmd + Enter` で投稿される
2. Windows: 「覚えたいこと」入力中に `Ctrl + Enter` で投稿される
3. 「覚えたいこと」が空の場合は投稿されない
4. 投稿処理中（isPending）は投稿されない
5. 「答え」欄でも引き続き `Cmd/Ctrl + Enter` で投稿できる

## 影響範囲

- `apps/web/src/components/home/quick-input-form.tsx` のみ
- 既存の「答え」欄のショートカット動作に影響なし
