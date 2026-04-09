---
name: dev:mobile-build
description: |
  Expo Mobileアプリの全機能を3フェーズで段階的に構築する親スキル。
  Phase 1: 共通コンポーネント + 認証 + ナビゲーション
  Phase 2: APIクライアント関数 + TanStack Queryフック
  Phase 3: 全画面のUI作成 + hooks接続（並列サブエージェント）
  1ブランチで完結。フェーズ完了ごとに中間コミット。
allowed-tools: Bash, Read, Write, Edit, Glob, Grep, Agent, Skill
---

# Mobile Build - 3フェーズ段階構築

Expo Mobileアプリの全機能を3フェーズで構築する。
1ブランチ（`feature/mobile-build`）で完結し、フェーズごとにコミットする。

## 前提

- developブランチまたはworktree内で実行すること
- Web側のAPI Routes は実装済み（`/api/cards`, `/api/tags`, `/api/study`, `/api/health`）
- `@resave/shared` パッケージで型・バリデーションは統一済み
- `apps/mobile/` に基本的なスケルトン（UIコンポーネント9個、APIクライアント、Supabaseクライアント）が存在

## フロー

### Step 1: 環境確認

```bash
# ブランチ確認
git branch --show-current

# mobile ディレクトリ存在確認
ls apps/mobile/package.json
```

### Step 2: Phase 1 実行

Phase 1スキルを実行する:

```
Skill("dev:mobile-common-components")
```

完了したら内容ごとにコミット:

```bash
git add apps/mobile/
git commit -m "feat(mobile): add auth provider, hooks, and navigation structure"
```

### Step 3: Phase 2 実行

Phase 2スキルを実行する:

```
Skill("dev:mobile-api-hooks")
```

完了したらコミット:

```bash
git add apps/mobile/
git commit -m "feat(mobile): add API client functions and TanStack Query hooks"
```

### Step 4: Phase 3 実行

Phase 3スキルを実行する:

```
Skill("dev:mobile-screens")
```

完了したらコミット:

```bash
git add apps/mobile/ apps/web/src/app/api/stats/
git commit -m "feat(mobile): implement all screens with API integration"
```

### Step 5: 最終検証

```bash
cd apps/mobile
npx tsc --noEmit
```

型エラーがあれば修正してコミット。

### Step 6: 完了報告

```
全フェーズ完了しました。

Phase 1: 共通コンポーネント + 認証 + ナビゲーション
Phase 2: APIクライアント + TanStack Queryフック
Phase 3: 全画面UI + 接続

次のステップ:
- `expo start` でモバイルアプリを起動して動作確認
- 問題なければ /dev-finish でPR作成・マージ
```
