---
name: dev:finish
description: |
  ReSaveの機能実装を完了し、developブランチにPR経由でマージするスキル。
  テスト → コミット → PR作成 → マージ → worktreeクリーンアップ。
allowed-tools: Bash, Skill
---

# 機能実装完了スキル

実装完了からPRマージ・クリーンアップまでを一括で行う。

## 引数

- `--skip-tests`: テストをスキップ（実施済みの場合）
- `--no-merge`: PR作成のみ、マージはしない

## フロー

### Step 1: ブランチ確認

```bash
git branch --show-current
```

`feature/*` ブランチにいることを確認する。
`develop` または `master` ブランチの場合は中断し、`feature/*` ブランチで実行するよう案内する。

現在のブランチ名から worktree 名（`feature/` を除いた部分）を取得する。

### Step 2: テスト実行

`--skip-tests` 引数がない場合:

```
Skill(dev:test) --all
```

テストが失敗した場合は中断し、失敗内容を表示する。

`--skip-tests` の場合はスキップして次へ進む。

### Step 3: 未コミット変更をコミット

```bash
git status --porcelain
```

未コミット変更がある場合:

```
Skill(convenience:commit)
```

コミット内容を確認してからコミットする。

変更がない場合はこのステップをスキップ。

### Step 4: ブランチをpush

```bash
git push origin feature/<name>
```

### Step 5: PR作成

```
Skill(convenience:create-pr)
```

**PR設定:**
- ベースブランチ: `develop`
- タイトル: コミット内容から自動生成
- 本文: 変更内容のサマリー

PR URLを表示する。

### Step 6: マージ確認

`--no-merge` 引数がある場合はここで終了し、PRのURLを表示する。

`--no-merge` がない場合:

```
PR をマージしますか？
ブランチとworktreeも削除されます。
```

ユーザーの確認を待つ。

### Step 7: PRをマージ

```bash
gh pr merge <PR番号> --merge --delete-branch
```

`--delete-branch` でリモートブランチを自動削除。

### Step 8: worktreeとローカルブランチを削除

```bash
# developに戻る
git checkout develop
git pull origin develop

# worktreeを削除
git worktree remove .claude/worktrees/<name> --force

# ローカルブランチを削除
git branch -D feature/<name> 2>/dev/null || true
```

### Step 9: 完了報告

```
完了しました。

マージ先: develop
削除したブランチ: feature/<name>

次のアクション:
- /release          developをmasterにリリース
- /dev:new-feature  次の機能開発を開始
```

## 注意事項

- マージ後のクリーンアップは自動で行われる
- `--no-merge` を使用した場合、worktreeとブランチは手動で削除する必要がある
- PRのレビューが必要な場合は `--no-merge` を使用してレビュワーを追加してからマージする
