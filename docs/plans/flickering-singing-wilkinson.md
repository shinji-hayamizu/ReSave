# Google OAuth認証実装プラン

## Context（背景）

ReSaveアプリでユーザーがGoogleアカウントでログイン・新規登録できるようにする。

**現状**：
- アプリケーション側（LoginForm/SignupForm/コールバック処理）は **既に実装済み**
- Supabase側でGoogle Providerが無効化されている（`supabase/config.toml` で `enabled = false`）
- Google Cloud ConsoleでのOAuthクライアント未作成

**目的**：
- ユーザーがメール/パスワードの代わりにGoogleアカウントでログインできるようにする
- 新規ユーザーがGoogleアカウントで簡単に登録できるようにする
- セキュアな認証フローを提供する

---

## 実装アプローチ

**コード変更は不要** - これは **設定のみのタスク** です。

### Phase 1: Google Cloud Console設定

1. **Google Cloud Consoleにアクセス**
   - https://console.cloud.google.com/ にログイン
   - プロジェクトを作成または既存プロジェクトを選択

2. **OAuth同意画面の設定**
   - 「APIとサービス」→「OAuth同意画面」
   - ユーザータイプ：「外部」を選択
   - アプリ名：「ReSave」
   - ユーザーサポートメール：自分のメールアドレス
   - デベロッパーの連絡先：自分のメールアドレス
   - 保存して次へ

3. **OAuthクライアントIDの作成**
   - 「APIとサービス」→「認証情報」
   - 「認証情報を作成」→「OAuthクライアントID」
   - アプリケーションの種類：「ウェブアプリケーション」
   - 名前：「ReSave Web」
   - 承認済みのリダイレクトURI：
     ```
     # 開発環境
     http://localhost:54321/auth/v1/callback

     # 本番環境（デプロイ後に追加）
     https://<your-project-ref>.supabase.co/auth/v1/callback
     ```
   - 作成ボタンをクリック

4. **クレデンシャルを取得**
   - 表示されるモーダルから「クライアントID」と「クライアントシークレット」をコピー
   - **重要**：クライアントシークレットは安全に保管（後で必要）

---

### Phase 2: Supabase設定

#### 2.1 Supabaseダッシュボードでプロバイダ有効化

1. **Supabaseダッシュボードにアクセス**
   - https://supabase.com/dashboard にログイン
   - ReSaveプロジェクトを選択

2. **Google Providerを有効化**
   - 左サイドバー：「Authentication」→「Providers」
   - 「Google」を探してクリック
   - 「Enable Google provider」をONに切り替え
   - Google Cloud Consoleで取得した **Client ID** と **Client Secret** を入力
   - 「Save」ボタンをクリック

#### 2.2 ローカル環境の設定更新

`supabase/config.toml` を以下のように更新：

```toml
[auth.external.google]
enabled = true
client_id = "env(GOOGLE_CLIENT_ID)"
secret = "env(GOOGLE_CLIENT_SECRET)"
redirect_uri = "http://localhost:54321/auth/v1/callback"
```

---

### Phase 3: 環境変数設定

#### 3.1 ローカル環境（`.env.local`）

**Supabaseの環境変数ファイル（`supabase/.env`）に追加**：

```bash
# Google OAuth Credentials
GOOGLE_CLIENT_ID=<Google Cloud Consoleで取得したClient ID>
GOOGLE_CLIENT_SECRET=<Google Cloud Consoleで取得したClient Secret>
```

**重要**：
- `.env` ファイルが `.gitignore` に含まれていることを確認
- クレデンシャルは絶対にコミットしない

#### 3.2 本番環境（Vercel）

Vercelダッシュボードで環境変数を設定：

1. Vercelプロジェクトの「Settings」→「Environment Variables」
2. 以下の変数を追加（既存のSupabase変数は変更不要）：
   - 本番環境のSupabaseプロジェクトで既にGoogle Providerを有効化済みの場合、追加の環境変数は不要

**注意**：
- Next.jsアプリ側には `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` を設定する必要は **ない**
- これらはSupabase側で管理される

---

## 変更が必要なファイル

### 設定ファイル

