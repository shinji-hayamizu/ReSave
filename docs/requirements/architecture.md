# システムアーキテクチャ

> 関連ドキュメント: [ビジネス要件](./business-requirements.md) | [非機能要件](./non-functional.md)
> 最終更新: 2026-04-07

---

## 1. アーキテクチャ概要

### 1.1 システム全体像

```mermaid
flowchart TB
    subgraph Client["クライアント"]
        Web["Next.js 16<br/>PWA対応<br/>(apps/web)"]
        Admin["Next.js 15<br/>管理画面<br/>(apps/admin)"]
        Mobile["Expo 54<br/>(apps/mobile)"]
    end

    subgraph Vercel["Vercel"]
        SSR["Server Components"]
        API["API Routes<br/>(Mobile用)"]
        Actions["Server Actions"]
    end

    subgraph Supabase["Supabase"]
        Auth["Auth"]
        DB[("PostgreSQL")]
        Storage["Storage"]
        Realtime["Realtime"]
    end

    Web --> SSR
    Admin --> SSR
    Mobile --> API
    SSR --> Auth
    SSR --> DB
    Actions --> DB
    API --> DB
    Web --> Realtime
```

### 1.2 設計方針

| 方針 | 詳細 |
|------|------|
| **Server First** | Server Componentsをデフォルトとし、`use client`は最小限の葉コンポーネントにのみ使用 |
| **Turborepoモノレポ** | `apps/web`(メインアプリ)・`apps/admin`(管理画面)・`apps/mobile`(Expo)・`packages/shared`(共有コード)で構成 |
| **共有パッケージ** | 型定義・Zodスキーマは`packages/shared/`で管理し、`@resave/shared`パッケージとして参照 |
| **Supabase活用** | 認証・DB・ストレージをSupabaseに集約し、バックエンド開発コストを最小化 |
| **PWA対応** | オフライン学習は将来対応。まずはインストール可能なPWAとして提供 |

---

## 2. 技術スタック

### 2.1 Web（Next.js）

| 項目 | 選定技術 | バージョン | 選定理由 |
|-----|---------|-----------|---------|
| フレームワーク | Next.js | 16.x | App Router + RSC、Vercel最適化 |
| React | React | 19.x | Server Components、Concurrent Features |
| 言語 | TypeScript | 5.x | 型安全、DX向上 |
| スタイリング | Tailwind CSS | 4.x | CSS-first-config、ユーティリティCSS |
| UIコンポーネント | shadcn/ui | latest | Radix UIベース、コピペ方式でカスタマイズ自由 |
| アイコン | Lucide React | latest | 軽量、shadcn/uiとの親和性 |
| アニメーション | tw-animate-css | latest | Tailwind v4対応 |
| PWA | @serwist/next | latest | next-pwa後継、Service Worker管理 |

### 2.1.1 Admin（Next.js）

| 項目 | 選定技術 | バージョン | 選定理由 |
|-----|---------|-----------|---------|
| フレームワーク | Next.js | 15.x | 管理画面として独立運用 |

### 2.1.2 Mobile（Expo）

| 項目 | 選定技術 | バージョン | 選定理由 |
|-----|---------|-----------|---------|
| フレームワーク | Expo | SDK 54 | 開発効率、OTAアップデート |
| ナビゲーション | Expo Router | latest | Next.jsライクなファイルベースルーティング |
| 言語 | TypeScript | 5.x | 型安全、Webとの共通化 |
| データフェッチ | TanStack Query | latest | Web版と同じパターンで実装可能 |
| 認証 | Supabase | latest | Web版と同じ認証基盤 |

### 2.2 状態管理・データフェッチ

| 項目 | 選定技術 | 選定理由 |
|-----|---------|---------|
| サーバー状態 | TanStack Query | キャッシュ、リフェッチ、楽観的更新 |
| クライアント状態 | useState / Zustand | シンプルな状態はuseState、グローバル状態はZustand |
| フォーム | React Hook Form + Zod | 複雑なフォームのバリデーション |
| シンプルなフォーム | Server Actions + Zod | Server Componentsと相性良好 |

### 2.3 バックエンド（Supabase）

| 項目 | 選定技術 | 選定理由 |
|-----|---------|---------|
| 認証 | Supabase Auth | メール/パスワード、OAuth対応、Cookie-based SSR対応 |
| データベース | Supabase Database (PostgreSQL) | RLS、リアルタイム対応、無料枠あり |
| ストレージ | Supabase Storage | 画像添付用（将来対応） |
| クライアントSDK | @supabase/ssr | Server/Client両対応、Cookie管理 |

### 2.4 テスト

