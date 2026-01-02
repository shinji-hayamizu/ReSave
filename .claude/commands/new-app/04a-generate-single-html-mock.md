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
<!-- 例: 日本語 + Tailwind + data属性 -->
<button class="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition"
        data-action="onClick:handleLogin">
  ログイン
</button>
<label class="text-sm font-medium text-gray-700">メールアドレス</label>
<input class="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:outline-none"
       placeholder="メールアドレスを入力してください">
<span class="text-red-500 text-sm" data-state="error">パスワードが正しくありません</span>
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
↓ 変換（Tailwind + data属性）
```html
<!-- [Component: FormField] -->
<div class="flex flex-col gap-1" data-component="FormField" data-props="label,name,type,required,hint">
  <label class="text-sm font-medium text-gray-700" for="email">
    メールアドレス <span class="text-red-500">*</span>
  </label>
  <input 
    type="email" 
    id="email"
    name="email"
    class="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-primary focus:outline-none transition"
    placeholder="example@email.com"
    maxlength="254"
    required
    data-action="onChange:handleChange"
  >
  <span class="text-xs text-gray-500">RFC 5322準拠</span>
</div>
<!-- [/Component: FormField] -->
```

### 5.2 バリデーション → エラー表示

機能仕様の「エラーケース」から:

```markdown
| E-F001-02 | パスワードが要件を満たさない | パスワードは8文字以上、英数字を含める必要があります |
```
↓ 変換（状態バリエーション）
```html
<!-- [State: error] -->
<span class="text-red-500 text-sm" id="password-error" data-state="error" style="display:none;">
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
↓ 変換（Tailwind + data属性）
```html
<!-- [Component: StudySummaryCard] -->
<div class="bg-white rounded-xl shadow-md p-6" data-component="StudySummaryCard">
  <h2 class="text-lg font-bold text-gray-800 mb-4">今日の学習</h2>
  <div class="flex gap-6 mb-4">
    <span class="text-gray-600">復習: <strong class="text-primary" data-prop="reviewCount">15</strong>枚</span>
    <span class="text-gray-600">新規: <strong class="text-secondary" data-prop="newCount">5</strong>枚</span>
  </div>
  <button class="w-full bg-primary text-white py-3 rounded-lg font-medium hover:bg-primary/90 transition"
          data-action="onClick:handleStartStudy">
    学習開始
  </button>
</div>
<!-- [/Component: StudySummaryCard] -->
```

### 5.4 ビジネスルール → UI制約

機能仕様の「ビジネスルール」から:

```markdown
| BR-F016-02 | タグ上限 | 1カードあたり | 最大10タグまで |
```
↓ 変換
```html
<span class="text-xs text-gray-500">
  タグは最大10個まで (現在: <span data-prop="tagCount" id="tag-count">0</span>/10)
</span>
```

---

## 6. 生成手順

### 選択肢A: index.html + main.html の新規作成

#### Step 1: 共通ファイル生成

1. `css/style.css`
   - 採用パターンの `:root` 変数を引き継ぐ（カスタムカラー用）
   - Tailwindで対応できない追加スタイルのみ記述
   - アニメーション定義等

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
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          colors: {
            primary: 'var(--color-primary)',
            secondary: 'var(--color-secondary)',
          }
        }
      }
    }
  </script>
  <link rel="stylesheet" href="css/style.css">
</head>
<body class="min-h-screen bg-gray-50">
  <!-- [Component: Header] -->
  <header class="fixed top-0 left-0 right-0 h-14 bg-white border-b border-gray-200 flex items-center px-4 z-50"
          data-component="Header">
    <button class="lg:hidden p-2 hover:bg-gray-100 rounded-lg" id="hamburger"
            data-action="onClick:toggleSidebar">
      <span data-icon="lucide:Menu" class="w-6 h-6">☰</span>
    </button>
    <h1 class="text-lg font-bold text-gray-800 ml-2" data-prop="appName">[アプリ名]</h1>
    <div class="ml-auto flex items-center gap-2"><!-- アクションボタン --></div>
  </header>

  <!-- [Component: Sidebar] -->
  <nav class="fixed left-0 top-14 bottom-0 w-64 bg-white border-r border-gray-200 
              transform -translate-x-full lg:translate-x-0 transition-transform z-40
              md:w-16 md:translate-x-0 md:hover:w-64 group"
       id="sidebar" data-component="Sidebar">
    <a href="#" class="flex items-center gap-3 px-4 py-3 text-primary bg-primary/10 hover:bg-primary/20 transition"
       onclick="loadPage('main.html')" data-action="onClick:navigateTo('main')">
      <span data-icon="lucide:Home" class="w-5 h-5 flex-shrink-0">🏠</span>
      <span class="md:hidden md:group-hover:block lg:block">ホーム</span>
    </a>
    <!-- 他のナビゲーション項目 -->
  </nav>

  <!-- メインコンテンツエリア -->
  <main class="pt-14 lg:pl-64 md:pl-16 min-h-screen">
    <iframe id="content-frame" src="main.html" class="w-full h-[calc(100vh-3.5rem)] border-none"></iframe>
  </main>

  <!-- [Component: BottomNav] - スマホ用 -->
  <nav class="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-gray-200 
              flex items-center justify-around md:hidden"
       data-component="BottomNav">
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
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          colors: {
            primary: 'var(--color-primary)',
            secondary: 'var(--color-secondary)',
          }
        }
      }
    }
  </script>
  <link rel="stylesheet" href="css/style.css">
</head>
<body class="bg-transparent p-4">
  <!-- [Component: MainContent] -->
  <div class="max-w-4xl mx-auto" data-component="MainContent">
    <!-- 機能仕様に基づくUI要素 -->
    
    <!-- 例: カード一覧 -->
    <ul data-list="cards" class="flex flex-col gap-4">
      <!-- [ListItem: CardItem] -->
      <li data-list-item data-key="cardId" class="bg-white rounded-lg shadow p-4">
        <h3 data-prop="title" class="font-bold text-gray-800">カードタイトル</h3>
        <p data-prop="content" class="text-gray-600 text-sm mt-2">カード内容...</p>
      </li>
    </ul>
  </div>
  <!-- [/Component: MainContent] -->
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
- **Tailwind CSS を使用**（CDN版）
- CSS Variables でカスタムカラー管理（Tailwindと併用）
- モバイルファーストのレスポンシブ（Tailwindのブレークポイント使用）

```html
<!-- CDN読み込み -->
<script src="https://cdn.tailwindcss.com"></script>
<script>
  tailwind.config = {
    theme: {
      extend: {
        colors: {
          primary: 'var(--color-primary)',
          secondary: 'var(--color-secondary)',
          // 採用パターンから引き継ぐ
        }
      }
    }
  }
