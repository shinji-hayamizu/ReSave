---
name: review-ui-ux
description: ブラウザでWebアプリのUI/UXをレビュー。スクリーンショットとスナップショットから視覚的・操作性の問題を検出。
allowed-tools: Read, Glob, Grep, Bash, Task, TodoWrite, mcp__chrome-devtools__*
---

# UI/UXビジュアルレビュースキル

## 概要

Chrome DevTools MCPを使用して実行中のWebアプリのスクリーンショットを取得し、UI/UXの観点からレビューを行う。視覚的なデザイン、レイアウト、操作性、アクセシビリティを評価。

## 前提条件

- Webアプリが `localhost:3000` で起動中
- Chrome DevTools MCPが接続済み
- ブラウザでアプリが開かれている状態

## 使用方法

```bash
# 現在の画面をレビュー
/review-ui-ux

# 特定のURLをレビュー
/review-ui-ux /cards/new

# 複数画面を連続レビュー
/review-ui-ux --pages /,/cards,/review,/stats

# モバイル表示でレビュー
/review-ui-ux --mobile

# HTMLモックと比較レビュー
/review-ui-ux --compare docs/screens/mock/v1/main.html
```

## 実行フロー

### 1. 画面キャプチャ

```
mcp__chrome-devtools__take_screenshot({ fullPage: true })
mcp__chrome-devtools__take_snapshot()
```

### 2. レビュー観点

#### A. 視覚的デザイン

| 項目 | チェック内容 |
|------|-------------|
| 色のコントラスト | テキストと背景のコントラスト比 |
| タイポグラフィ | フォントサイズ、行間、読みやすさ |
| 余白・間隔 | 要素間のスペーシング一貫性 |
| 視覚的階層 | 重要な要素が目立っているか |
| 整列 | 要素のアラインメント |

#### B. レイアウト

| 項目 | チェック内容 |
|------|-------------|
| 配置 | 要素の配置が論理的か |
| レスポンシブ | 異なる画面サイズでの表示 |
| スクロール | 重要な情報がファーストビューにあるか |
| 余白切れ | 要素がはみ出していないか |

#### C. 操作性（インタラクション）

| 項目 | チェック内容 |
|------|-------------|
| クリック可能性 | ボタン/リンクが認識できるか |
| タップ領域 | モバイルで十分なサイズか（最低44x44px） |
| フォーカス状態 | キーボードフォーカスが見えるか |
| ホバー状態 | インタラクティブ要素の反応 |

#### D. アクセシビリティ

| 項目 | チェック内容 |
|------|-------------|
| ARIAラベル | スクリーンリーダー対応 |
| 見出し構造 | h1-h6の階層が適切か |
| フォームラベル | 入力フィールドのラベル |
| 代替テキスト | 画像のalt属性 |

### 3. インタラクションテスト

```
# ホバー状態の確認
mcp__chrome-devtools__hover({ uid: "btn-submit" })
mcp__chrome-devtools__take_screenshot()

# フォーカス状態の確認
mcp__chrome-devtools__press_key({ key: "Tab" })
mcp__chrome-devtools__take_screenshot()

# エラー状態の確認
mcp__chrome-devtools__click({ uid: "btn-submit" })
mcp__chrome-devtools__take_screenshot()
```

### 4. レスポンシブテスト

```
# モバイル表示
mcp__chrome-devtools__resize_page({ width: 375, height: 812 })
mcp__chrome-devtools__take_screenshot()

# タブレット表示
mcp__chrome-devtools__resize_page({ width: 768, height: 1024 })
mcp__chrome-devtools__take_screenshot()

# デスクトップに戻す
mcp__chrome-devtools__resize_page({ width: 1280, height: 800 })
```

## 出力形式

### レビューレポート

```markdown
# UI/UXレビューレポート

## 対象画面
- URL: /cards/new
- デバイス: Desktop (1280x800)
- 日時: 2026-01-04 12:00:00

## スクリーンショット
[screenshot.png]

## 評価サマリー

| カテゴリ | 評価 | 件数 |
|---------|------|------|
| 視覚デザイン | Good | - |
| レイアウト | Warning | 2 |
| 操作性 | Critical | 1 |
| アクセシビリティ | Warning | 3 |

## 詳細

### Critical

#### 操作性: 保存ボタンのタップ領域が小さい
- 場所: 画面右下の保存ボタン
- 問題: タップ領域が32x32pxで、推奨の44x44px未満
- 影響: モバイルユーザーが誤タップしやすい
- 改善案: ボタンサイズを最低44x44pxに拡大

### Warning

#### レイアウト: フォームが画面幅を超えている
- 場所: タグ選択セクション
- 問題: 横スクロールが発生
- 影響: コンテンツが見切れる
- 改善案: flex-wrapを追加してラップさせる

#### アクセシビリティ: フォーカス状態が見えない
- 場所: テキスト入力フィールド
- 問題: outline: noneで消されている
- 影響: キーボードユーザーが現在位置を把握できない
- 改善案: focus-visibleスタイルを追加

### Info

#### 視覚デザイン: プレースホルダーのコントラストが低い
- 場所: テキスト入力フィールド
- 現状: #bbb (コントラスト比 2.3:1)
- 推奨: #767676以上 (コントラスト比 4.5:1)

## 推奨アクション

1. [ ] 保存ボタンのサイズを44x44px以上に拡大
2. [ ] タグ選択にflex-wrapを追加
3. [ ] focus-visibleスタイルを追加
4. [ ] プレースホルダーの色を#767676以上に変更
```

## HTMLモック比較モード

`--compare` オプションでHTMLモックと実装を比較:

```bash
/review-ui-ux --compare docs/screens/mock/v1/card-input.html
```

### 比較項目

- レイアウトの一致度
- 色・フォントの一致
- 要素の配置
- 余白・間隔
- インタラクション要素の存在

### 差分レポート

```markdown
## モック比較レポート

### 比較対象
- モック: docs/screens/mock/v1/card-input.html
- 実装: localhost:3000/cards/new

### 差分

| 項目 | モック | 実装 | 判定 |
|------|--------|------|------|
| ヘッダー高さ | 64px | 56px | Diff |
| 保存ボタン色 | #3B82F6 | #2563EB | OK (近似) |
| タグ表示 | 横並び | 縦並び | Diff |

### 視覚差分
[diff-overlay.png]
```

## エラー状態のテスト

### フォームバリデーション

```
# 空送信
mcp__chrome-devtools__click({ uid: "btn-submit" })
mcp__chrome-devtools__take_screenshot({ filePath: "error-empty.png" })

# 不正入力
mcp__chrome-devtools__fill({ uid: "input-email", value: "invalid" })
mcp__chrome-devtools__click({ uid: "btn-submit" })
mcp__chrome-devtools__take_screenshot({ filePath: "error-invalid.png" })
```

### 確認項目

- エラーメッセージの視認性
- エラー箇所のハイライト
- エラーメッセージの内容（具体的か）
- エラー解消後の表示

## 関連スキル

- `/validate-ui` - 機能仕様書との突合検証
- Multi-review `ui-ux` - コードベースのUI/UXレビュー
