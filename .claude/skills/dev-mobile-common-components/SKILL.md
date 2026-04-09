---
name: dev:mobile-common-components
description: |
  Phase 1: 共通コンポーネント + 認証 + ナビゲーション構築。
  AuthProvider、useAuth/useSession hooks、認証画面3つ、タブナビゲーション。
allowed-tools: Bash, Read, Write, Edit, Glob, Grep, Agent
---

# Phase 1: 共通コンポーネント + 認証 + ナビゲーション

## 目的

Mobileアプリの土台を構築する:
- 認証基盤（AuthProvider + hooks + 画面）
- ナビゲーション構造（タブ + 認証ガード）
- バリデーション再エクスポート

## 実装対象

### 1. バリデーション再エクスポート

`apps/mobile/validations/user.ts` を作成:
- `@resave/shared` から `loginSchema`, `signupSchema`, `resetPasswordSchema` を再エクスポート
- 型も再エクスポート: `LoginInput`, `SignupInput`, `ResetPasswordInput`

### 2. 認証Hook

**`apps/mobile/hooks/useAuth.ts`**
- Web版 `apps/web/src/hooks/useAuth.ts` のパターンを踏襲
- `supabase.auth.startAutoRefresh()` → `getSession()` → `onAuthStateChange` リスナー
- 返り値: `{ user, session, loading }`
- Web版との違い: `getUser()` ではなく `getSession()` を使用（tokenが必要なため）
- クリーンアップで `subscription.unsubscribe()` + `stopAutoRefresh()`

**`apps/mobile/hooks/useSession.ts`**
- `useAuth()` からtoken情報を抽出するシンプルなhook
- 返り値: `{ token: string | null, user, loading, isAuthenticated: boolean }`
- `token` は `session?.access_token`
- 全てのAPI呼び出しhook（Phase 2）がこのhookを使用する

### 3. AuthProvider

**`apps/mobile/lib/auth/AuthProvider.tsx`**
- React Context + Provider パターン
- 内部で `useAuth()` を使用
- Context提供値:
  - `user`, `session`, `loading` (useAuthから)
  - `signIn(email, password)` → `supabase.auth.signInWithPassword()`
  - `signUp(email, password)` → `supabase.auth.signUp()`
  - `signOut()` → `supabase.auth.signOut()`
  - `resetPassword(email)` → `supabase.auth.resetPasswordForEmail()`
- Supabaseエラーコードを日本語メッセージにマッピングするヘルパー関数も含む

### 4. 認証画面

**`apps/mobile/app/(auth)/_layout.tsx`**
- Stack navigator
- `headerShown: false`
- 中央配置レイアウト

**`apps/mobile/app/(auth)/login.tsx`**
- 既存UI使用: `Input`, `PasswordInput`, `Button`, `FormAlert`
- フォーム状態: `useState` で email, password, error, loading を管理
- バリデーション: `loginSchema.safeParse()` でサブミット前に検証
- 送信: AuthContextの `signIn()` を呼び出し
- リンク: 「アカウント作成」→ signup、「パスワードを忘れた」→ reset-password

**`apps/mobile/app/(auth)/signup.tsx`**
- フィールド: email, password, confirmPassword
- バリデーション: `signupSchema.safeParse()`
- 送信: AuthContextの `signUp()` を呼び出し
- 成功時: 確認メール送信案内を表示

**`apps/mobile/app/(auth)/reset-password.tsx`**
- フィールド: email のみ
- バリデーション: `resetPasswordSchema.safeParse()`
- 送信: AuthContextの `resetPassword()` を呼び出し
- 成功時: メール送信案内を表示

### 5. タブナビゲーション

**`apps/mobile/app/(tabs)/_layout.tsx`**
- Expo Router `Tabs` コンポーネント使用
- 4タブ: ホーム / カード / タグ / 統計
- 日本語ラベル
- タブアイコン: Unicode文字またはExpo Vector Icons

**プレースホルダー画面（Phase 3で置き換え）:**
- `apps/mobile/app/(tabs)/index.tsx` — 「今日の復習」タイトル
- `apps/mobile/app/(tabs)/cards.tsx` — 「カード一覧」タイトル
- `apps/mobile/app/(tabs)/tags.tsx` — 「タグ管理」タイトル
- `apps/mobile/app/(tabs)/stats.tsx` — 「統計」タイトル

### 6. ルートレイアウト更新

**`apps/mobile/app/_layout.tsx` を更新**
- `AuthProvider` でラップ
- 認証状態による条件分岐ルーティング:
  - `loading` → スプラッシュ画面（ActivityIndicator）
  - `!user` → `(auth)` グループへリダイレクト
  - `user` → `(tabs)` グループへリダイレクト
- `useSegments()` + `useRouter()` パターンで認証ガード実装

**`apps/mobile/app/index.tsx` を更新**
- `Redirect` コンポーネントで認証状態に応じたリダイレクト

## 既存コード再利用

| 再利用するもの | パス |
|-------------|------|
| UIコンポーネント | `apps/mobile/components/ui/` (Input, PasswordInput, Button, FormAlert) |
| Supabaseクライアント | `apps/mobile/lib/supabase.ts` |
| バリデーション | `packages/shared/src/validations/user.ts` |
| Web版useAuth参考 | `apps/web/src/hooks/useAuth.ts` |

## 検証

実装完了後、以下を確認:

```bash
cd apps/mobile
npx tsc --noEmit
```

型エラーがなければ Phase 1 完了。