| 項目 | 選定技術 | 選定理由 |
|-----|---------|---------|
| ユニットテスト | Vitest | 高速、ESM対応、Jest互換API |
| コンポーネントテスト | Testing Library | ユーザー視点のテスト |
| E2Eテスト | Playwright | クロスブラウザ、高速 |

### 2.5 開発ツール・インフラ

| 項目 | 選定技術 | 選定理由 |
|-----|---------|---------|
| パッケージマネージャ | pnpm | 高速、ディスク効率 |
| モノレポツール | Turborepo | ビルドキャッシュ、並列実行 |
| Linter | ESLint | コード品質 |
| Formatter | Prettier | フォーマット統一 |
| ホスティング | Vercel | Next.js最適化、自動デプロイ |
| CI/CD | GitHub Actions | ビルド・テスト・デプロイ自動化 |
| エラー監視 | Sentry | エラートラッキング（将来対応） |

### 2.6 技術選定の経緯

| 項目 | 採用案 | 代替案 | 代替を選ばなかった理由 |
|-----|-------|-------|---------------------|
| UI | shadcn/ui | MUI, Chakra UI | コピペ方式で完全カスタマイズ可能、バンドルサイズ小 |
| 認証 | Supabase Auth | NextAuth.js, Clerk | DB/Storageと統合、無料枠が充実 |
| DB | Supabase (PostgreSQL) | PlanetScale, Neon | Auth/Storageと統合、RLS対応 |
| 状態管理 | TanStack Query | SWR | mutation対応、DevTools、楽観的更新 |
| PWA | @serwist/next | next-pwa | next-pwaは非推奨、Serwistが後継 |

---

## 3. ディレクトリ構成

```
resave/
├── apps/
│   ├── web/                          # Next.js 16 (メインアプリ + Mobile用API)
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── layout.tsx
│   │   │   │   ├── globals.css
│   │   │   │   │
│   │   │   │   ├── (auth)/           # 認証ページ
│   │   │   │   │   ├── login/page.tsx
│   │   │   │   │   ├── signup/page.tsx
│   │   │   │   │   └── reset-password/page.tsx
│   │   │   │   │
│   │   │   │   ├── (main)/           # メイン画面（認証済み）
│   │   │   │   │   ├── layout.tsx
│   │   │   │   │   ├── page.tsx      # ホーム（カード一覧・学習）
│   │   │   │   │   ├── cards/        # カード管理
│   │   │   │   │   ├── tags/         # タグ管理
│   │   │   │   │   ├── stats/        # 統計
│   │   │   │   │   ├── settings/     # 設定
│   │   │   │   │   └── about/        # アプリ情報
│   │   │   │   │
│   │   │   │   ├── auth/             # 認証コールバック
│   │   │   │   │
│   │   │   │   └── api/              # REST API（Mobile用）
│   │   │   │       ├── cards/
│   │   │   │       │   ├── route.ts
│   │   │   │       │   ├── today/route.ts
│   │   │   │       │   └── [id]/route.ts
│   │   │   │       ├── tags/
│   │   │   │       │   ├── route.ts
│   │   │   │       │   └── [id]/route.ts
│   │   │   │       ├── study/route.ts
│   │   │   │       └── health/route.ts
│   │   │   │
│   │   │   ├── components/
│   │   │   │   ├── ui/               # shadcn/uiコンポーネント
│   │   │   │   ├── cards/            # カード関連
│   │   │   │   ├── home/             # ホーム画面関連
│   │   │   │   ├── layout/           # レイアウト
│   │   │   │   ├── auth/             # 認証関連
│   │   │   │   ├── tags/             # タグ関連
│   │   │   │   ├── stats/            # 統計関連
│   │   │   │   ├── settings/         # 設定関連
│   │   │   │   └── icons/            # カスタムアイコン
│   │   │   │
│   │   │   ├── lib/
│   │   │   │   ├── supabase/
│   │   │   │   │   ├── client.ts
│   │   │   │   │   └── server.ts
│   │   │   │   └── utils.ts
│   │   │   │
│   │   │   ├── hooks/
│   │   │   │   ├── useCards.ts
│   │   │   │   ├── useHomeCards.ts    # ホーム画面専用
│   │   │   │   ├── useTags.ts
│   │   │   │   ├── useStudy.ts
│   │   │   │   ├── useStats.ts
│   │   │   │   └── useAuth.ts
│   │   │   │
│   │   │   ├── actions/              # Server Actions
│   │   │   │   ├── cards.ts
│   │   │   │   ├── tags.ts
│   │   │   │   ├── study.ts
│   │   │   │   ├── stats.ts
│   │   │   │   └── auth.ts
│   │   │   │
│   │   │   ├── types/                # @resave/shared からの re-export
│   │   │   └── validations/          # @resave/shared からの re-export
│   │   │
│   │   ├── middleware.ts
│   │   ├── next.config.ts
│   │   ├── components.json
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   ├── admin/                        # Next.js 15 (管理画面)
│   │   └── ...
│   │
│   └── mobile/                       # Expo 54 (モバイルアプリ)
│       └── ...
│
├── packages/
│   └── shared/                       # 共有パッケージ (@resave/shared)
│       └── src/
│           ├── types/                # 型定義（マスター）
│           │   ├── card.ts
│           │   ├── tag.ts
│           │   ├── review-schedule.ts
│           │   ├── study-log.ts
│           │   ├── user.ts
│           │   ├── api.ts
│           │   └── index.ts
│           └── validations/          # Zodスキーマ（マスター）
│               ├── card.ts
│               ├── tag.ts
│               ├── review-schedule.ts
│               ├── study-log.ts
│               ├── user.ts
│               └── index.ts
│
├── supabase/
│   ├── migrations/
│   └── config.toml
│
├── .github/
│   └── workflows/
│
├── turbo.json                        # Turborepo設定
├── pnpm-workspace.yaml
├── CLAUDE.md
└── README.md
```

