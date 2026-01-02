---
description: 指定した1画面のHTMLモックを生成（汎用）
allowed-tools: Read, Write, Edit, Glob, Grep
---

# Phase 4a: HTMLモック生成（単一画面）

## 概要
このコマンドは任意のサービスで使用できる汎用コマンドです。
最初に `index.html`（基盤）と `main.html`（メインコンテンツ）を作成し、
その後、他の画面を順次追加していく想定です。

---

## 前提
- Phase 3a で生成したデザインサンプルが承認済み
- 採用パターン番号が決定している
- Phase 3b で画面遷移図（flow.md）が生成済み

---

## 言語設定（重要）

**生成するHTMLのUI表示は全て日本語で記述すること:**
- ボタンテキスト（例: 「ログイン」「送信」「キャンセル」）
- ラベル（例: 「メールアドレス」「パスワード」）
- プレースホルダー（例: 「メールアドレスを入力」）
- エラーメッセージ
- ナビゲーション項目（例: 「ホーム」「設定」「カード一覧」）
- 見出し・タイトル
- ヘルプテキスト・ヒント
- 確認ダイアログのテキスト

```html
<!-- 例: 日本語で記述 -->
<button class="btn btn--primary">ログイン</button>
<label>メールアドレス</label>
<input placeholder="メールアドレスを入力してください">
<span class="error">パスワードが正しくありません</span>
```

---

## 参照ドキュメント（必須）

| ドキュメント | 用途 |
|-------------|------|
| docs/requirements/business-requirements.md | アプリ概要・機能一覧 |
| docs/requirements/functions/_index.md | 機能一覧・依存関係 |
| docs/requirements/functions/**/*.md | 対象機能の詳細仕様 |
| docs/screens/flow.md | 画面遷移図（画面情報の参照） |
| mock/sample/pattern-{N}/ | 採用デザインパターン |

---

## 出力先
`mock/v1/` ディレクトリに出力（`mock/sample/` は残す）

---

## アーキテクチャ: index.html + コンテンツHTML

### 構造
```
index.html（基盤シェル）
├── ヘッダー
├── サイドバー/ナビゲーション
├── メインコンテンツエリア（iframe または fetch で読み込み）
│   └── main.html（最初に作成）
│   └── [他の画面].html（順次追加）
└── フッター（任意）
```

### 実装方式
index.html は `<iframe>` または JavaScript の `fetch` でコンテンツHTMLを読み込む:

```html
<!-- 方式1: iframe（推奨・シンプル） -->
<main class="main-content">
  <iframe id="content-frame" src="main.html" frameborder="0"></iframe>
</main>

<!-- 方式2: fetch + innerHTML -->
<main class="main-content" id="content-area"></main>
<script>
  function loadPage(url) {
    fetch(url)
      .then(res => res.text())
      .then(html => document.getElementById('content-area').innerHTML = html);
  }
  loadPage('main.html');
</script>
```

### ナビゲーションリンク
サイドバーのリンクは iframe の src を変更、または loadPage() を呼び出す:

```html
<a href="#" onclick="loadPage('main.html')">ホーム</a>
<a href="#" onclick="loadPage('settings.html')">設定</a>
```

---

## 1. 実行前の確認（必須）

### Step 1: 生成対象の確認

**ユーザーに以下を質問すること:**

```
どの画面のHTMLモックを生成しますか？

【選択肢】
A) index.html + main.html（基盤とメイン画面を新規作成）
B) 追加画面（既にindex.htmlが存在する場合）

選択と以下の情報を教えてください:
1. 選択（A または B）
2. Bの場合: 追加する画面名（例: 設定画面、カード入力画面）
3. 採用パターン番号（mock/sample/pattern-{N} から選択）

※ docs/screens/flow.md に定義されている画面から選んでください。
```

**回答を得るまで次のステップに進まないこと。**

### Step 2: 必須ドキュメントの読み込み

