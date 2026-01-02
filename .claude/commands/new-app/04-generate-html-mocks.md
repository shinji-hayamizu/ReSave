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
| docs/requirements/functions/**/*.md | 各機能の詳細仕様（**全ファイル必読**） |
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

### Step 3: 機能仕様の全読み込み（必須）

**`docs/requirements/functions/` 配下の全ファイルを読み込むこと:**

```
# ディレクトリ構造を確認
Glob docs/requirements/functions/**/*.md

# 全ファイルを読み込み
Read docs/requirements/functions/auth/F-001-*.md
Read docs/requirements/functions/auth/F-002-*.md
Read docs/requirements/functions/auth/F-003-*.md
Read docs/requirements/functions/card/F-013-*.md
Read docs/requirements/functions/card/F-014-*.md
Read docs/requirements/functions/card/F-015-*.md
Read docs/requirements/functions/card/F-016-*.md
Read docs/requirements/functions/tag/F-017-*.md
Read docs/requirements/functions/tag/F-018-*.md
Read docs/requirements/functions/review/F-020-*.md
Read docs/requirements/functions/review/F-021-*.md
Read docs/requirements/functions/review/F-022-*.md
Read docs/requirements/functions/review/F-023-*.md
Read docs/requirements/functions/stats/F-030-*.md
Read docs/requirements/functions/sync/F-050-*.md
... (存在する全ファイル)
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
Task: login.html 生成 (参照: F-002)
Task: register.html 生成 (参照: F-001)
Task: password-reset.html 生成 (参照: F-003)
Task: home.html 生成 (参照: F-013, F-020, F-021, F-022, F-023)
Task: card-input.html 生成 (参照: F-013, F-014, F-016)
Task: tag-manage.html 生成 (参照: F-017)
Task: statistics.html 生成 (参照: F-030)
Task: settings.html 生成
...
```

---

## 7. 各ファイルの実装指示

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
- **機能仕様（F-001, F-002, F-003）の入力/出力・エラーケースを反映**

### メイン画面（ホーム等）
- YouTube型サイドバー適用
- ヘッダー: ハンバーガーメニュー + アプリ名 + アクションボタン
- メインコンテンツ: 画面タイプに応じたレイアウト
- **機能仕様の「画面要件」セクションを忠実に再現**

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

## 8. 技術仕様

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
/* モバイルファースト */
/* タブレット: 768px以上 */
@media (min-width: 768px) { }
/* デスクトップ: 1024px以上 */
@media (min-width: 1024px) { }
```

---

## 9. subAgent への指示テンプレート

各 subAgent には以下を渡すこと:

```
【画面名】: [画面名]
【ファイル】: mock/[ファイル名].html

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
  参照仕様: docs/requirements/functions/[カテゴリ]/F-XXX-*.md
  前の画面: [遷移元].html
  次の画面: [遷移先].html
-->
```

---

## 10. チェックリスト

### 機能仕様の反映
- [ ] 全ての機能仕様ファイル（docs/requirements/functions/**/*.md）を読み込んだ
- [ ] 各画面に対応する機能仕様の「入力/出力」がフォームに反映されている
- [ ] 各画面に対応する機能仕様の「エラーケース」がエラー表示に反映されている
- [ ] 各画面に対応する機能仕様の「画面要件」がUI構造に反映されている
- [ ] 各画面に対応する機能仕様の「ビジネスルール」がUI制約に反映されている

### 全体
- [ ] **docs/screens/flow.md** の全画面がHTMLとして存在する
- [ ] 画面遷移のリンクが flow.md と整合している
- [ ] 採用パターンのスタイルが適用されている
- [ ] css/style.css が生成されている
- [ ] js/main.js が生成されている

### 各画面
- [ ] 3段階レスポンシブ対応（スマホ/タブレット/PC）
- [ ] 画面冒頭にコメント記載（参照仕様パス含む）
- [ ] 適切なレイアウトタイプ使用
- [ ] サイドバーのホバー展開が動作する

### 認証状態の表現
- [ ] ログイン前後でヘッダー表示が異なる
- [ ] 認証系画面はサイドバーなし

---

## 完了条件

- [ ] ユーザーから採用パターン番号を確認済み
- [ ] **docs/requirements/functions/ 配下の全ファイルを読み込み済み**
- [ ] docs/screens/flow.md の全画面がHTMLファイルとして生成されている
- [ ] **各画面に対応する機能仕様が忠実にUIに反映されている**
- [ ] css/style.css が採用パターンベースで生成されている
- [ ] js/main.js が生成されている
- [ ] 3段階レスポンシブが全画面で動作する
- [ ] サイドバーのホバー展開が動作する
- [ ] 各画面冒頭にコメントで画面情報・参照仕様が記載されている
- [ ] flow.md の遷移図と整合している