### 各ディレクトリの役割

| ディレクトリ | 役割 |
|------------|-----|
| `apps/web/` | Next.js 16 Webアプリ（PWA対応、API Routes） |
| `apps/web/src/app/(main)/` | メイン画面（認証済みユーザー向け） |
| `apps/web/src/app/api/` | REST API（Mobile用エンドポイント） |
| `apps/web/src/components/` | Reactコンポーネント |
| `apps/web/src/hooks/` | TanStack Queryカスタムフック |
| `apps/web/src/actions/` | Server Actions |
| `apps/admin/` | Next.js 15 管理画面（独立アプリ、ポート3001） |
| `apps/mobile/` | Expo 54 モバイルアプリ |
| `packages/shared/` | 共有型定義・Zodスキーマ（`@resave/shared`） |
| `supabase/` | マイグレーション、設定 |

---

## 4. ドメイン設計

### 4.1 用語集

| 用語 | 英語表記 | 定義 | 備考 |
|-----|---------|-----|-----|
| カード | Card | 表面（質問）と裏面（答え）で構成される暗記単位 | |
| タグ | Tag | カードに付与するラベル | 1カード複数タグ可 |
| 復習スケジュール | ReviewSchedule | 復習間隔のテンプレート | 設定画面で管理 |
| 現在のステップ | CurrentStep | カードの復習進捗（0始まり） | schedule配列のインデックス |
| 学習ログ | StudyLog | 学習セッションの記録 | |
| 評価 | Assessment | OK/覚えた/覚え直し | ok/remembered/again |
| ステータス | Status | カードの状態（new/active/completed） | new=未学習, active=復習中, completed=完了 |

### 4.2 ドメインモデル

```mermaid
classDiagram
    class User {
        +id: UUID
        +email: string
        +created_at: timestamp
    }

    class ReviewSchedule {
        +id: UUID
        +user_id: UUID
        +name: string
        +intervals: int[]
        +is_default: boolean
        +created_at: timestamp
    }

    class Card {
        +id: UUID
        +user_id: UUID
        +front: string
        +back: string
        +schedule: int[]
        +current_step: int
        +next_review_at: timestamp
        +status: string
        +completed_at: timestamp
        +created_at: timestamp
        +updated_at: timestamp
    }

    class Tag {
        +id: UUID
        +user_id: UUID
        +name: string
        +color: string
        +created_at: timestamp
    }

    class CardTag {
        +card_id: UUID
        +tag_id: UUID
    }

    class StudyLog {
        +id: UUID
        +user_id: UUID
        +card_id: UUID
        +assessment: string
        +studied_at: timestamp
    }

    User "1" --> "*" ReviewSchedule : owns
    User "1" --> "*" Card : owns
    User "1" --> "*" Tag : owns
    Card "*" --> "*" Tag : has
    Card "1" --> "*" StudyLog : has
    User "1" --> "*" StudyLog : records
```

### 4.3 エンティティ定義

#### ReviewSchedule（復習スケジュールテンプレート）
| 属性名 | 型 | 必須 | 説明 |
|-------|---|-----|-----|
| id | UUID | Yes | 主キー |
| user_id | UUID | Yes | 所有者（FK → users.id） |
| name | VARCHAR(50) | Yes | テンプレート名（例: "間隔反復", "短期集中"） |
| intervals | INT[] | Yes | 復習間隔の配列（日数）例: [1, 3, 7, 14, 30, 90] |
| is_default | BOOLEAN | Yes | デフォルトフラグ（ユーザーごとに1つのみtrue） |
| created_at | TIMESTAMP | Yes | 作成日時 |

