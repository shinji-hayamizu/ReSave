---
description: 承認されたデザインで全画面のHTMLモックを生成
allowed-tools: Read, Write, Edit, Glob, Grep, Task
---

# Phase 4: HTMLモック生成（全画面）

## 前提
- Phase 3a で生成したデザインサンプルが承認済み
- 採用パターン番号が決定している
- Phase 3b で画面遷移図（flow.md）が生成済み

---

## 参照ドキュメント（必須）

| ドキュメント | 用途 |
|-------------|------|
| docs/requirements/business-requirements.md | アプリ概要・機能一覧 |
| docs/requirements/functions/_index.md | 機能一覧・依存関係 |
| docs/requirements/functions/**/*.md | 各機能の詳細仕様 |
| docs/screens/flow.md | 画面遷移図（生成すべき画面一覧） |
| mock/sample/pattern-{N}/ | 採用デザインパターン |

---

## 実行方法
- このタスクは **ultrathink** で実行すること
- 各HTMLファイルは **subAgent** で並列実行すること

## 出力先
`mock/` ディレクトリに出力（`sample/` は残す）

---

## 1. 実行前の確認（必須）

### Step 1: 採用パターンの確認

**ユーザーに以下を質問すること:**

```
Phase 3a で生成したデザインサンプルのうち、どのパターンを採用しますか？

mock/sample/ ディレクトリに生成されたパターンから番号で回答してください:
```

**回答を得るまで次のステップに進まないこと。**

### Step 2: 必須ドキュメントの読み込み

```
1. Read docs/screens/flow.md
   → 生成すべき全画面のファイル名と遷移関係を特定

2. Read docs/requirements/functions/_index.md
   → 機能一覧と依存関係を把握

3. Read mock/sample/pattern-{N}/style.css
   → 採用パターンのカラー変数・スタイルを抽出
```

### Step 3: 画面一覧の整理

flow.md から以下を整理:
- 画面名 → ファイル名のマッピング
- 各画面の遷移元・遷移先
- 対応する機能ID（F-XXX）
- 画面タイプ（認証/一覧/詳細/フォーム等）

---

## 2. ファイル構成

```
/mock
├── sample/                 # Phase 3a の成果物（残す）
├── index.html              # エントリーポイント（リダイレクト専用）
├── login.html              # ログイン画面
├── register.html           # 会員登録画面
├── [メイン画面].html        # メイン画面
├── [機能名].html           # 各機能画面（flow.mdから特定）
├── settings.html           # 設定画面
├── css/
│   └── style.css           # 共通スタイル（採用パターンベース）
├── js/
│   └── main.js             # 共通JS（サイドバー開閉等）
└── components/             # 共通パーツ確認用（オプション）
    └── styleguide.html
```

※ 具体的なファイル名は `docs/screens/flow.md` の画面遷移図から決定すること

---

## 3. 固定仕様：YouTube型レスポンシブサイドバー

### レイアウト図
```
スマホ（~768px）         タブレット（768~1024px）   PC（1024px~）
┌──────────┐            ┌──────────────┐          ┌─────────────────┐
│  Header  │            │icon│          │          │icon Home   │    │
├──────────┤            │icon│   Main   │          │icon 機能1  │Main│
│          │            │icon│  Content │          │icon 機能2  │Content│
│   Main   │            │    │          │          │icon Settings│   │
│  Content │            └──────────────┘          └─────────────────┘
├──────────┤            アイコンのみ表示            ラベル付きサイドバー
│ NavBar   │            ホバーで展開
└──────────┘
ボトムナビ
```

### 実装要件
- スマホ: ハンバーガーメニュー（オーバーレイで開閉）
- タブレット: 左アイコンバー（ホバーで展開）
- PC: 左サイドバー（常時展開）

---

## 4. メインコンテンツレイアウト

各画面の特性に応じて以下から選択:

| 画面タイプ | レイアウト | 該当画面例 |
|-----------|-----------|-----------|
| 認証系 | センターカード（サイドバーなし） | login, register, password-reset |
| 一覧系 | タブ付きリスト or グリッド | ホーム画面（カード一覧） |
| 詳細系 | フルスクリーン or モーダル | カード学習画面 |
| フォーム系 | センター寄せフォーム | カード入力、設定 |
| ダッシュボード | カード型グリッド | 統計画面 |
| 管理系 | リスト型 | タグ管理 |

