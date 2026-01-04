---
description: 完成済みデザインで全画面のHTMLモックを生成
allowed-tools: Read, Write, Edit, Glob, Grep, Task
---

# Phase 4: HTMLモック生成（全画面）

## 前提
- **Phase 4a で `mock/v1/index.html` + `mock/v1/main.html` + `mock/v1/css/style.css` が完成済み**
- Phase 3b で画面遷移図（flow.md）が生成済み
- **完成済みの `main.html` のデザインシステムを全画面で踏襲する**

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

---

## 参照ドキュメント（必須）

| ドキュメント | 用途 |
|-------------|------|
| docs/requirements/business-requirements.md | アプリ概要・機能一覧 |
| docs/requirements/functions/_index.md | 機能一覧・依存関係 |
| docs/requirements/functions/**/*.md | 各機能の詳細仕様（**全ファイル必読**） |
| docs/screens/flow.md | 画面遷移図（生成すべき画面一覧） |
| **mock/v1/main.html** | **デザインシステムの参照元（最重要）** |
| **mock/v1/css/style.css** | **スタイルシステムの参照元（最重要）** |
| mock/v1/index.html | レイアウト構造の参照 |

---

## 実行方法
- このタスクは **ultrathink** で実行すること
- 各HTMLファイルは **subAgent** で並列実行すること

## 出力先
`mock/v1/` ディレクトリに出力

---

## 1. 実行前の確認（必須）

### Step 0: 基盤ファイルの存在確認

**以下のファイルが存在することを確認すること:**

```
Read mock/v1/index.html
Read mock/v1/main.html
Read mock/v1/css/style.css
Read mock/v1/js/main.js
```

**これらのファイルが存在しない場合は、先に Phase 4a を実行して基盤を作成すること。**

### Step 1: デザインシステムの抽出（最重要）

**`mock/v1/main.html` と `mock/v1/css/style.css` を完全に読み込み、以下のデザイン特性を抽出・記録すること:**

#### 1.1 CSS変数の抽出

`style.css` の `:root` セクションから全変数を抽出:

```
【抽出項目】
- カラー変数: --color-*, --bg-*, --text-* など
- スペーシング変数: --spacing-*, --gap-*, --padding-* など
- サイズ変数: --sidebar-width-*, --header-height-* など
- ボーダー変数: --border-color, --border-radius-* など
- シャドウ変数: --shadow-* など
- トランジション変数: --transition-* など
- フォント変数: --font-*, --text-* など
```

#### 1.2 クラス命名規則の抽出

`style.css` と `main.html` から命名パターンを特定:

```
【抽出項目】
- ブロック名: どのような単語・形式で命名されているか
- エレメント区切り: __ (BEM), - (kebab), _ など
- モディファイア区切り: -- (BEM), - など
- 状態クラス: .active, .open, .disabled など
- ユーティリティクラス: .mobile-only, .desktop-only など
```

#### 1.3 コンポーネント構造の抽出

`main.html` からコンポーネント境界マーカーのパターンを特定:

```
【抽出項目】
- コンポーネント開始マーカー: <!-- [Component: XXX] --> など
- コンポーネント終了マーカー: <!-- [/Component: XXX] --> など
- リストアイテムマーカー: <!-- [ListItem: XXX] --> など
- 状態マーカー: <!-- [State: XXX] --> など
- 条件マーカー: <!-- [Condition: XXX] --> など
```

#### 1.4 data属性パターンの抽出

`main.html` から使用されているdata属性を特定:

```
【抽出項目】
- コンポーネント指定: data-component など
- Props指定: data-props, data-prop など
- イベント指定: data-action など
- リスト指定: data-list, data-list-item, data-key など
- 状態指定: data-state など
- 条件表示: data-show-if など
- アイコン指定: data-icon など
```

#### 1.5 既存コンポーネントのスタイル抽出

`style.css` から再利用すべきコンポーネントクラスを一覧化:

```
【抽出項目】
- レイアウト系: .layout, .main, .sidebar, .content-* など
- カード系: *-card, *__card など
- ボタン系: .btn, .btn-*, button系クラス
- フォーム系: .form-*, input系クラス
- リスト系: *-list, *-item など
- タブ系: .tabs, .tab, *-tab など
- その他: 頻出するコンポーネントクラス
```