**責務**: 復習間隔テンプレートの管理、カード作成時の入力補助

#### Card
| 属性名 | 型 | 必須 | 説明 |
|-------|---|-----|-----|
| id | UUID | Yes | 主キー |
| user_id | UUID | Yes | 所有者（FK → users.id） |
| front | TEXT | Yes | 表面（質問） |
| back | TEXT | Yes | 裏面（答え） |
| schedule | INT[] | Yes | 復習間隔（テンプレートからコピー）例: [1, 3, 7, 14, 30, 90] |
| current_step | INT | Yes | 現在のステップ（0始まり）、デフォルト0 |
| next_review_at | TIMESTAMP | Yes | 次回復習日 |
| status | VARCHAR(20) | Yes | 状態（'new', 'active', 'completed'）、デフォルト'new' |
| completed_at | TIMESTAMP | No | 完了日時 |
| created_at | TIMESTAMP | Yes | 作成日時 |
| updated_at | TIMESTAMP | Yes | 更新日時 |

**責務**: 暗記内容の保持、復習スケジュール管理

#### Tag
| 属性名 | 型 | 必須 | 説明 |
|-------|---|-----|-----|
| id | UUID | Yes | 主キー |
| user_id | UUID | Yes | 所有者 |
| name | VARCHAR(50) | Yes | タグ名 |
| color | VARCHAR(20) | Yes | 色名（blue, green, purple, orange, pink, cyan, yellow, gray） |
| created_at | TIMESTAMP | Yes | 作成日時 |

**責務**: カードの分類・フィルタリング

### 4.4 ビジネスルール

| ID | カテゴリ | ルール | 例外 |
|----|---------|-------|-----|
| BR-001 | 復習 | 「OK」評価時、`current_step + 1`し、`next_review_at = NOW() + schedule[current_step]日`を設定 | スケジュール完走時は自動完了 |
| BR-002 | 復習 | 「覚え直し」評価時、`current_step = 0`にリセットし、`next_review_at = NOW() + schedule[0]日`を設定 | - |
| BR-003 | 復習 | 「覚えた」評価時、`status = 'completed'`、`completed_at = NOW()`を設定 | - |
| BR-004 | 復習 | `current_step >= length(schedule)`になったら自動的に`status = 'completed'` | - |
| BR-005 | カード | 1カードに複数タグを付与可能 | - |
| BR-006 | スケジュール | ユーザーごとにデフォルトスケジュールは1つのみ | - |
| BR-007 | カード作成 | カード作成時、選択したテンプレートの`intervals`を`cards.schedule`にコピー | - |
| BR-008 | 同期 | ログイン時、全カード・タグをサーバーと同期 | - |

### 4.5 カスタム間隔スケジューリング

ユーザーは設定画面で復習スケジュールテンプレートを作成・管理できる。
カード作成時にテンプレートを選択すると、その間隔がカードにコピーされる。

```
例: schedule = [1, 3, 7, 14, 30, 90]

current_step: 0 → 1日後に復習
current_step: 1 → 3日後に復習
current_step: 2 → 7日後に復習
current_step: 3 → 14日後に復習
current_step: 4 → 30日後に復習
current_step: 5 → 90日後に復習
current_step: 6 → 完了（status = 'completed'）
```

**デフォルトスケジュール（初回ユーザー登録時に自動作成）**:
- 名前: "間隔反復"
- intervals: [1, 3, 7, 14, 30, 90]

---

## 5. データベース設計

### 5.1 ER図

```mermaid
erDiagram
    users ||--o{ review_schedules : owns
    users ||--o{ cards : owns
    users ||--o{ tags : owns
    users ||--o{ study_logs : records
    cards ||--o{ card_tags : has
    tags ||--o{ card_tags : has
    cards ||--o{ study_logs : has

    users {
        uuid id PK
        string email UK
        timestamp created_at
    }

    review_schedules {
        uuid id PK
        uuid user_id FK
        varchar name
        int_array intervals
        boolean is_default
        timestamp created_at
    }

    cards {
        uuid id PK
        uuid user_id FK
        text front
        text back
        int_array schedule
        int current_step
        timestamp next_review_at
        varchar status
        timestamp completed_at
        timestamp created_at
        timestamp updated_at
    }

    tags {
        uuid id PK
        uuid user_id FK
        varchar name
        varchar color
        timestamp created_at
    }

    card_tags {
        uuid card_id PK,FK
        uuid tag_id PK,FK
    }

    study_logs {
        uuid id PK
        uuid user_id FK
        uuid card_id FK
        varchar assessment
        timestamp studied_at
    }
```

### 5.2 テーブル定義

#### users テーブル（Supabase Auth管理）
Supabase Authが自動作成。`auth.users`を参照。