---

## 5. 生成手順

### Step 1: 共通ファイル生成

1. `css/style.css`
   - 採用パターンの `:root` 変数を引き継ぐ
   - 共通コンポーネントスタイルを追加

2. `js/main.js`
   - サイドバー開閉
   - モーダル制御
   - フォームバリデーション表示

### Step 2: 各画面を並列生成

```
Task: index.html 生成
Task: login.html 生成
Task: register.html 生成
Task: [メイン画面].html 生成
Task: [機能1].html 生成
Task: [機能2].html 生成
...
```

---

## 6. 各ファイルの実装指示

### index.html
```html
<!DOCTYPE html>
<html>
<head>
  <meta http-equiv="refresh" content="0; url=login.html">
</head>
<body></body>
</html>
```

### 認証画面（login.html, register.html, password-reset.html）
- サイドバーなし
- センター配置のカード型フォーム
- ロゴ + フォーム + フッターリンク

### メイン画面（ホーム等）
- YouTube型サイドバー適用
- ヘッダー: ハンバーガーメニュー + アプリ名 + アクションボタン
- メインコンテンツ: 画面タイプに応じたレイアウト

### コメント規約
各画面の冒頭に以下を記載:

```html
<!--
  画面: [画面名]
  機能: F-XXX ([機能名])
  前の画面: [遷移元].html
  次の画面: [遷移先].html
-->
```

---

## 7. 技術仕様

### CSS
- 外部ライブラリなし（Pure CSS）
- CSS Variables で色・サイズ管理
- BEM風の命名規則
- モバイルファーストのメディアクエリ

### JavaScript
- Vanilla JS のみ
- サイドバー開閉
- モーダル制御
- フォームバリデーション表示（視覚的フィードバック）

### ブレークポイント
```css
/* Mobile first */
/* Tablet: 768px+ */
@media (min-width: 768px) { }
/* Desktop: 1024px+ */
@media (min-width: 1024px) { }
```

---

## 8. subAgent への指示テンプレート

各 subAgent には以下を渡すこと:

```
【画面名】: [画面名]
【ファイル】: mock/[ファイル名].html

【参照ドキュメント】
- docs/screens/flow.md の該当部分
- docs/requirements/functions/[カテゴリ]/F-XXX-*.md

【採用デザイン】
- mock/sample/pattern-{N}/style.css のカラー・スタイルを使用

【画面情報】
- 機能ID: F-XXX
- 前の画面: [遷移元]（flow.mdより）
- 次の画面: [遷移先]（flow.mdより）

【レイアウトタイプ】: [認証/一覧/詳細/フォーム等]

【共通ファイル】
css/style.css と js/main.js を link/script で読み込むこと

【コメント規約】
画面冒頭に以下を記載:
<!--
  画面: [画面名]
  機能: F-XXX
  前の画面: [遷移元].html
  次の画面: [遷移先].html
-->
```

---

## 9. チェックリスト

### 全体
- [ ] **docs/screens/flow.md** の全画面がHTMLとして存在する
- [ ] 画面遷移のリンクが flow.md と整合している
- [ ] 採用パターンのスタイルが適用されている
- [ ] css/style.css が生成されている
- [ ] js/main.js が生成されている

### 各画面
- [ ] 3段階レスポンシブ対応（スマホ/タブレット/PC）
- [ ] 画面冒頭にコメント記載
- [ ] 適切なレイアウトタイプ使用
- [ ] サイドバーのホバー展開が動作する

### 認証状態の表現
- [ ] ログイン前後でヘッダー表示が異なる
- [ ] 認証系画面はサイドバーなし

---

## 完了条件

- [ ] ユーザーから採用パターン番号を確認済み
- [ ] docs/screens/flow.md の全画面がHTMLファイルとして生成されている
- [ ] css/style.css が採用パターンベースで生成されている
- [ ] js/main.js が生成されている
- [ ] 3段階レスポンシブが全画面で動作する
- [ ] サイドバーのホバー展開が動作する
- [ ] 各画面冒頭にコメントで画面情報が記載されている
- [ ] flow.md の遷移図と整合している