### Step 2: 必須ドキュメントの読み込み

```
1. Read docs/screens/flow.md
   → 生成すべき全画面のファイル名と遷移関係を特定

2. Read docs/requirements/functions/_index.md
   → 機能一覧と依存関係を把握
```

### Step 3: 機能仕様の全読み込み（必須）

**`docs/requirements/functions/` 配下の全ファイルを読み込むこと:**

```
# ディレクトリ構造を確認
Glob docs/requirements/functions/**/*.md

# 全ファイルを読み込み（存在する全ファイル）
```

### Step 4: 機能仕様から画面要素を抽出

各機能仕様ファイルから以下を抽出してHTMLに反映:

| 抽出項目 | 反映先 |
|---------|-------|
| 入力/出力テーブル | フォームフィールド |
| バリデーション制約 | プレースホルダー、ヘルプテキスト |
| エラーケース | エラーメッセージ表示エリア |
| 画面要件セクション | UI構造・レイアウト |
| 受け入れ条件（AC） | 必要なUI要素の確認 |
| ユーザーフロー | ボタン配置・遷移リンク |

### Step 5: 画面一覧の整理

flow.md + 機能仕様から以下を整理:

| 画面 | ファイル名 | 対応機能 | 主要UI要素 |
|-----|-----------|---------|-----------|
| (flow.mdから) | (flow.mdから) | F-XXX | (機能仕様から抽出) |

---

## 2. デザインシステム踏襲ルール（厳守）

### 2.1 CSS変数の必須使用

新しい画面でも必ず **Step 1.1 で抽出した CSS変数** を使用すること。独自の色・サイズをハードコードしないこと。

```html
<!-- ❌ NG: ハードコード -->
<div style="background: #ffffff; border-radius: 12px;">

<!-- ✅ OK: CSS変数（抽出した変数名を使用） -->
<div style="background: var(--bg-primary); border-radius: var(--border-radius-lg);">

<!-- ✅ 最善: 既存クラス使用 -->
<div class="card">
```

### 2.2 クラス命名規則の統一

**Step 1.2 で抽出した命名パターン** に従うこと:

```
【新規コンポーネント作成時】
- 既存の命名パターンを踏襲
- ブロック/エレメント/モディファイアの区切り文字を統一
- 既存クラスの再利用を優先

【例: BEM風の場合】
.{block-name}
.{block-name}__{element}
.{block-name}--{modifier}
```

### 2.3 コンポーネントマーカーの必須記載

**Step 1.3 で抽出したマーカー形式** を使用:

```html
<!-- 抽出した形式に従う（例: [Component: XXX] 形式の場合） -->
<!-- [Component: LoginForm] -->
<form class="login-form" data-component="LoginForm">
  <!-- ... -->
</form>
<!-- [/Component: LoginForm] -->
```

### 2.4 data属性の統一パターン

**Step 1.4 で抽出したdata属性** を統一して使用:

| 用途 | 属性（抽出した形式を使用） |
|-----|------|
| コンポーネント名 | data-component など |
| Props | data-props / data-prop など |
| イベント | data-action など |
| リスト | data-list + data-list-item など |
| 条件表示 | data-show-if など |
| 状態 | data-state など |
| アイコン | data-icon など |

### 2.5 レスポンシブブレークポイント

**style.css のメディアクエリ** から抽出したブレークポイントを使用:

```css
/* style.css から抽出したブレークポイントに従う */
/* 例: */
/* Mobile (default) */
/* Tablet 768px+ */
/* Desktop 1024px+ */
/* Large Desktop 1280px+ */
```

---

## 3. ファイル構成

```
/mock
└── v1/                     # 正式なMock出力先
    ├── index.html              # エントリーポイント（完成済み）
    ├── main.html               # メイン画面（完成済み・参照元）
    ├── login.html              # ログイン画面
    ├── register.html           # 会員登録画面
    ├── [機能名].html           # 各機能画面（flow.mdから特定）
    ├── css/
    │   └── style.css           # 共通スタイル（完成済み）
    └── js/
        └── main.js             # 共通JS（完成済み）
```

※ 具体的なファイル名は `docs/screens/flow.md` の画面遷移図から決定すること