#### review_schedules テーブル（復習スケジュールテンプレート）
| カラム名 | 型 | NULL | デフォルト | 説明 |
|---------|---|------|-----------|-----|
| id | UUID | NO | gen_random_uuid() | PK |
| user_id | UUID | NO | - | FK → auth.users.id |
| name | VARCHAR(50) | NO | - | テンプレート名 |
| intervals | INT[] | NO | - | 復習間隔（日数）の配列 |
| is_default | BOOLEAN | NO | false | デフォルトフラグ |
| created_at | TIMESTAMPTZ | NO | NOW() | 作成日時 |

**制約**: PK: `id`, FK: `user_id`, UNIQUE: `(user_id, name)`, UNIQUE INDEX: `user_id WHERE is_default = true`（ユーザーごとにデフォルトは1つまで）

#### cards テーブル
| カラム名 | 型 | NULL | デフォルト | 説明 |
|---------|---|------|-----------|-----|
| id | UUID | NO | gen_random_uuid() | PK |
| user_id | UUID | NO | - | FK → auth.users.id |
| front | TEXT | NO | - | 表面（質問） |
| back | TEXT | NO | - | 裏面（答え） |
| schedule | INT[] | NO | - | 復習間隔（テンプレートからコピー） |
| current_step | INT | NO | 0 | 現在のステップ（0始まり） |
| next_review_at | TIMESTAMPTZ | YES | NULL | 次回復習日 |
| status | VARCHAR(20) | NO | 'new' | 状態（'new', 'active', 'completed'） |
| completed_at | TIMESTAMPTZ | YES | - | 完了日時 |
| created_at | TIMESTAMPTZ | NO | NOW() | 作成日時 |
| updated_at | TIMESTAMPTZ | NO | NOW() | 更新日時 |

**制約**: PK: `id`, FK: `user_id`, INDEX: `(user_id)`, `(user_id, status, next_review_at)`, `(user_id, status)`

#### tags テーブル
| カラム名 | 型 | NULL | デフォルト | 説明 |
|---------|---|------|-----------|-----|
| id | UUID | NO | gen_random_uuid() | PK |
| user_id | UUID | NO | - | FK → auth.users.id |
| name | VARCHAR(50) | NO | - | タグ名 |
| color | VARCHAR(20) | NO | 'blue' | 色名 |
| created_at | TIMESTAMPTZ | NO | NOW() | 作成日時 |

**制約**: PK: `id`, FK: `user_id`, UNIQUE: `(user_id, name)`

#### card_tags テーブル
| カラム名 | 型 | NULL | デフォルト | 説明 |
|---------|---|------|-----------|-----|
| card_id | UUID | NO | - | FK → cards.id |
| tag_id | UUID | NO | - | FK → tags.id |

**制約**: PK: `(card_id, tag_id)`, FK: `card_id`, `tag_id`

#### study_logs テーブル
| カラム名 | 型 | NULL | デフォルト | 説明 |
|---------|---|------|-----------|-----|
| id | UUID | NO | gen_random_uuid() | PK |
| user_id | UUID | NO | - | FK → auth.users.id |
| card_id | UUID | NO | - | FK → cards.id |
| assessment | VARCHAR(20) | NO | - | 'ok', 'remembered', 'again' |
| studied_at | TIMESTAMPTZ | NO | NOW() | 学習日時 |

**制約**: PK: `id`, FK: `user_id`, `card_id`, INDEX: `(user_id)`, `(user_id, studied_at)`, `(card_id)`

### 5.3 Row Level Security (RLS)

```sql
-- review_schedules: ユーザーは自分のスケジュールのみアクセス可能
ALTER TABLE review_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own schedules" ON review_schedules
  FOR ALL USING (auth.uid() = user_id);

-- cards: ユーザーは自分のカードのみアクセス可能
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own cards" ON cards
  FOR ALL USING (auth.uid() = user_id);

-- tags: ユーザーは自分のタグのみアクセス可能
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own tags" ON tags
  FOR ALL USING (auth.uid() = user_id);

-- card_tags: カード所有者のみ操作可能
ALTER TABLE card_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own card_tags" ON card_tags
  FOR ALL USING (
    EXISTS (SELECT 1 FROM cards WHERE cards.id = card_id AND cards.user_id = auth.uid())
  );

-- study_logs: ユーザーは自分のログのみアクセス可能
ALTER TABLE study_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own study_logs" ON study_logs
  FOR ALL USING (auth.uid() = user_id);
```

### 5.4 主要クエリ

