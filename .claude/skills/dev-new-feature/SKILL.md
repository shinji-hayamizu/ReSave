---
name: dev:new-feature
description: |
  ReSaveで新機能開発を開始するスキル。
  developブランチから feature/* ブランチを作成し、
  EnterWorktreeで分離されたworktree環境に入り、Plan modeで計画→GitHub Issue作成→実装→コミット→PR作成→devサーバー起動まで行う。
allowed-tools: Bash, EnterWorktree, EnterPlanMode, AskUserQuestion, Skill, Read, Glob, Grep, Write, mcp__playwright__browser_navigate, mcp__playwright__browser_take_screenshot
---

# 新機能開発開始スキル

新機能開発をworktree環境で開始し、Plan modeで計画を立案してGitHub Issueを作成した後、実装→PR作成→devサーバー起動までを一括で行う。

## フロー

### Step 1: 未コミット変更の確認

```bash
git status --porcelain
```

未コミット変更があっても **そのまま続行する**。

worktreeは独立したディレクトリ（`.claude/worktrees/<name>/`）に作成されるため、
メインリポジトリの未コミット変更はworktreeに一切影響しない。stashは不要。

### Step 2: ブランチ名の決定 + developの最新を取得

引数がある場合はそれをブランチ名として使用する。
引数がない場合は、**直前の会話のタスク内容からブランチ名を自動生成する**（質問しない）。

ブランチ名の生成ルール:
- タスクの内容を英語の動詞+名詞で簡潔に表現する（例: `add-tag-filter`, `fix-card-review`, `improve-home-ssr`）
- 英数字とハイフンのみ使用（スペース・日本語はハイフンに変換または英訳）
- 20文字以内を目安にする
- `feature/` 形式に自動変換（すでに `feature/` が付いている場合はそのまま）

ブランチ名決定後、developの最新を取得する:

```bash
git fetch origin develop
git checkout develop
git pull origin develop
```

失敗した場合はエラー内容を表示して中断する。

### Step 3: worktreeを作成して入場

`EnterWorktree(name: "<name>")` を呼び出す。

EnterWorktreeは内部で以下を実行する:
- `.claude/worktrees/<name>/` にworktreeを作成
- `feature/<name>` ブランチを作成
- worktreeに入場（作業ディレクトリが切り替わる）

### Step 4: 依存関係インストール・環境変数のシンボリックリンク作成

worktreeには `node_modules` が存在しないため、インストールする:

```bash
cd .claude/worktrees/<name> && pnpm install
```

次に、worktreeには `.env.local` が存在しないため、メインリポジトリからシンボリックリンクを作成する:

```bash
# apps/web/.env.local
ln -sf /Users/haya/development/myApps/job/ReSave/apps/web/.env.local \
  .claude/worktrees/<name>/apps/web/.env.local

# apps/admin/.env.local (存在する場合)
[ -f /Users/haya/development/myApps/job/ReSave/apps/admin/.env.local ] && \
  ln -sf /Users/haya/development/myApps/job/ReSave/apps/admin/.env.local \
    .claude/worktrees/<name>/apps/admin/.env.local
```

### Step 5: Plan mode（計画フェーズ）

`EnterPlanMode` ツールを呼び出して計画フェーズを開始する。

worktree内で実際のコードを調査しながら以下を行う:
- Grep / Glob / Read で既存コードを調査
- 実装方針・タスクの分解
- **GitHub Issueのタイトル・概要・タスクリスト**を策定
- 影響範囲・注意点の洗い出し

#### Step 5-A: UIモック生成（UIの変更・追加が含まれる場合のみ）

タスクにUIの変更・新規追加が含まれる場合、以下を実行する:

1. **既存UIの把握**
   - 変更対象の既存コンポーネント・ページを Read で読み込む
   - 現在のデザイン（カラー、レイアウト、コンポーネント構造）を把握する

2. **HTMLモックを3パターン生成**
   - `docs/mocks/<branch-name>/` ディレクトリに以下を出力:
     - `pattern-1.html` - アプローチ1（説明付き）
     - `pattern-2.html` - アプローチ2（説明付き）
     - `pattern-3.html` - アプローチ3（説明付き）
   - 各HTMLは単体で開けるスタンドアロンHTML（Tailwind CDN使用）
   - 既存のデザインシステム（カラー、スペーシング）に沿ったスタイルにする
   - UIテキストは日本語で記述する
   - パターンの差別化:
     - pattern-1: 現状に近いアプローチ（保守的）
     - pattern-2: 改善提案（推奨案）
     - pattern-3: 大胆な変更（実験的）

3. **ブラウザで表示してスクリーンショットを会話上に表示**
   - `docs/mocks/<branch-name>/` ディレクトリでローカルHTTPサーバーを起動する（`python3 -m http.server <port>`、バックグラウンド実行）
   - `mcp__playwright__browser_navigate` で `http://localhost:<port>/pattern-1.html` 等を開く
   - `mcp__playwright__browser_take_screenshot` でスクリーンショットを撮影し、会話画面に画像として表示する（3パターン分）
   - AskUserQuestion で「どのパターンが好みですか？カスタマイズしたい点はありますか？」と質問する
   - 確認完了後、HTTPサーバーを停止する

4. **承認後に実装方針を確定**
   - ユーザーが選んだパターンを実装方針に反映する

**UIモック生成の判定基準:**

以下を含む場合は **UIモック生成あり**:
- 新規画面・ページの追加
- 既存ページのレイアウト変更
- 新規コンポーネントの追加
- フォーム、リスト、カードなどのUI要素の変更

以下の場合は **スキップ**:
- Server Actions / API Routes のみの変更
- 型定義・バリデーションの変更
- テストの追加・修正
- パフォーマンス改善（見た目の変更なし）
- バグ修正（UIの見た目は変わらない）

ユーザーが計画を承認したら次のステップへ進む。

### Step 6: GitHub Issue作成

Plan modeで固まった内容をもとにIssueを作成する:

```bash
gh issue create \
  --title "<plan-modeで決めたタイトル>" \
  --body "## 概要
<計画の概要>

## タスク
- [ ] <task1>
- [ ] <task2>" \
  --label "enhancement"
```

Issue番号を取得して変数に保持する（Step 8のPR作成時に使用）。

ラベルが存在しない場合はラベルなしで作成する:
```bash
gh issue create \
  --title "<タイトル>" \
  --body "<本文>"
```

### Step 7: 実装

ユーザーの依頼内容に従って実装を行う。
実装完了後、テストを作成・実行する（`/testing` スキルを使用）。

### Step 8: コミット・push・PR作成

```
Skill(convenience:commit)
```

コミット後、pushしてPRを作成する:

```bash
git push origin <branch>
```

```
Skill(convenience:create-pr)
```

PR設定:
- ベースブランチ: `develop`
- タイトル・本文: コミット内容から自動生成
- **本文に `Closes #<issue番号>` を必ず含める**（Step 6で取得したIssue番号）

`convenience:create-pr` でPRを作成した後、以下を自動で設定する:

```bash
# Assignees: 自分をアサイン
gh pr edit --add-assignee @me

# Labels: 実装内容に応じて選択
# 新機能追加 → enhancement
# バグ修正 → bug
# リファクタリング/改善 → enhancement
gh pr edit --add-label "enhancement"  # または "bug"
```

ラベルの選択基準:
- バグ修正（fix/fix系ブランチ、エラー解消）→ `bug`
- それ以外（新機能、改善、リファクタ）→ `enhancement`

ラベルが存在しない場合はラベル設定をスキップする（エラー無視）。

### Step 9: devサーバー起動

3000番ポートが使用中かチェックし、空いていれば3000、使用中なら3002で起動する:

```bash
# ポート確認
lsof -ti:3000 && echo "IN_USE" || echo "FREE"
```

空いている場合:
```bash
cd apps/web && pnpm next dev -p 3000
```

使用中の場合:
```bash
cd apps/web && pnpm next dev -p 3002
```

バックグラウンドで起動し、起動確認後にURLを表示する。

### Step 10: 完了案内

```
完了しました。

Issue: <issue URL>
PR URL: <url>
devサーバー: http://localhost:<port>

動作確認後は /dev-finish でマージ・クリーンアップを行ってください。
```


## 注意事項

- develop または master ブランチで実行すること（feature/* では実行しない）
- worktree内での作業は `.claude/worktrees/<name>/` 配下で行われるため、メインの作業ディレクトリに影響しない
- Plan modeはStep 5でのみ使用する（Step 5をスキップして即実装しない）
- GitHub Issueは計画が固まってから作成する（Plan mode承認後）