---

## 4. 固定仕様：YouTube型レスポンシブサイドバー

### レイアウト図
```
スマホ（~768px）         タブレット（768~1024px）   PC（1024px~）
┌──────────┐            ┌──────────────┐          ┌─────────────────┐
│ ヘッダー  │            │icon│          │          │icon ホーム │    │
├──────────┤            │icon│  メイン   │          │icon 機能1  │メイン│
│          │            │icon│ コンテンツ │          │icon 機能2  │コンテンツ│
│  メイン   │            │    │          │          │icon 設定   │   │
│ コンテンツ │            └──────────────┘          └─────────────────┘
├──────────┤            アイコンのみ表示            ラベル付きサイドバー
│ ナビバー  │            ホバーで展開
└──────────┘
ボトムナビ
```

### 実装要件
- スマホ: ハンバーガーメニュー（オーバーレイで開閉）
- タブレット: 左アイコンバー（ホバーで展開）
- PC: 左サイドバー（常時展開）

---

## 5. メインコンテンツレイアウト

各画面の特性に応じて以下から選択:

| 画面タイプ | レイアウト | 該当画面例 |
|-----------|-----------|-----------|
| 認証系 | センターカード（サイドバーなし） | login, register, password-reset |
| 一覧系 | タブ付きリスト or グリッド | メイン画面 |
| 詳細系 | フルスクリーン or モーダル | 詳細画面 |
| フォーム系 | センター寄せフォーム | 入力画面、設定 |
| ダッシュボード | カード型グリッド | 統計画面 |
| 管理系 | リスト型 | 管理画面 |

---

## 6. 機能仕様からHTML要素への変換ルール

### 6.1 入力/出力テーブル → フォームフィールド

機能仕様の「入力/出力」セクションから:

```markdown
| 入力 | email | string | Yes | メールアドレス | RFC 5322準拠、最大254文字 |
```
↓ 変換（**Step 1.5 で抽出したフォームクラスを使用**）
```html
<!-- [Component: FormField] -->
<div class="{抽出したform-groupクラス}" data-component="FormField">
  <label class="{抽出したlabelクラス}" for="email">
    メールアドレス <span style="color: var(--color-danger)">*</span>
  </label>
  <input 
    type="email" 
    id="email"
    name="email"
    class="{抽出したinputクラス}"
    placeholder="example@email.com"
    maxlength="254"
    required
    data-action="onChange:handleChange"
  >
  <span class="{抽出したerrorクラス}" style="display:none;" data-state="error">
    メールアドレスの形式が正しくありません
  </span>
</div>
<!-- [/Component: FormField] -->
```

### 6.2 バリデーション → エラー表示

機能仕様の「エラーケース」から:

```markdown
| E-F001-02 | パスワードが要件を満たさない | パスワードは8文字以上... |
```
↓ 変換
```html
<!-- [State: error] -->
<span class="{抽出したerrorクラス}" data-state="error" style="display:none;">
  パスワードは8文字以上、英数字を含める必要があります
</span>
```

### 6.3 画面要件 → UIコンポーネント

機能仕様の「画面要件」セクションのアスキーアート:

```
┌─────────────────────────────┐
│  今日の学習                  │
│  復習: 15枚  新規: 5枚       │
│     [ 学習開始 ]            │
└─────────────────────────────┘
```
↓ 変換（**Step 1.5 で抽出した既存クラスを使用**）
```html
<!-- [Component: SummaryCard] -->
<div class="{抽出したcardクラス}" data-component="SummaryCard">
  <h2 class="{抽出したtitleクラス}">今日の学習</h2>
  <div class="{抽出したstatsクラス}">
    <!-- 統計表示 -->
  </div>
  <button class="{抽出したbtnクラス}" data-action="onClick:handleStart">
    学習開始
  </button>
</div>
<!-- [/Component: SummaryCard] -->
```

### 6.4 ビジネスルール → UI制約

機能仕様の「ビジネスルール」から:

```markdown
| BR-F016-02 | タグ上限 | 1カードあたり | 最大10タグまで |
```
↓ 変換（CSS変数を使用）
```html
<span style="font-size: 12px; color: var(--text-secondary);">
  タグは最大10個まで (現在: <span data-prop="tagCount">0</span>/10)
</span>
```

