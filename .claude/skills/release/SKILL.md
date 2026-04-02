---
name: release
description: |
  developブランチをmasterにリリースするスキル。
  品質チェック（Lint・TypeCheck・Test）→ PR作成 → 完了報告（マージはユーザーが手動で行う）。
  --dry-run: チェックのみ実行（PRは作成しない）
allowed-tools: Bash, AskUserQuestion
---

# リリーススキル

developブランチの内容をmasterにリリースする。

## 引数

- `--dry-run`: 品質チェックのみ実行し、PR作成は行わない

## フロー

### Step 1: ブランチ確認

現在のブランチを確認する。

```bash
git branch --show-current
```

| 現在のブランチ | 対応 |
|---|---|
| `develop` | 続行 |
| `feature/*` | 中断。まず `/dev:finish` でdevelopにマージするよう案内 |
| `master` | 中断。すでに本番ブランチにいることを伝える |
| その他 | 中断。developブランチで実行するよう案内 |

### Step 2: 未コミット変更の確認

```bash
git status --porcelain
```

未コミット変更がある場合は中断し、コミットまたはスタッシュするよう案内する。

### Step 3: developを最新化

```bash
git fetch origin
git pull origin develop
```

### Step 4: masterとの差分確認

```bash
git log --oneline origin/master..HEAD
```

リリース対象コミットを表示する。0件の場合（develop と master が同一）は「リリース対象の変更がありません」と表示して中断する。

### Step 5: 品質チェック

以下を順番に実行する。失敗した場合は即座に中断してエラー内容を表示する。

**Lint:**
```bash
pnpm lint
```

**TypeCheck:**
```bash
cd apps/web && npx tsc --noEmit && cd ../..
```

**Test:**
```bash
cd apps/web && pnpm test -- --run && cd ../..
```

全チェック通過後:
```
品質チェック完了:
- Lint: OK
- TypeCheck: OK
- Test: OK
```

`--dry-run` の場合はここで終了する。

### Step 6: PR作成

```bash
gh pr create \
  --base master \
  --head develop \
  --title "release: deploy to production" \
  --body "$(git log --oneline origin/master..HEAD)"
```

### Step 7: 完了報告

以下を表示して終了する：

```
PR作成完了: <PR URL>

リリース対象コミット:
  <Step 4のコミット一覧>

品質チェック: 全て通過（Lint / TypeCheck / Test）

次のステップ:
1. 上記PRのURLを開いてCIが通過していることを確認
2. GitHubでPRをマージ（develop ブランチは削除しない）
3. マージ後、Vercelへの本番デプロイが自動で開始されます
4. Release PleaseがCHANGELOG更新PRを自動作成します
   （"chore(main): release X.X.X" というPRがGitHubに表示されます）
   このPRをマージすると CHANGELOG.md 更新・Gitタグ・GitHub Releaseが作成されます

本番URL: https://resave.vercel.app
```

## 注意事項

- マージはユーザーがGitHub上で手動で行う（CI通過を確認してからマージすること）
- `develop` ブランチは削除しない（PR マージ時に "Delete branch" を押さないこと）
- Release Please が conventional commits を解析してバージョンを自動決定するため、手動でのバージョン指定・CHANGELOG編集は不要
- CI（Lint・TypeCheck・Test）は masterへのPRで自動実行されるが、スキル内でローカルチェックを先行実行してPR失敗を防ぐ