```
1. Read docs/screens/flow.md
   → 指定画面のファイル名と遷移関係を特定

2. Read docs/requirements/functions/_index.md
   → 指定画面に関連する機能IDを特定

3. Read mock/sample/pattern-{N}/index.html
   → 採用パターンのHTML構造を参照

4. Read mock/sample/pattern-{N}/style.css
   → 採用パターンのカラー変数・スタイルを抽出
```

### Step 3: 対象画面の機能仕様読み込み

指定された画面に関連する機能仕様ファイルのみを読み込む:

```
# flow.md から対象画面に関連する機能IDを特定
# 該当する機能仕様ファイルを読み込み

例: メイン画面の場合
Read docs/requirements/functions/[カテゴリ]/F-XXX-*.md
...
```

### Step 4: 機能仕様から画面要素を抽出

機能仕様ファイルから以下を抽出してHTMLに反映:

| 抽出項目 | 反映先 |
|---------|-------|
| 入力/出力テーブル | フォームフィールド |
| バリデーション制約 | プレースホルダー、ヘルプテキスト |
| エラーケース | エラーメッセージ表示エリア |
| 画面要件セクション | UI構造・レイアウト |
| 受け入れ条件（AC） | 必要なUI要素の確認 |
| ユーザーフロー | ボタン配置・遷移リンク |

---

## 2. ファイル構成

### 初回生成時（選択肢A）
```
/mock
├── sample/                 # Phase 3a の成果物（残す）
└── v1/                     # 正式なMock出力先
    ├── index.html              # 基盤シェル（サイドバー、ヘッダー含む）
    ├── main.html               # メインコンテンツ（最初の画面）
    ├── css/
    │   └── style.css           # 共通スタイル
    └── js/
        └── main.js             # 共通JS（ナビゲーション、サイドバー制御）
```

### 追加画面生成時（選択肢B）
```
/mock/v1
├── ... (既存ファイル)
└── [追加画面].html          # 今回追加する画面
```

---

## 3. 固定仕様：YouTube型レスポンシブサイドバー

### レイアウト図（index.htmlに実装）
```
スマホ（~768px）         タブレット（768~1024px）   PC（1024px~）
┌──────────┐            ┌──────────────┐          ┌─────────────────┐
│ ヘッダー  │            │icon│          │          │icon ホーム │    │
├──────────┤            │icon│  iframe  │          │icon 機能1  │iframe│
│          │            │icon│  /fetch  │          │icon 機能2  │/fetch│
│  iframe  │            │    │ コンテンツ │          │icon 設定   │コンテンツ│
│  /fetch  │            └──────────────┘          └─────────────────┘
│ コンテンツ │            アイコンのみ表示            ラベル付きサイドバー
├──────────┤            ホバーで展開
│ ナビバー  │
└──────────┘
ボトムナビ
```

### 実装要件（index.html）
- スマホ: ボトムナビ + ハンバーガーメニュー（オーバーレイで開閉）
- タブレット: 左アイコンバー（ホバーで展開）
- PC: 左サイドバー（常時展開）

### コンテンツHTML（main.html等）
- サイドバー・ヘッダーは含めない（index.htmlが担当）
- 純粋なコンテンツのみ記述
- 独立して表示確認できるよう最低限のスタイルは読み込む

---

## 4. メインコンテンツレイアウト

画面の特性に応じて以下から選択:

| 画面タイプ | レイアウト | 該当画面例 |
|-----------|-----------|-----------|
| 認証系 | センターカード（独立HTML、index.html不使用） | login, register, password-reset |
| 一覧系 | タブ付きリスト or グリッド | ホーム画面（カード一覧） |
| 詳細系 | フルスクリーン or モーダル | カード学習画面 |
| フォーム系 | センター寄せフォーム | カード入力、設定 |
| ダッシュボード | カード型グリッド | 統計画面 |
| 管理系 | リスト型 | タグ管理 |