---

## 7. 生成手順

### Step 1: 共通ファイル確認

`css/style.css` と `js/main.js` は **既に完成済み** なので、追加・変更しないこと。
新しいコンポーネント用のスタイルが必要な場合のみ、style.css に追記する。

### Step 2: 各画面を並列生成

```
Task: login.html 生成 (参照: 認証機能仕様)
Task: register.html 生成 (参照: 認証機能仕様)
Task: [各機能画面].html 生成 (参照: 対応機能仕様)
...
```

---

## 8. 各ファイルの実装指示

### 認証画面（login.html, register.html 等）
- サイドバーなし
- センター配置のカード型フォーム
- ロゴ + フォーム + フッターリンク
- **機能仕様の入力/出力・エラーケースを反映**
- **Step 1.5 で抽出したフォームクラスを使用**

### メイン画面（iframe読み込み用コンテンツ）
- **main.html と同じ構造・クラス命名を踏襲**
- 抽出したコンテンツ用クラスを body/wrapper に適用

### コメント規約
各画面の冒頭に以下を記載:

```html
<!--
  画面: [画面名]
  機能: F-XXX ([機能名])
  参照仕様: docs/requirements/functions/[カテゴリ]/F-XXX-*.md
  前の画面: [遷移元].html
  次の画面: [遷移先].html
-->
```

---

## 9. 技術仕様

### CSS
- **既存の style.css を使用**（追加は最小限に）
- CSS Variables でカスタムカラー管理
- モバイルファーストのレスポンシブ

### JavaScript
- Vanilla JS のみ
- 既存の main.js を使用
- サイドバー開閉、モーダル制御、フォームバリデーション表示

### 新規スタイル追加時のルール

新しい画面固有のコンポーネントが必要な場合のみ、style.css に追記:

```css
/* ========================================
   [画面名] - [コンポーネント名]
   ======================================== */
.new-component {
  /* 必ず既存のCSS変数を使用 */
  background: var(--bg-primary);
  border-radius: var(--border-radius-lg);
  /* ... */
}

/* 抽出した命名規則に従う */
.new-component__{element} {
}

.new-component--{modifier} {
}
```

---

## 10. React変換用 data属性規約

**Step 1.4 で抽出したdata属性パターンを統一して使用すること。**

### AI向けコメント規約（重要）

React実装時にAIが正確に変換できるよう、以下のコメントを必ず記載すること。

#### コンポーネント説明コメント
```html
<!-- [Component: CardList]
  @description カード一覧を表示するコンポーネント。タブで「全て/復習予定/新規」を切り替え可能
  @props
    - cards: Card[] - 表示するカードの配列
    - activeTab: 'all' | 'review' | 'new' - 現在選択中のタブ
    - onTabChange: (tab) => void - タブ切り替え時のコールバック
  @state
    - isLoading: boolean - データ読み込み中かどうか
  @events
    - onCardClick: カードクリック時に詳細画面へ遷移
    - onDeleteClick: 削除ボタンクリック時に確認モーダル表示
-->
<div data-component="CardList">
  ...
</div>
<!-- [/Component: CardList] -->
```

#### 条件分岐の説明コメント
```html
<!-- [Condition: hasCards]
  @description カードが1件以上存在する場合に表示
  @logic cards.length > 0
-->
<div data-show-if="hasCards">...</div>

<!-- [Condition: !hasCards]
  @description カードが0件の場合の空状態表示
  @logic cards.length === 0
  @action 「カードを作成」ボタンで /cards/new へ遷移
-->
<div data-show-if="!hasCards">...</div>
```

#### リスト・ループの説明コメント
```html
<!-- [List: cards]
  @description カード一覧をループ表示
  @source cards: Card[] (APIから取得)
  @key card.id
  @sort next_review_at ASC (復習日が近い順)
-->
<ul data-list="cards">
  <!-- [ListItem: CardItem]
    @description 個別カードの表示。クリックで学習画面へ遷移
    @props card: Card
  -->
  <li data-list-item data-key="cardId">...</li>
</ul>
```

