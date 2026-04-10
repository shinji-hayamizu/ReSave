---
name: dev:new-feature
description: |
  ReSaveで新機能開発を開始するスキル。
  developブランチ（または既存のfeatureブランチ）から新しいブランチを作成し、
  EnterWorktreeで分離されたworktree環境に入って作業を開始する。
  既存のworktreeブランチから派生させることも可能（ネストworktree）。
allowed-tools: Bash, EnterWorktree, AskUserQuestion
---

# 新機能開発開始スキル

新機能開発をworktree環境で開始する。developブランチだけでなく、
既存のfeatureブランチから派生させることもできる（ネストworktree）。

## 引数フォーマット

```
/dev-new-feature [<branch-name>] [--from <base-branch>]
```

- `<branch-name>`: 新しいブランチ名（省略時は会話内容から自動生成）
- `--from <base-branch>`: ベースブランチを指定（省略時は `develop`）

**例:**
```
/dev-new-feature                                        # developから自動ブランチ名で作成
/dev-new-feature add-dark-mode                          # developから add-dark-mode で作成
/dev-new-feature fix-expo-button --from worktree-update-02-command-expo-support
                                                        # 既存ブランチから派生（PRはそのブランチに向く）
```

## フロー

### Step 1: 引数解析

引数（`$ARGUMENTS`）を解析する:

1. `--from <base-branch>` が含まれる場合:
   - `<base-branch>` をベースブランチとして記録（**PRのbase**になる）
   - 残りの文字列を `<branch-name>` として使用
2. `--from` がない場合:
   - ベースブランチ = `develop`
   - 引数全体を `<branch-name>` として使用

### Step 2: 未コミット変更の確認

```bash
git status --porcelain
```

未コミット変更がある場合は中断し、コミットまたはスタッシュするよう案内する。

### Step 3: ブランチ名の決定

`<branch-name>` が指定されている場合はそれを使用する。
指定がない場合は、**直前の会話のタスク内容からブランチ名を自動生成する**（質問しない）。

ブランチ名の生成ルール:
- タスクの内容を英語の動詞+名詞で簡潔に表現する（例: `add-tag-filter`, `fix-card-review`, `improve-home-ssr`）
- 英数字とハイフンのみ使用（スペース・日本語はハイフンに変換または英訳）
- 20文字以内を目安にする
- `feature/` 形式に自動変換（すでに `feature/` が付いている場合はそのまま）

### Step 4: ベースブランチの最新を取得

#### ベースが `develop` の場合（通常フロー）

```bash
git fetch origin develop
git checkout develop
git pull origin develop
git log -1 --oneline
```

#### ベースが既存の feature/worktree ブランチの場合（ネストフロー）

```bash
# ベースブランチをリモートから取得
git fetch origin <base-branch>

# ベースブランチに切り替え
git checkout <base-branch>

# リモートの最新をpull（リモートに存在する場合）
git pull origin <base-branch> 2>/dev/null || echo "（ローカルブランチのみ、pullスキップ）"

git log -1 --oneline
```

失敗した場合はエラー内容を表示して中断する。

### Step 5: 確認表示

以下の情報を表示してユーザーに確認を求める:

**通常フロー（developベース）:**
```
新機能開発を開始します:
- ブランチ名: feature/<name>
- ベース: develop (最新をpull済み)
- PRの向き先: develop
- worktreeパス: .claude/worktrees/<name>/

続行しますか？
```

**ネストフロー（既存ブランチベース）:**
```
既存ブランチから派生して作業を開始します:
- ブランチ名: feature/<name>
- ベース: <base-branch>
- PRの向き先: <base-branch>（伸ばし元に向けてPR作成）
- worktreeパス: .claude/worktrees/<name>/

続行しますか？
```

### Step 6: worktreeを作成して入場

`EnterWorktree(name: "<name>")` を呼び出す。

EnterWorktreeは内部で以下を実行する:
- `.claude/worktrees/<name>/` にworktreeを作成
- `feature/<name>` ブランチを作成（現在のHEAD = ベースブランチをもとに）
- worktreeに入場（作業ディレクトリが切り替わる）

**ネストフローの場合、ベースブランチ名を `.base-branch` ファイルに保存する:**

```bash
echo "<base-branch>" > .claude/worktrees/<name>/.base-branch
```

これにより `/dev-finish` 実行時にPRの向き先を自動判定できる。

### Step 7: 完了案内

**通常フロー:**
```
worktree環境に入りました。

作業を進めたら以下のスキルを使用してください:
- /dev:test     変更に関連するテストを実行
- /dev:finish   実装完了・PR作成・マージ・クリーンアップ
```

**ネストフロー:**
```
worktree環境に入りました（<base-branch> ベース）。

PRは <base-branch> に向けて作成されます。
マージ順序: このブランチ → <base-branch> → develop

作業を進めたら以下のスキルを使用してください:
- /dev:test     変更に関連するテストを実行
- /dev:finish   実装完了・PR作成・マージ・クリーンアップ
```

## 注意事項

- 通常フローは develop または master ブランチで実行すること
- ネストフロー（`--from` 指定時）は任意のブランチから実行可能
- worktree内での作業は `.claude/worktrees/<name>/` 配下で行われるため、メインの作業ディレクトリに影響しない
- ネストworktreeのPRは伸ばし元ブランチに向く（developではない）
- マージ順序: 子ブランチ（B）→ 親ブランチ（A）→ develop の順でマージする