**注意**: 認証系画面はindex.htmlの中で読み込まず、独立したHTMLとして作成する

---

## 5. 機能仕様からHTML要素への変換ルール

### 5.1 入力/出力テーブル → フォームフィールド

機能仕様の「入力/出力」セクションから:

```markdown
| 入力 | email | string | Yes | メールアドレス | RFC 5322準拠、最大254文字 |
```
↓ 変換
```html
<div class="form-group">
  <label class="form-label" for="email">メールアドレス <span class="required">*</span></label>
  <input 
    type="email" 
    id="email" 
    class="form-input" 
    placeholder="example@email.com"
    maxlength="254"
    required
  >
  <span class="form-hint">RFC 5322準拠</span>
</div>
```

### 5.2 バリデーション → エラー表示

機能仕様の「エラーケース」から:

```markdown
| E-F001-02 | パスワードが要件を満たさない | パスワードは8文字以上、英数字を含める必要があります |
```
↓ 変換
```html
<span class="form-error" id="password-error" style="display:none;">
  パスワードは8文字以上、英数字を含める必要があります
</span>
```

### 5.3 画面要件 → UIコンポーネント

機能仕様の「画面要件」セクションのアスキーアート:

```
┌─────────────────────────────┐
│  今日の学習                  │
│  復習: 15枚  新規: 5枚       │
│     [ 学習開始 ]            │
└─────────────────────────────┘
```
↓ 変換
```html
<div class="card summary-card">
  <h2 class="card__title">今日の学習</h2>
  <div class="card__stats">
    <span>復習: <strong>15</strong>枚</span>
    <span>新規: <strong>5</strong>枚</span>
  </div>
  <button class="btn btn--primary">学習開始</button>
</div>
```

### 5.4 ビジネスルール → UI制約

機能仕様の「ビジネスルール」から:

```markdown
| BR-F016-02 | タグ上限 | 1カードあたり | 最大10タグまで |
```
↓ 変換
```html
<span class="form-hint">タグは最大10個まで (現在: <span id="tag-count">0</span>/10)</span>
```

---

## 6. 生成手順

### 選択肢A: index.html + main.html の新規作成

#### Step 1: 共通ファイル生成

1. `css/style.css`
   - 採用パターンの `:root` 変数を引き継ぐ
   - 共通コンポーネントスタイルを追加

2. `js/main.js`
   - ページ読み込み関数 `loadPage(url)`
   - サイドバー開閉
   - モーダル制御

#### Step 2: index.html 生成

```html
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>[アプリ名]</title>
  <link rel="stylesheet" href="css/style.css">
</head>
<body>
  <!-- ヘッダー -->
  <header class="header">
    <button class="hamburger" id="hamburger">☰</button>
    <h1 class="header__title">[アプリ名]</h1>
    <div class="header__actions"><!-- アクションボタン --></div>
  </header>

  <!-- サイドバー -->
  <nav class="sidebar" id="sidebar">
    <a href="#" class="sidebar__item active" onclick="loadPage('main.html')">
      <span class="sidebar__icon">🏠</span>
      <span class="sidebar__label">ホーム</span>
    </a>
    <!-- 他のナビゲーション項目 -->
  </nav>

  <!-- メインコンテンツエリア -->
  <main class="main-content">
    <iframe id="content-frame" src="main.html" frameborder="0"></iframe>
  </main>

  <!-- ボトムナビ（スマホ用） -->
  <nav class="bottom-nav">
    <!-- ナビゲーション項目 -->
  </nav>

  <script src="js/main.js"></script>
</body>
</html>
```

#### Step 3: main.html 生成

```html
<!--
  画面: メイン画面
  機能: F-XXX
  参照仕様: docs/requirements/functions/[カテゴリ]/F-XXX-*.md
  次の画面: [遷移先].html
-->
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="css/style.css">
</head>
<body class="content-body">
  <!-- メインコンテンツのみ記述 -->
  <div class="content-wrapper">
    <!-- 機能仕様に基づくUI要素 -->
  </div>
</body>
</html>
```

