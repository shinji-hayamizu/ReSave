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

### Step 6: 環境変数の確認・作成

Mobile用の `.env` が存在しない場合、メインリポジトリからシンボリックリンクを作成する。
メインリポジトリにも存在しない場合は、Web側の `.env.local` から値を取得して作成する:

```bash
MAIN_REPO=/Users/haya/development/myApps/job/ReSave

# メインリポジトリから .env をリンク
if [ -f "$MAIN_REPO/apps/mobile/.env" ]; then
  ln -sf "$MAIN_REPO/apps/mobile/.env" apps/mobile/.env
elif [ ! -f "apps/mobile/.env" ]; then
  # Web側の環境変数から生成
  SUPABASE_URL=$(grep NEXT_PUBLIC_SUPABASE_URL "$MAIN_REPO/apps/web/.env.local" | cut -d= -f2-)
  SUPABASE_ANON_KEY=$(grep NEXT_PUBLIC_SUPABASE_ANON_KEY "$MAIN_REPO/apps/web/.env.local" | cut -d= -f2-)
  
  cat > apps/mobile/.env << EOF
EXPO_PUBLIC_API_URL=http://localhost:3000
EXPO_PUBLIC_SUPABASE_URL=$SUPABASE_URL
EXPO_PUBLIC_SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY
EOF
  echo "apps/mobile/.env を作成しました"
fi
```

### Step 7: Web APIサーバー起動

MobileアプリはWeb側のAPIを呼び出すため、Web devサーバーを起動する:

```bash
# ポート確認
PORT=$(lsof -ti:3000 > /dev/null 2>&1 && echo 3002 || echo 3000)

cd apps/web && pnpm next dev -p $PORT &
echo $! > .dev-server-pid

# 起動待機
for i in $(seq 1 30); do
  curl -s -o /dev/null -w "%{http_code}" http://localhost:$PORT | grep -q "200\|307" && echo "Web server READY on port $PORT" && break || sleep 2
done
```

### Step 8: Expo devサーバー起動

```bash
cd apps/mobile && npx expo start --port 8081 &
echo $! > .expo-server-pid
```

Expo devサーバーが起動したら、QRコードが表示される。
実機のExpo Goアプリでスキャンして動作確認する。

### Step 9: 完了報告

```
全フェーズ完了しました。

Phase 1: 共通コンポーネント + 認証 + ナビゲーション
Phase 2: APIクライアント + TanStack Queryフック
Phase 3: 全画面UI + 接続

Web API: http://localhost:<PORT>
Expo dev: http://localhost:8081

Expo Goアプリでスキャンして動作確認してください。
問題なければ /dev-finish でPR作成・マージ
```
