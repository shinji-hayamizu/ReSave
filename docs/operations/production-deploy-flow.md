# 本番環境リリースフロー

## 概要

develop ブランチから master ブランチへのマージによる本番リリースの手順書。

---

## リリースフロー

```
[1] develop で徹底テスト
        ↓
[2] バージョン更新 + CHANGELOG 記載
        ↓
[3] master へ PR 作成
        ↓
[4] レビュー・マージ
        ↓
[5] Vercel 自動デプロイ
        ↓
[6] 本番動作確認
        ↓
[7] Git タグ + GitHub Release 作成
```

---

## 詳細手順

### Step 1: develop ブランチでテスト

```bash
git checkout develop
git pull origin develop

# ビルド確認
cd apps/web
pnpm build

# テスト実行
pnpm test
pnpm test:e2e
```

**確認項目:**
- [ ] ビルドエラーなし
- [ ] 全テスト通過
- [ ] Preview環境で動作確認済み

---

### Step 2: バージョン更新 + CHANGELOG

**バージョン更新（apps/web/package.json）:**

```bash
cd apps/web

# パッチ: バグ修正のみ (0.1.0 → 0.1.1)
pnpm version patch --no-git-tag-version

# マイナー: 新機能追加 (0.1.0 → 0.2.0)
pnpm version minor --no-git-tag-version

# メジャー: 破壊的変更 (0.1.0 → 1.0.0)
pnpm version major --no-git-tag-version
```

**CHANGELOG.md 更新:**

```markdown
## [0.2.0] - 2025-01-12

### Added
- カード一括削除機能

### Changed
- 復習画面のUI改善

### Fixed
- ログイン時のリダイレクトエラー
```

**コミット:**

```bash
git add .
git commit -m "chore: bump version to 0.2.0"
git push origin develop
```

---

### Step 3: master へ PR 作成

```bash
gh pr create --base master --head develop --title "Release v0.2.0" --body "$(cat <<'EOF'
## Release v0.2.0

### Changes
- (CHANGELOGの内容をコピー)

### Checklist
- [ ] develop環境で動作確認済み
- [ ] ビルド・テスト通過
- [ ] マイグレーション適用済み（該当する場合）
- [ ] 環境変数の追加・変更なし（該当する場合は記載）

### Rollback
Vercel Dashboard → Deployments → 前回デプロイを Promote
EOF
)"
```

---

### Step 4: レビュー・マージ

**レビュー確認項目:**
- [ ] コード差分の確認
- [ ] 破壊的変更の有無
- [ ] マイグレーションの有無

**マージ:**
- GitHub上で「Merge pull request」
- マージ方法: Create a merge commit

---

### Step 5: Vercel 自動デプロイ

- master へのマージで自動的に Production デプロイ開始
- Vercel Dashboard で「Ready」になるまで待機（2-3分）

---

### Step 6: 本番動作確認

**確認項目:**
- [ ] トップページ表示
- [ ] ログイン・ログアウト
- [ ] 主要機能の動作
- [ ] 今回リリースした機能
- [ ] コンソールエラーなし

**本番URL:** https://re-save.vercel.app

---

### Step 7: Git タグ + GitHub Release

```bash
git checkout master
git pull origin master

# タグ作成
git tag v0.2.0
git push origin v0.2.0

# GitHub Release 作成
gh release create v0.2.0 \
  --title "v0.2.0" \
  --notes "$(cat <<'EOF'
## What's Changed

### Added
- カード一括削除機能

### Changed
- 復習画面のUI改善

### Fixed
- ログイン時のリダイレクトエラー

**Full Changelog**: https://github.com/owner/repo/compare/v0.1.0...v0.2.0
EOF
)"
```

---

## ロールバック手順

### Vercel Dashboard から（推奨）

1. Vercel Dashboard → Deployments
2. 戻したいデプロイを選択
3. **...** → **Promote to Production**

**所要時間:** 約1分

### Git から（非推奨）

```bash
git checkout master
git revert HEAD
git push origin master
```

---

## マイグレーションがある場合

### デプロイ前に本番DBへ適用

```bash
# MCPツールで適用
mcp__supabase__apply_migration

# または Supabase CLI
supabase link --project-ref vfdoegnsuebtzwwvttvc
supabase db push
```

**注意:** 破壊的マイグレーション（カラム削除等）はロールバック不可

---

## 環境変数の追加・変更がある場合

1. デプロイ前に Vercel Dashboard で Production 環境に設定
2. デプロイ実行（再デプロイまで反映されない）

---

## クイックチェックリスト

```markdown
### リリース前
- [ ] develop でテスト完了
- [ ] バージョン更新済み
- [ ] CHANGELOG 更新済み
- [ ] マイグレーション適用済み（該当時）
- [ ] PR レビュー承認

### リリース後
- [ ] 本番動作確認
- [ ] Git タグ作成
- [ ] GitHub Release 作成
```

---

## 関連ドキュメント

- [デプロイガイド](../DEPLOYMENT.md)