```sql
-- 今日の復習カード取得
SELECT * FROM cards 
WHERE user_id = $1 
  AND status = 'active' 
  AND next_review_at <= NOW()
ORDER BY next_review_at;

-- 完了カード一覧
SELECT * FROM cards 
WHERE user_id = $1 
  AND status = 'completed'
ORDER BY completed_at DESC;

-- ユーザーのデフォルトスケジュール取得
SELECT * FROM review_schedules
WHERE user_id = $1 AND is_default = true;

-- 今月の完了数
SELECT COUNT(*) FROM cards
WHERE user_id = $1
  AND completed_at >= DATE_TRUNC('month', NOW());

-- 学習統計（過去7日）
SELECT 
  DATE(studied_at) as date,
  COUNT(*) as count
FROM study_logs
WHERE user_id = $1
  AND studied_at >= NOW() - INTERVAL '7 days'
GROUP BY DATE(studied_at)
ORDER BY date;
```

### 5.5 初期データ（シード）

ユーザー登録時に自動作成するデフォルトスケジュール:

```sql
INSERT INTO review_schedules (user_id, name, intervals, is_default)
VALUES ($user_id, '間隔反復', ARRAY[1, 3, 7, 14, 30, 90], true);
```

### 5.6 マイグレーション運用
- **ツール**: Supabase CLI (`supabase db push`, `supabase migration`)
- **命名規則**: `YYYYMMDDHHMMSS_description.sql`
- **ロールバック方針**: 手動で逆マイグレーションを作成

---

## 6. API設計

### 6.1 概要

**Web（Next.js）** と **Mobile（Expo）** で異なるデータフローを採用。

| プラットフォーム | データ取得 | データ変更 |
|----------------|----------|----------|
| Web | Server Components + TanStack Query | Server Actions + TanStack Query mutation |
| Mobile | TanStack Query + REST API | TanStack Query mutation + REST API |

### 6.2 データフローパターン

#### Web（Server Actions経由）
```
画面 → hooks/useCards.ts → actions/cards.ts → Supabase
```
- mutationはすべてServer Actionsで実行
- TanStack QueryのuseMutationからServer Actionsを呼び出す

#### Mobile（REST API経由）
```
画面 → hooks/useCards.ts → lib/api/client.ts → fetch('/api/...') → Web API Routes → Supabase
```
- MobileはWebのAPI Routesを経由してデータアクセス
- 認証はSupabase Authで統一（Authorizationヘッダーでトークン送信）

### 6.3 認証フロー（Mobile）
```
1. Mobile: Supabase Authでログイン → アクセストークン取得
2. Mobile: API呼び出し時に Authorization: Bearer {token} を付与
3. Web API: トークンを検証してユーザー特定
4. Web API: RLSによりユーザー自身のデータのみ返却
```

### 6.4 Server Actions（Web用）

```typescript
// apps/web/src/actions/cards.ts
'use server'

import { createServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createCard(data: { 
  front: string
  back: string
  tagIds: string[]
  schedule: number[]  // テンプレートからコピーされた間隔
}) {
  const supabase = await createServerClient()
  // schedule配列をそのまま保存
  // next_review_at = NOW() + schedule[0]日
  // current_step = 0, status = 'active'
  revalidatePath('/cards')
}

export async function updateCard(id: string, data: Partial<Card>) {
  // ...
}

export async function deleteCard(id: string) {
  // ...
}

export async function submitAssessment(cardId: string, assessment: 'ok' | 'remembered' | 'again') {
  // OK: current_step++, next_review_at = NOW() + schedule[current_step]日
  //     スケジュール完走時は status = 'completed', completed_at = NOW()
  // 覚えた: status = 'completed', completed_at = NOW()
  // 覚え直し: current_step = 0, next_review_at = NOW() + schedule[0]日
  // study_logにも記録
}
```

```typescript
// apps/web/src/actions/review-schedules.ts
'use server'

import { createServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createReviewSchedule(data: { 
  name: string
  intervals: number[]
  isDefault?: boolean 
}) {
  // ...
  revalidatePath('/settings')
}

export async function updateReviewSchedule(id: string, data: Partial<ReviewSchedule>) {
  // ...
}

export async function deleteReviewSchedule(id: string) {
  // デフォルトスケジュールは削除不可
  // ...
}

export async function setDefaultSchedule(id: string) {
  // 既存のis_default=trueをfalseにしてから、指定IDをtrueに
  // ...
}
```

### 6.5 TanStack Query フック

```typescript
// hooks/useCards.ts
export const cardKeys = {
  all: ['cards'] as const,
  lists: () => [...cardKeys.all, 'list'] as const,
  list: (filters: CardFilters) => [...cardKeys.lists(), filters] as const,
  today: () => [...cardKeys.all, 'today'] as const,
  detail: (id: string) => [...cardKeys.all, 'detail', id] as const,
}

export function useTodayCards() {
  return useQuery({
    queryKey: cardKeys.today(),
    queryFn: () => fetchTodayCards(),
  })
}

export function useSubmitAssessment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ cardId, assessment }) => submitAssessment(cardId, assessment),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: cardKeys.today() })
    },
  })
}
```

