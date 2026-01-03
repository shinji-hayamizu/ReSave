# Research & Design Decisions

---
**Purpose**: HTMLモックからReact UIコンポーネントを実装し、既存のServer Actions/TanStack Queryフックと連携するための調査結果を記録。

**Usage**:
- 既存コードベースのパターン分析
- コンポーネント境界の決定根拠
- 技術選定の詳細な比較
---

## Summary
- **Feature**: `ui-mock-integration`
- **Discovery Scope**: Extension（既存システムへのUI層追加）
- **Key Findings**:
  1. 既存のhooks/actions/typesが完備しており、UI層のみ実装すればよい
  2. shadcn/uiの基本コンポーネント（Button, Input, Card等）は既に導入済み
  3. HTMLモックは`data-component`属性でコンポーネント境界が明示されている

## Research Log

### 既存Hooksパターン分析
- **Context**: UI実装に使用するフックの確認
- **Sources Consulted**: `apps/web/src/hooks/*.ts`
- **Findings**:
  - `useCards`, `useCard`, `useTodayCards`, `useCreateCard`, `useUpdateCard`, `useDeleteCard` - カードCRUD完備
  - `useTags`, `useTag`, `useCreateTag`, `useUpdateTag`, `useDeleteTag` - タグCRUD完備
  - `useStudySession`, `useSubmitAssessment` - 学習・評価機能完備
  - `useTodayStats`, `useDailyStats`, `useSummaryStats` - 統計取得完備
  - パターン: TanStack Query + Server Actions直接import（dynamic import使用）
- **Implications**: UI層はこれらフックを呼び出すだけでよい。新規フック作成は不要。

### 既存UIコンポーネント分析
- **Context**: 再利用可能なコンポーネントの確認
- **Sources Consulted**: `apps/web/src/components/ui/*.tsx`, `apps/web/src/components/layout/*.tsx`
- **Findings**:
  - **既存プリミティブ**: Button, Input, Label, Card, Form, Skeleton, Separator, Sheet, Tooltip, Sidebar
  - **既存複合**: PasswordInput, TagBadge, EmptyState, ProgressBar, StudyCard, RatingButtons, FormAlert
  - **レイアウト**: AppSidebar, MobileNav, PageHeader - サイドバー/ヘッダー完備
  - 認証フォーム: LoginForm, SignupForm, ResetPasswordForm, UpdatePasswordForm - 認証UI完備
- **Implications**: 認証画面は既存フォームをそのまま使用可能。ホーム・カード入力・タグ・統計・設定画面のメインコンテンツ部分を新規実装する。

### ルーティング構造分析
- **Context**: App Router構造の確認
- **Sources Consulted**: `apps/web/src/app/**/*.tsx`
- **Findings**:
  - `(auth)/` グループ: login, signup, reset-password, update-password - 認証フロー完備
  - `(main)/` グループ: layout.tsx（認証ガード・サイドバー付き）、page.tsx（ダッシュボード）
  - 不足: cards/, cards/new, cards/[id]/edit, tags/, stats/, settings/
- **Implications**: (main)グループ配下に新規ページを追加する構成。

### HTMLモックコンポーネント構造分析
- **Context**: モックからのコンポーネント抽出
- **Sources Consulted**: `docs/screens/mock/v1/*.html`
- **Findings**:
  - `data-component`属性でReactコンポーネント境界が明示されている
  - `data-props`, `data-action`でpropsとイベントハンドラが記述されている
  - CSSクラス命名: BEM風（`.study-card__topbar`, `.rating-btn--ok`等）
- **Implications**: モックの`data-component`属性をそのままReactコンポーネント構造に変換可能。

### 型定義分析
- **Context**: 既存型との整合性確認
- **Sources Consulted**: `apps/web/src/types/*.ts`, `apps/web/src/validations/*.ts`
- **Findings**:
  - `Card`, `CardWithTags`, `CreateCardInput`, `UpdateCardInput` - カード型完備
  - `Tag`, `CreateTagInput`, `UpdateTagInput` - タグ型完備
  - `SubmitAssessmentInput`, `StudyStats` - 学習型完備
  - `TodayStats`, `DailyStats`, `SummaryStats` - 統計型完備
  - Zodスキーマ: `createCardSchema`, `updateCardSchema`, `cardQuerySchema`等
- **Implications**: 既存型をそのままpropsに使用可能。新規型定義は最小限。

## Architecture Pattern Evaluation

| Option | Description | Strengths | Risks / Limitations | Notes |
|--------|-------------|-----------|---------------------|-------|
| Feature-based | 機能ごとにcomponents/分離 | 変更が局所化、並列開発可能 | 共有コンポーネントが分散する可能性 | requirements.mdの機能分類と合致 |
| Layer-based | ui/features/layoutで分離 | 共有コンポーネントが集約 | 機能追加時に複数ディレクトリ変更 | 既存構造との整合性低い |

**選択**: Feature-based + 共有UIは既存`components/ui/`に集約

## Design Decisions

### Decision: コンポーネント配置構造
- **Context**: 10要件に渡る多数のコンポーネントの配置方針
- **Alternatives Considered**:
  1. 全てを`components/`直下にフラット配置
  2. 機能ドメインごとに`components/home/`, `components/tags/`等で分離
- **Selected Approach**: 機能ドメインごとのディレクトリ構造
- **Rationale**: 変更範囲が局所化され、並列開発時のコンフリクトを軽減
- **Trade-offs**: ディレクトリが増加するが、規模に見合った整理
- **Follow-up**: 共有UIは`components/ui/`、ページ固有は`components/{domain}/`

### Decision: Server Component vs Client Component境界
- **Context**: 最適なレンダリング境界の決定
- **Alternatives Considered**:
  1. ページ全体をClient Component化
  2. ページはServer、データ取得・インタラクションのみClient
- **Selected Approach**: ページはServer Component、フォーム・インタラクションはClient Component
- **Rationale**: Next.js App Routerのベストプラクティスに準拠
- **Trade-offs**: コンポーネント分割が増えるが、バンドルサイズ最適化に寄与
- **Follow-up**: `'use client'`は葉コンポーネントのみに付与

### Decision: フォームライブラリ
- **Context**: 既存のReact Hook Form + Zodパターンを継続
- **Selected Approach**: React Hook Form + Zod（既存認証フォームと同一）
- **Rationale**: 既存パターンとの一貫性、型安全なバリデーション
- **Follow-up**: 各フォームで`zodResolver`を使用

## Risks & Mitigations
- **Risk 1**: HTMLモックのCSSクラスとTailwindの差異 → モックのスタイルをTailwind + shadcn/uiに変換
- **Risk 2**: 統計グラフの実装（Recharts等のライブラリ依存） → シンプルなdiv棒グラフで初期実装、後でライブラリ追加可能
- **Risk 3**: モーダル/ダイアログの実装 → shadcn/ui Dialogを使用（未導入なら追加）

## References
- [Next.js App Router](https://nextjs.org/docs/app) - ルーティング・レイアウト構造
- [TanStack Query](https://tanstack.com/query/latest) - データフェッチパターン
- [shadcn/ui](https://ui.shadcn.com/) - UIコンポーネント
- [React Hook Form](https://react-hook-form.com/) - フォーム管理