| ファイル | 変更内容 |
|---------|---------|
| `supabase/config.toml` | `[auth.external.google]` の `enabled = true` に変更 |
| `supabase/.env` | `GOOGLE_CLIENT_ID` と `GOOGLE_CLIENT_SECRET` を追加 |

### コードファイル

**変更不要** - 以下のファイルは既に実装済み：

- `/apps/web/src/components/auth/login-form.tsx` - Google OAuthボタン実装済み
- `/apps/web/src/components/auth/signup-form.tsx` - Google OAuthボタン実装済み
- `/apps/web/src/app/auth/callback/route.ts` - OAuthコールバック処理実装済み
- `/apps/web/middleware.ts` - 認証ミドルウェア実装済み

---

## 検証手順

### ローカル環境テスト

1. **Supabaseローカル環境を再起動**
   ```bash
   cd /Users/haya/development/myApps/job/ReSave
   pnpm supabase stop
   pnpm supabase start
   ```

2. **Next.jsアプリを起動**
   ```bash
   pnpm dev:web
   ```

3. **ログインページでGoogle OAuthをテスト**
   - http://localhost:3000/login にアクセス
   - 「Googleでログイン」ボタンをクリック
   - Googleログイン画面が表示されることを確認
   - Googleアカウントでログイン
   - ホーム画面（`/`）にリダイレクトされることを確認

4. **新規登録ページでGoogle OAuthをテスト**
   - http://localhost:3000/signup にアクセス
   - 「Googleで登録」ボタンをクリック
   - 同様のフローが動作することを確認

### エラーシナリオのテスト

1. **OAuth拒否時**：
   - Googleログイン画面で「キャンセル」をクリック
   - エラーメッセージが表示されることを確認

2. **ネットワークエラー時**：
   - 開発者ツールでネットワークをオフライン化
   - Google OAuthボタンをクリック
   - 適切なエラー処理がされることを確認

---

## 本番環境デプロイ前チェックリスト

- [ ] Google Cloud Consoleで本番環境のリダイレクトURIを追加済み
- [ ] Supabase本番プロジェクトでGoogle Providerが有効化済み
- [ ] Vercelで環境変数が正しく設定済み（必要な場合）
- [ ] Preview環境でOAuthフローをテスト済み
- [ ] エラーログ監視の準備完了

---

## セキュリティ考慮事項

### クレデンシャル管理

- **Google Client Secret** は絶対にコミットしない
- `.gitignore` に `.env` が含まれていることを確認
- チーム間で共有する場合は1Password等のシークレット管理ツールを使用

### リダイレクトURI制御

- Google Cloud Consoleで許可するリダイレクトURIを厳密に管理
- 開発環境（`localhost:54321`）と本番環境のみ許可
- ワイルドカード（`*`）は使用しない

### トークンセキュリティ

- Supabase Authが自動的にHTTP-only Cookieでトークンを管理
- `middleware.ts` がセッションリフレッシュを自動処理
- XSS/CSRF対策はSupabase Auth SDKが提供

---

## トラブルシューティング

### 「redirect_uri_mismatch」エラー

**原因**：Google Cloud Consoleで設定したリダイレクトURIが一致していない

**解決方法**：
1. Google Cloud Consoleの「認証情報」を確認
2. 承認済みのリダイレクトURIに `http://localhost:54321/auth/v1/callback` が含まれているか確認
3. 含まれていない場合は追加して保存

### 「invalid_client」エラー

**原因**：Client IDまたはClient Secretが間違っている

**解決方法**：
1. Supabaseダッシュボードの「Authentication」→「Providers」→「Google」を確認
2. Client IDとClient Secretを再入力
3. `supabase/.env` の `GOOGLE_CLIENT_ID` と `GOOGLE_CLIENT_SECRET` を確認

### OAuthボタンをクリックしても反応しない

**原因**：Supabase Providerが有効化されていない

**解決方法**：
1. Supabaseダッシュボードで「Google」プロバイダが有効化されているか確認
2. ローカル環境の場合、`supabase/config.toml` で `enabled = true` になっているか確認
3. Supabaseを再起動：`pnpm supabase stop && pnpm supabase start`

---

## 参考リソース

- [Supabase Auth - Google Login](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [Google Cloud Console](https://console.cloud.google.com/)
- [Next.js App Router Authentication](https://nextjs.org/docs/app/building-your-application/authentication)