#### 状態バリエーションの説明コメント
```html
<!-- [State: loading]
  @description データ取得中のローディング表示
  @trigger useQueryのisLoading === true
  @duration API応答まで（通常1-2秒）
-->
<div data-state="loading">...</div>

<!-- [State: error]
  @description エラー発生時の表示
  @trigger useQueryのisError === true
  @recovery 「再試行」ボタンでrefetch()を実行
-->
<div data-state="error">...</div>
```

#### フォームの説明コメント
```html
<!-- [Form: CardForm]
  @description カード作成・編集フォーム
  @validation Zodスキーマ: cardFormSchema
  @submit Server Action: createCard / updateCard
  @fields
    - front: 表面テキスト（必須、最大500文字）
    - back: 裏面テキスト（必須、最大2000文字）
    - tags: タグ選択（任意、最大10個）
  @onSuccess /cards へリダイレクト + toast表示
  @onError フォーム上部にエラーメッセージ表示
-->
<form data-component="CardForm" data-action="onSubmit:handleSubmit">
  ...
</form>
```

#### モーダル・ダイアログの説明コメント
```html
<!-- [Modal: DeleteConfirmDialog]
  @description カード削除確認ダイアログ
  @trigger 削除ボタンクリック時
  @props
    - isOpen: boolean
    - cardTitle: string - 削除対象のカードタイトル
    - onConfirm: () => void - 削除実行
    - onCancel: () => void - キャンセル
  @a11y ESCキーで閉じる、フォーカストラップ有効
-->
<div data-component="DeleteConfirmDialog" role="dialog" aria-modal="true">
  ...
</div>
```

### コンポーネント境界の明示
```html
<!-- 抽出したマーカー形式を使用 -->
<!-- [Component: LoginForm] -->
<form data-component="LoginForm">
  <!-- [Component: FormField] -->
  <div data-component="FormField" data-props="label,name,type,required">
    <!-- ... -->
  </div>
</form>
<!-- [/Component: LoginForm] -->
```

### Propsになる動的値のマーク
```html
<span data-prop="userName">サンプル値</span>
<span data-prop="count">15</span>
```

### イベントハンドラの明示
```html
<button data-action="onClick:handleLogin">ログイン</button>
<input data-action="onChange:handleInputChange">
<form data-action="onSubmit:handleSubmit">
```

### 状態バリエーション（同ファイルに用意）
```html
<!-- [State: default] -->
<div data-state="default">通常表示</div>

<!-- [State: loading] -->
<div data-state="loading" style="display:none;">読み込み中...</div>

<!-- [State: error] -->
<div data-state="error" style="display:none;">エラーメッセージ</div>

<!-- [State: empty] -->
<div data-state="empty" style="display:none;">データがありません</div>
```

### 繰り返し要素（map用）
```html
<ul data-list="items">
  <!-- [ListItem: ItemName] - この要素が .map() される -->
  <li data-list-item data-key="itemId">
    <span data-prop="title">タイトル</span>
  </li>
  <!-- サンプルとして2-3個表示 -->
</ul>
```

### アイコン
```html
<!-- React変換時にアイコンライブラリからインポート -->
<span data-icon="lucide:Home"></span>
<svg data-icon="lucide:Settings" ...>...</svg>
```

### 条件付きレンダリング
```html
<!-- [Condition: isLoggedIn] -->
<div data-show-if="isLoggedIn">ログイン済みの表示</div>

<!-- [Condition: !isLoggedIn] -->
<div data-show-if="!isLoggedIn">未ログインの表示</div>
```

---

## 11. subAgent への指示テンプレート

各 subAgent には以下を渡すこと:

