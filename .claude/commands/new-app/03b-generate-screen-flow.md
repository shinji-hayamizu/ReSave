---
description: ビジネス要件と機能一覧から画面遷移図を自動生成
allowed-tools: Read, Write, Edit, Glob, Grep
---

# Phase 3b: 画面遷移図生成

## 目的
ビジネス要件と機能詳細仕様を読み込み、アプリの画面遷移イメージをMermaid記法で生成する。

---

## 参照ドキュメント
- docs/requirements/business-requirements.md（機能要件・ユーザーストーリー）
- docs/requirements/functions/_index.md（機能間の依存関係）

## 出力先
```
docs/screens/flow.md
```

---

## 実行手順

### Step 1: 要件ドキュメント読み込み
```
Read docs/requirements/business-requirements.md
Read docs/requirements/functions/_index.md
```
→ 機能一覧と依存関係から必要な画面を特定

### Step 2: 画面の洗い出し

ビジネス要件の機能カテゴリから、必要な画面を抽出:

1. **認証系**: ログイン、新規登録、パスワードリセット等
2. **メイン機能**: 一覧、詳細、作成、編集画面
3. **補助機能**: 設定、統計、通知等

### Step 3: 画面遷移図の生成

Mermaid記法で `docs/screens/flow.md` を出力。

---

## 出力フォーマット

```markdown
# 画面遷移図

> 関連: [ビジネス要件](../requirements/business-requirements.md)

## 全体フロー

\`\`\`mermaid
flowchart TD
    subgraph 認証
        Splash[スプラッシュ]
        Login[ログイン]
        Register[新規登録]
        PasswordReset[パスワードリセット]
    end

    subgraph メイン
        Home[ホーム]
        List[一覧]
        Detail[詳細]
        Create[作成]
        Edit[編集]
    end

    subgraph 設定
        Settings[設定]
        Profile[プロフィール]
    end

    %% 認証フロー
    Splash -->|認証済み| Home
    Splash -->|未認証| Login
    Login -->|登録| Register
    Login -->|リセット| PasswordReset
    Login -->|成功| Home
    Register -->|完了| Home

    %% メインナビゲーション
    Home --> List
    Home --> Settings

    %% CRUD操作
    List -->|新規| Create
    List -->|選択| Detail
    Detail -->|編集| Edit
    Create -->|保存| List
    Edit -->|保存| Detail
\`\`\`

## 画面一覧

| 画面名 | 概要 | 対応機能 |
|-------|------|---------|
| スプラッシュ | 初期ロード・認証チェック | - |
| ログイン | 認証画面 | F-002 |
| ... | ... | ... |
```

---

## 作成ガイドライン

### 画面のグルーピング
- `subgraph` で機能カテゴリごとにグループ化
- 認証 / メイン / 設定 など論理的に分類

### 遷移の表現
- 矢印のラベルにユーザーアクションを記載
- 条件分岐は `|条件|` で表現

### 命名規則
- 画面名は日本語で分かりやすく
- ノードIDは英語で簡潔に（例: `Login`, `CardList`）

---

## 完了条件

- [ ] `docs/screens/flow.md` が生成されている
- [ ] Mermaid図がGitHub/VS Codeでレンダリング可能
- [ ] ビジネス要件の全機能に対応する画面が網羅されている
- [ ] 認証状態による分岐が表現されている

---

## 次のステップ

```bash
claude 03a-generate-design-samples  # デザイン方向性決定
claude 04-generate-html-mocks       # 全画面モック生成
```