### 6.6 API Routes（Mobile用）

Mobile（Expo）からのアクセス用REST APIを`web/src/app/api/`に配置。

| メソッド | パス | 説明 |
|---------|-----|-----|
| GET | /api/cards | カード一覧 |
| POST | /api/cards | カード作成 |
| GET | /api/cards/:id | カード詳細 |
| PATCH | /api/cards/:id | カード更新 |
| DELETE | /api/cards/:id | カード削除 |
| GET | /api/cards/today | 今日の復習カード |
| GET | /api/tags | タグ一覧 |
| POST | /api/tags | タグ作成 |
| PATCH | /api/tags/:id | タグ更新 |
| DELETE | /api/tags/:id | タグ削除 |
| POST | /api/study | 学習結果送信 |
| GET | /api/health | ヘルスチェック |

#### API認証
```typescript
// apps/web/src/app/api/cards/route.ts
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const token = authHeader.split(' ')[1]
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  )

  // RLSによりユーザー自身のデータのみ取得
  const { data, error } = await supabase.from('cards').select('*')
  // ...
}
```

---

## 7. 認証・認可設計

### 7.1 認証方式

- **方式**: Supabase Auth (Cookie-based SSR)
- **パッケージ**: `@supabase/ssr`
- **アクセストークン有効期限**: 1時間
- **リフレッシュトークン有効期限**: 7日

### 7.2 認証フロー

```mermaid
sequenceDiagram
    participant C as Client
    participant M as Middleware
    participant S as Server Component
    participant A as Supabase Auth

    C->>M: リクエスト
    M->>A: supabase.auth.getUser()
    A->>M: ユーザー情報 + 新トークン
    M->>M: Cookieにトークン設定
    M->>S: リクエスト転送
    S->>S: 認証済みユーザーでレンダリング
    S->>C: HTMLレスポンス
```

### 7.3 Middleware実装

```typescript
// middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // 未認証ユーザーを認証ページへリダイレクト
  if (!user && !request.nextUrl.pathname.startsWith('/login') && !request.nextUrl.pathname.startsWith('/signup')) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
```

### 7.4 権限マトリクス

| 機能 | 未認証 | 認証済み |
|-----|-------|---------|
| ログイン/登録ページ | ○ | リダイレクト |
| カード操作 | - | 自分のみ |
| タグ操作 | - | 自分のみ |
| 学習セッション | - | 自分のカードのみ |
| 統計閲覧 | - | 自分のみ |

---

## 8. インフラ設計

### 8.1 構成図

```mermaid
flowchart TB
    subgraph Internet
        User["ユーザー"]
    end

    subgraph Vercel["Vercel"]
        Edge["Edge Network"]
        Next["Next.js App"]
    end

    subgraph Supabase["Supabase"]
        Auth["Auth"]
        DB[("PostgreSQL")]
        Storage["Storage"]
    end

    subgraph GitHub["GitHub"]
        Repo["Repository"]
        Actions["Actions"]
    end

    User --> Edge
    Edge --> Next
    Next --> Auth
    Next --> DB
    Next --> Storage
    Repo --> Actions
    Actions --> Vercel
```

### 8.2 環境別設定

| 項目 | dev | preview | prod |
|-----|-----|---------|------|
| URL | localhost:3000 | pr-xxx.vercel.app | resave.app |
| Supabase | ローカル or dev | dev | prod |
| ログレベル | DEBUG | INFO | WARN |
| PWA | 無効 | 無効 | 有効 |

### 8.3 CI/CD

```mermaid
flowchart LR
    Push["Push"] --> Lint["ESLint"]
    Lint --> TypeCheck["型チェック"]
    TypeCheck --> Test["Vitest"]
    Test --> Build["Build"]
    Build --> Deploy["Vercel Deploy"]
```

- **ツール**: GitHub Actions
- **トリガー**:
  - `master`ブランチ → 本番デプロイ
  - PR → Previewデプロイ
- **チェック項目**: lint, typecheck, test, build

---

## 9. セキュリティ設計

### 9.1 脅威モデル

| 脅威 | 対象 | リスク | 対策 |
|-----|-----|-------|-----|
| 認証なりすまし | Auth | 高 | Supabase Auth + HTTPS + Cookie HttpOnly |
| データ改ざん | DB | 中 | RLS, Server Actions内でのバリデーション |
| XSS | フロント | 中 | React自動エスケープ, CSP |
| CSRF | Actions | 中 | SameSite Cookie, Origin検証 |
| SQLインジェクション | DB | 高 | Supabaseパラメータ化クエリ |