```
【画面名】: [画面名]
【ファイル】: mock/v1/[ファイル名].html

【デザインシステム参照（最重要）】
以下のファイルを必ず読み込み、デザインを完全に踏襲すること:
- mock/v1/main.html（コンポーネント構造、data属性パターン、HTML構造）
- mock/v1/css/style.css（クラス命名、CSS変数、スタイル）

【抽出・踏襲すべき項目】
1. CSS変数: style.css の :root から全変数を抽出し使用
2. クラス命名規則: 既存クラスのパターンを踏襲
3. コンポーネントマーカー: main.html のコメント形式を踏襲
4. data属性: main.html の data-* 属性パターンを踏襲
5. 既存コンポーネント: カード、ボタン、フォーム等のクラスを再利用

【参照する機能仕様（全文）】
以下の機能仕様ファイルの内容を全て読み込んで反映すること:
- docs/requirements/functions/[カテゴリ]/F-XXX-*.md

【機能仕様から抽出する項目】
1. 入力/出力テーブル → フォームフィールド
2. バリデーション制約 → プレースホルダー、maxlength、pattern属性
3. エラーケース → エラーメッセージ表示エリア
4. 画面要件セクション → UI構造・レイアウト（アスキーアートを忠実に再現）
5. ビジネスルール → UI制約（上限表示、条件分岐等）
6. 受け入れ条件（AC） → 必要なUI要素の確認

【画面情報】
- 機能ID: F-XXX
- 前の画面: [遷移元]（flow.mdより）
- 次の画面: [遷移先]（flow.mdより）

【レイアウトタイプ】: [認証/一覧/詳細/フォーム等]

【共通ファイル】
css/style.css と js/main.js を link/script で読み込むこと

【デザイン踏襲チェックリスト】
- [ ] style.css の CSS変数を使用（ハードコードしない）
- [ ] 既存クラス（ボタン、フォーム、カード等）を再利用
- [ ] main.html と同じ命名規則（BEM等）を使用
- [ ] main.html と同じ data属性パターンを使用
- [ ] main.html と同じコンポーネントマーカー形式を使用

【コメント規約】
画面冒頭に以下を記載:
<!--
  画面: [画面名]
  機能: F-XXX
  参照仕様: docs/requirements/functions/[カテゴリ]/F-XXX-*.md
  前の画面: [遷移元].html
  次の画面: [遷移先].html
-->
```

---

## 12. チェックリスト

### デザインシステムの踏襲
- [ ] **mock/v1/main.html を完全に読み込んだ**
- [ ] **mock/v1/css/style.css を完全に読み込んだ**
- [ ] CSS変数を抽出し、全画面で使用している
- [ ] クラス命名規則を抽出し、全画面で統一している
- [ ] コンポーネントマーカー形式を抽出し、全画面で使用している
- [ ] data属性パターンを抽出し、全画面で統一している
- [ ] 既存コンポーネントクラスを可能な限り再利用している
- [ ] 新規クラスは抽出した命名規則に従っている

### 機能仕様の反映
- [ ] 全ての機能仕様ファイル（docs/requirements/functions/**/*.md）を読み込んだ
- [ ] 各画面に対応する機能仕様の「入力/出力」がフォームに反映されている
- [ ] 各画面に対応する機能仕様の「エラーケース」がエラー表示に反映されている
- [ ] 各画面に対応する機能仕様の「画面要件」がUI構造に反映されている
- [ ] 各画面に対応する機能仕様の「ビジネスルール」がUI制約に反映されている

### 全体
- [ ] **docs/screens/flow.md** の全画面がHTMLとして存在する
- [ ] 画面遷移のリンクが flow.md と整合している
- [ ] css/style.css が使用されている（変更は最小限）
- [ ] js/main.js が使用されている

### 各画面
- [ ] レスポンシブ対応（抽出したブレークポイント使用）
- [ ] 画面冒頭にコメント記載（参照仕様パス含む）
- [ ] 適切なレイアウトタイプ使用
- [ ] サイドバーの動作（該当画面のみ）

### 認証状態の表現
- [ ] ログイン前後でヘッダー表示が異なる
- [ ] 認証系画面はサイドバーなし

---

## 完了条件

- [ ] **mock/v1/main.html と mock/v1/css/style.css を完全に読み込み、デザインシステムを把握済み**
- [ ] **抽出したデザイン特性（CSS変数、命名規則、マーカー、data属性）を記録済み**
- [ ] **docs/requirements/functions/ 配下の全ファイルを読み込み済み**
- [ ] docs/screens/flow.md の全画面がHTMLファイルとして生成されている
- [ ] **全画面が main.html のデザインシステムを完全に踏襲している**
- [ ] **各画面に対応する機能仕様が忠実にUIに反映されている**
- [ ] レスポンシブが全画面で動作する
- [ ] 各画面冒頭にコメントで画面情報・参照仕様が記載されている
- [ ] flow.md の遷移図と整合している
