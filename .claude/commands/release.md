# リリース実行

develop から master へのリリースを実行する。

## 前提条件

- 現在 develop ブランチにいること
- テスト・ビルドが通っていること

## 手順

### 1. 状態確認

```bash
git branch --show-current  # develop であること確認
git status                 # クリーンであること確認
```

### 2. バージョン種別を質問

ユーザーに以下を質問：
- **patch**: バグ修正のみ (0.1.0 → 0.1.1)
- **minor**: 新機能追加 (0.1.0 → 0.2.0)
- **major**: 破壊的変更 (0.1.0 → 1.0.0)

### 3. 変更内容を質問

ユーザーにリリース内容を質問：
- Added（新機能）
- Changed（変更）
- Fixed（修正）

### 4. バージョン更新

```bash
cd apps/web
pnpm version <patch|minor|major> --no-git-tag-version
```

### 5. コミット・プッシュ

```bash
git add .
git commit -m "chore: bump version to vX.X.X"
git push origin develop
```

### 6. PR作成

```bash
gh pr create --base master --head develop --title "Release vX.X.X" --body "..."
```

### 7. ユーザーに確認

「PRをマージしてください」と案内し、マージ完了を待つ。

### 8. タグ・Release作成

```bash
git checkout master
git pull origin master
git tag vX.X.X
git push origin vX.X.X

gh release create vX.X.X --title "vX.X.X" --notes "..."
```

### 9. develop に戻る

```bash
git checkout develop
git pull origin develop
```

### 10. 完了報告

本番URL（https://re-save.vercel.app）で確認するよう案内。
