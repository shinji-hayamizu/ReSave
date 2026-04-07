# ReSave

忘却曲線に基づく間隔反復記憶カードアプリ。

## 構成

| app | 技術 | ポート | 説明 |
|-----|------|--------|------|
| web | Next.js 16 | 3000 | メインアプリ + Mobile用API |
| admin | Next.js 15 | 3001 | 管理画面 |
| mobile | Expo 54 | - | モバイルアプリ |

## コマンド

```bash
pnpm dev:web          # Web開発
pnpm dev:admin        # Admin開発
pnpm dev:mobile       # Mobile開発

cd apps/web
pnpm test             # Vitest
pnpm test:e2e         # Playwright
```

## データフロー

**Web**: Component -> hooks/ -> actions/ (Server Actions) -> Supabase

**Mobile**: Component -> hooks/ -> fetch('/api/...') -> API Routes -> Supabase

## 共有コード

`packages/shared/src/types/` と `packages/shared/src/validations/` がマスター。
Web・Mobile ともに `@resave/shared` パッケージを参照する。
型・バリデーションを変更する場合は `packages/shared/` を直接編集すること。

`apps/web/src/types/` と `apps/web/src/validations/` は `@resave/shared` からの re-export のみ。

## 復習スケジューリング

固定間隔: `1, 3, 7, 14, 30, 180日`

| 評価 | 動作 |
|------|------|
| ok | review_level +1、次の間隔へ |
| again | review_level = 0 にリセット |
| remembered | 完了 (next_review_at = NULL) |

## 環境変数

```bash
# apps/web/.env.local
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# apps/mobile/.env
EXPO_PUBLIC_API_URL=http://localhost:3000
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
```

## スキル

フロントエンド（UI/UXコンポーネント、画面実装）の修正・作成時は `/frontend-design` スキルを使用すること。

コード実装時は、各ステップの実装完了後に `/testing` スキルでテストを作成・実行すること。テストなしで次のステップに進むことは禁止。

## ドキュメント

- [ビジネス要件](docs/requirements/business-requirements.md)
- [アーキテクチャ](docs/requirements/architecture.md)
- [機能仕様](docs/requirements/functions/_index.md)
