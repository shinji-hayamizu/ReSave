---
name: dev:finish
description: |
  ReSaveの機能実装を完了し、PR経由でマージするスキル。
  ネストworktree（--from で派生したブランチ）の場合は親ブランチに向けてPR作成。
  テスト → コミット → PR作成 → マージ → worktreeクリーンアップ。
allowed-tools: Bash, Skill
---

# 機能実装完了スキル

実装完了からPRマージ・クリーンアップまでを一括で行う。

## 引数

- `--no-merge`: PR作成のみ、マージはしない

## フロー

### Step 1: ブランチ確認 + PRベース判定

```bash
git branch --show-current
```

`feature/*` ブランチにいることを確認する。
`develop` または `master` ブランチの場合は中断し、`feature/*` ブランチで実行するよう案内する。

現在のブランチ名から worktree 名（`feature/` を除いた部分）を取得する。

**PRのベースブランチを判定する:**

```bash
# .base-branch ファイルが存在する場合 → ネストworktree（親ブランチへのPR）
BASE_BRANCH=$(cat .base-branch 2>/dev/null || echo "develop")
echo "PRベース: $BASE_BRANCH"
```

- `.base-branch` が存在する → **ネストフロー**: そのブランチに向けてPR作成
- `.base-branch` が存在しない → **通常フロー**: `develop` に向けてPR作成

### Step 2: 未コミット変更をコミット

```bash
git status --porcelain
```

未コミット変更がある場合:

```
Skill(convenience:commit)
```

コミット内容を確認してからコミットする。

変更がない場合はこのステップをスキップ。

### Step 3: ブランチをpush

```bash
git push origin <current-branch>
```

### Step 4: PR作成

```
Skill(convenience:create-pr)
```

**PR設定:**
- ベースブランチ: `$BASE_BRANCH`（通常は `develop`、ネスト時は親ブランチ）
- タイトル: コミット内容から自動生成
- 本文: 変更内容のサマリー

ネストフローの場合は本文に以下を追記する:
```
> このPRは `<base-branch>` ブランチへのマージを対象としています。
> マージ順序: このブランチ → `<base-branch>` → develop
```

PR URLを表示する。

### Step 5: マージ or 終了

`--no-merge` 引数がある場合はここで終了し、PRのURLを表示する。

`--no-merge` がない場合はそのまま Step 6 へ進む（確認不要）。

### Step 6: PRをマージ

```bash
gh pr merge --merge --delete-branch
```

`--delete-branch` でリモートブランチを自動削除。

### Step 7: worktreeとローカルブランチを削除

```bash
# ベースブランチに戻る
git checkout $BASE_BRANCH
git pull origin $BASE_BRANCH 2>/dev/null || true

# worktreeを削除
git worktree remove .claude/worktrees/<name> --force

# ローカルブランチを削除
git branch -D <current-branch> 2>/dev/null || true
```

### Step 8: 完了報告

**通常フロー:**
```
完了しました。

マージ先: develop
削除したブランチ: feature/<name>

次のアクション:
- /release          developをmasterにリリース
- /dev:new-feature  次の機能開発を開始
```

**ネストフロー:**
```
完了しました。

マージ先: <base-branch>（親ブランチ）
削除したブランチ: feature/<name>

次のアクション:
- <base-branch> のPRをマージして develop に取り込む
- /dev:new-feature --from <base-branch>  さらに派生ブランチを作成
```

## 注意事項

- マージ後のクリーンアップは自動で行われる
- `--no-merge` を使用した場合、worktreeとブランチは手動で削除する必要がある
- PRのレビューが必要な場合は `--no-merge` を使用してレビュワーを追加してからマージする
- ネストworktreeのPRは親ブランチに向く（`.base-branch` ファイルで判定）