### 選択肢B: 追加画面の生成

#### Step 1: 共通ファイル確認

- `css/style.css` と `js/main.js` が存在することを確認
- 必要に応じてスタイル追加

#### Step 2: 追加画面HTML生成

- index.html のサイドバーにナビゲーションリンクを追加
- 新しいコンテンツHTMLを生成

---

## 7. 技術仕様

### CSS
- 外部ライブラリなし（Pure CSS）
- CSS Variables で色・サイズ管理
- BEM風の命名規則
- モバイルファーストのメディアクエリ

### JavaScript
- Vanilla JS のみ
- `loadPage(url)` - コンテンツ読み込み
- サイドバー開閉
- モーダル制御
- フォームバリデーション表示（視覚的フィードバック）

### ブレークポイント
```css
/* モバイルファースト */
/* タブレット: 768px以上 */
@media (min-width: 768px) { }
/* デスクトップ: 1024px以上 */
@media (min-width: 1024px) { }
```

### iframe スタイル
```css
.main-content iframe {
  width: 100%;
  height: 100%;
  border: none;
}

/* コンテンツHTML用 */
.content-body {
  margin: 0;
  padding: 1rem;
  background: transparent;
}
```

---

## 8. チェックリスト

### 選択肢A（初回生成）
- [ ] 対象画面に関連する機能仕様ファイルを読み込んだ
- [ ] css/style.css を生成した
- [ ] js/main.js を生成した（loadPage関数含む）
- [ ] index.html を生成した（基盤シェル）
- [ ] main.html を生成した（メインコンテンツ）
- [ ] index.html から main.html が正しく読み込まれる
- [ ] 3段階レスポンシブが動作する
- [ ] サイドバーのホバー展開が動作する

### 選択肢B（追加画面）
- [ ] 対象画面に関連する機能仕様ファイルを読み込んだ
- [ ] 追加画面のHTMLを生成した
- [ ] index.html のサイドバーにナビゲーションを追加した
- [ ] ナビゲーションから追加画面に遷移できる

### 共通
- [ ] 機能仕様の「入力/出力」がフォームに反映されている
- [ ] 機能仕様の「エラーケース」がエラー表示に反映されている
- [ ] 機能仕様の「画面要件」がUI構造に反映されている
- [ ] 機能仕様の「ビジネスルール」がUI制約に反映されている
- [ ] 画面冒頭にコメント記載（参照仕様パス含む）
- [ ] 採用パターンのスタイルが適用されている

---

## 完了条件

### 選択肢A（初回生成）
- [ ] ユーザーから採用パターン番号を確認済み
- [ ] 対象画面に関連する機能仕様を読み込み済み
- [ ] index.html（基盤シェル）が生成されている
- [ ] main.html（メインコンテンツ）が生成されている
- [ ] css/style.css が生成されている
- [ ] js/main.js が生成されている
- [ ] index.html から main.html が読み込まれて表示される
- [ ] 3段階レスポンシブが動作する
- [ ] 次のアクションとして他の画面を追加できる状態

### 選択肢B（追加画面）
- [ ] ユーザーから追加画面と採用パターン番号を確認済み
- [ ] 対象画面に関連する機能仕様を読み込み済み
- [ ] 追加画面のHTMLファイルが生成されている
- [ ] index.html から追加画面に遷移できる
- [ ] 機能仕様が忠実にUIに反映されている

---

## 次のアクション

main.html 完了後、以下の画面を順次追加:

1. このコマンドを再実行し、選択肢Bを選択
2. 追加したい画面名を指定
3. 画面HTMLを生成し、index.html のナビゲーションに追加

推奨順序（サービスによって異なる）:
1. main.html（メイン画面） ← 今回
2. 主要機能画面（カード入力、タグ管理等）
3. 設定画面
4. 認証画面（login.html, register.html）※ 独立HTML