</script>
```

### JavaScript
- Vanilla JS のみ
- `loadPage(url)` - コンテンツ読み込み
- サイドバー開閉
- モーダル制御
- フォームバリデーション表示（視覚的フィードバック）

### ブレークポイント（Tailwind標準）
```html
<!-- モバイルファースト -->
<div class="block md:hidden">スマホのみ</div>
<div class="hidden md:block lg:hidden">タブレットのみ</div>
<div class="hidden lg:block">PCのみ</div>
```

### iframe スタイル
```html
<!-- Tailwindで記述 -->
<main class="flex-1 overflow-hidden">
  <iframe id="content-frame" src="main.html" class="w-full h-full border-none"></iframe>
</main>
```

---

## 7.1 React変換用 data属性規約（重要）

HTMLモックをReactコンポーネントに変換しやすくするため、以下のdata属性を使用すること。

### コンポーネント境界の明示
```html
<!-- [Component: LoginForm] -->
<form class="flex flex-col gap-4" data-component="LoginForm">
  <!-- [Component: FormField] -->
  <div data-component="FormField" data-props="label,name,type,required">
    <label class="text-sm font-medium text-gray-700">メールアドレス</label>
    <input name="email" type="email" required class="border rounded-lg px-3 py-2">
  </div>
</form>
<!-- [/Component: LoginForm] -->
```

### Propsになる動的値のマーク
```html
<span data-prop="userName">山田太郎</span>
<span data-prop="cardCount">15</span>
<img src="placeholder.jpg" data-prop="avatarUrl" class="w-10 h-10 rounded-full">
```

### イベントハンドラの明示
```html
<button data-action="onClick:handleLogin" class="bg-primary text-white px-4 py-2 rounded-lg">
  ログイン
</button>
<input data-action="onChange:handleInputChange" class="border rounded-lg px-3 py-2">
<form data-action="onSubmit:handleSubmit">
```

### 状態バリエーション（同ファイルに用意）
```html
<!-- [State: default] -->
<div data-state="default">通常表示</div>

<!-- [State: loading] -->
<div data-state="loading" class="hidden">
  <div class="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full"></div>
</div>

<!-- [State: error] -->
<div data-state="error" class="hidden">
  <p class="text-red-500">エラーが発生しました</p>
</div>

<!-- [State: empty] -->
<div data-state="empty" class="hidden">
  <p class="text-gray-500">データがありません</p>
</div>
```

### 繰り返し要素（map用）
```html
<ul data-list="cards" class="flex flex-col gap-2">
  <!-- [ListItem: CardItem] - この要素が .map() される -->
  <li data-list-item data-key="cardId" class="p-4 bg-white rounded-lg shadow">
    <span data-prop="title">カードタイトル</span>
  </li>
  <!-- サンプルとして2-3個表示 -->
  <li data-list-item data-key="cardId" class="p-4 bg-white rounded-lg shadow">...</li>
</ul>
```

### アイコン（Lucide Icons想定）
```html
<!-- React変換時: import { Home, Settings, Plus } from 'lucide-react' -->
<span data-icon="lucide:Home" class="w-5 h-5"></span>
<span data-icon="lucide:Settings" class="w-5 h-5"></span>
<span data-icon="lucide:Plus" class="w-5 h-5"></span>
```

### 条件付きレンダリング
```html
<!-- [Condition: isLoggedIn] -->
<div data-show-if="isLoggedIn">ログイン済みの表示</div>

<!-- [Condition: !isLoggedIn] -->
<div data-show-if="!isLoggedIn">未ログインの表示</div>
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