### 9.2 データ保護

| 分類 | 例 | 保護レベル |
|-----|---|----------|
| 認証情報 | パスワード | Supabase Auth管理（bcrypt） |
| 個人識別 | メールアドレス | RLSで所有者のみ |
| 学習データ | カード内容 | RLSで所有者のみ |

### 9.3 環境変数

#### apps/web/.env.local
```env
# 公開可能（クライアントで使用）
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# サーバーのみ
SUPABASE_SERVICE_ROLE_KEY=eyJ...  # 管理用（通常は不使用）
```

#### apps/mobile/.env
```env
EXPO_PUBLIC_API_URL=http://localhost:3000
EXPO_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

---

## 10. テスト設計

### 10.1 テストピラミッド

| 種別 | 比率 | ツール | 対象 |
|-----|-----|-------|-----|
| ユニット | 70% | Vitest | ユーティリティ、フック、スケジューリングロジック |
| コンポーネント | 20% | Testing Library | UIコンポーネント |
| E2E | 10% | Playwright | 主要フロー |

### 10.2 カバレッジ目標

- 全体: 80%以上
- `web/src/lib/scheduling.ts`: 100%（コアロジック）
- 認証・学習フロー: E2Eで担保

### 10.3 E2Eシナリオ

| ID | シナリオ | 優先度 |
|----|---------|-------|
| E2E-001 | ユーザー登録 → ログイン | P0 |
| E2E-002 | カード作成 → タグ付け → 一覧確認 | P0 |
| E2E-003 | 今日の復習 → 学習 → 評価 → 次回復習日更新 | P0 |
| E2E-004 | パスワードリセット | P1 |

---

## 11. 運用設計

### 11.1 監視

| メトリクス | 閾値 | アラート |
|-----------|-----|---------|
| エラーレート | > 1% | Slack通知 |
| レスポンスタイム(p99) | > 500ms | Slack通知 |

### 11.2 ログ設計

- **出力先**: Vercel Logs
- **レベル**: ERROR, WARN, INFO
- **フォーマット**: JSON構造化ログ

### 11.3 バックアップ

| 対象 | 頻度 | 保持期間 | 方式 |
|-----|-----|---------|-----|
| DB | 日次 | 30日 | Supabase自動バックアップ |
| Storage | リアルタイム | 無期限 | Supabase Storage |

---

## 12. 外部サービス連携

| サービス | 用途 | 費用 |
|---------|-----|------|
| Supabase | 認証・DB・Storage | 無料枠（500MB DB, 1GB Storage） |
| Vercel | ホスティング | 無料枠（Hobby） |
| GitHub Actions | CI/CD | 無料（Public repo） |

---

## 13. 開発コマンド

```bash
# プロジェクトルートから実行
pnpm dev:web          # Web開発（ポート3000）
pnpm dev:admin        # Admin開発（ポート3001）
pnpm dev:mobile       # Mobile開発

# apps/web ディレクトリから実行
cd apps/web
pnpm test             # Vitest
pnpm test:e2e         # Playwright
```

---

## 14. 共有コード管理

### 方針
- `packages/shared/src/types/` と `packages/shared/src/validations/` がマスター
- `@resave/shared` パッケージとしてワークスペース内から参照
- `apps/web/src/types/` と `apps/web/src/validations/` は `@resave/shared` からの re-export のみ

### 共有対象
| 対象 | マスター | 参照方法 |
|------|---------|---------|
| 型定義 | `packages/shared/src/types/` | `import type { Card } from '@resave/shared'` |
| Zodスキーマ | `packages/shared/src/validations/` | `import { cardSchema } from '@resave/shared'` |

### 注意点
- 型・バリデーションを変更する場合は `packages/shared/` を直接編集すること
- `apps/web/src/types/` や `apps/web/src/validations/` を直接編集しない

---

## 15. 今後の検討事項

- [ ] プッシュ通知（Firebase Cloud Messaging / Expo Push）
- [ ] オフライン対応（Service Workerでキャッシュ）
- [ ] 画像添付機能
- [ ] Google OAuth対応
- [ ] AI によるカード自動生成

---

## 16. 参考情報

- [Next.js Documentation](https://nextjs.org/docs)
- [Expo Documentation](https://docs.expo.dev)
- [Expo Router](https://docs.expo.dev/router/introduction)
- [Supabase Documentation](https://supabase.com/docs)
- [Supabase SSR Guide](https://supabase.com/docs/guides/auth/server-side/nextjs)
- [shadcn/ui](https://ui.shadcn.com)
- [TanStack Query](https://tanstack.com/query)
- [Serwist (PWA)](https://serwist.pages.dev/docs/next/getting-started)
