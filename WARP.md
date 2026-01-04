# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project overview

ReSave is a spaced-repetition (SRS) flashcard application based on the forgetting curve. The repo is a pnpm + Turborepo-style monorepo with three apps and shared infrastructure:

- `apps/web`: Main user-facing web app built with Next.js 16 (App Router, React 19, Tailwind, shadcn/ui).
- `apps/admin`: Separate Next.js 15 app for an admin dashboard (currently minimal BBS/Admin placeholder).
- `apps/mobile`: Expo React Native app that will consume the web app's API and share domain concepts.
- `supabase/`: Database schema, migrations, and configuration.
- `docs/`: Full system/requirements documentation (see especially `docs/requirements/architecture.md`).

Conceptually, Web and Mobile are clients of the same Supabase backend. Web primarily uses Next.js Server Components + Server Actions; Mobile uses REST calls into the web app's API (once implemented) and/or Supabase directly.

## Install, run, and common commands

All commands assume pnpm (see `packageManager` in root `package.json`). Run them from the repo root unless noted.

### Install dependencies

- Install workspace dependencies:
  - `pnpm install`

### Web app (`apps/web`)

**Dev server**

- Via Turbo from root (recommended for day-to-day):
  - `pnpm dev:web` → runs `apps/web` on port 3000.
- Directly in the app:
  - `cd apps/web && pnpm dev`

**Build & start**

- Build only: `cd apps/web && pnpm build`
- Production start (after build): `cd apps/web && pnpm start`

**Linting**

- Lint web app: `cd apps/web && pnpm lint`

**Tests (Vitest + Playwright)**

- All unit/component tests (Vitest):
  - `cd apps/web && pnpm test`
- Vitest UI: 
  - `cd apps/web && pnpm test:ui`
- Coverage run:
  - `cd apps/web && pnpm test:coverage`
- E2E tests (Playwright):
  - `cd apps/web && pnpm test:e2e`

**Running a single test**

Vitest is the test runner; you can scope by file path and/or test name:

- Single test file, e.g. the utils tests:
  - `cd apps/web && pnpm test src/__tests__/lib/utils.test.ts`
- Single test or describe block by name:
  - `cd apps/web && pnpm test -- -t "test name substring"`

**Supabase connectivity checks**

The project includes a dedicated Supabase health-check script wired into the web app:

- Using the `apps/web` package scripts (uses `NEXT_PUBLIC_SUPABASE_*` from environment):
  - `cd apps/web && pnpm check:supabase`  (checks current env vars)
  - `cd apps/web && pnpm check:supabase:local`  (targets a local `supabase start` instance)
- Running the script directly from the repo root (equivalent logic):
  - `npx tsx scripts/check-supabase.ts`        (env-based)
  - `npx tsx scripts/check-supabase.ts --local` (local Supabase defaults)

If required env vars are missing, the script will print a diagnostic summary and exit non‑zero.

### Admin app (`apps/admin`)

The admin app is a separate Next.js 15 app.

- Dev: `cd apps/admin && pnpm dev` (port 3001 by default)
- Build: `cd apps/admin && pnpm build`
- Start: `cd apps/admin && pnpm start`
- Lint: `cd apps/admin && pnpm lint`

You can also start it via Turbo:

- `pnpm dev:admin`

### Mobile app (`apps/mobile`)

The mobile app is an Expo project (React Native + Expo Router + TanStack Query).

From the repo root:

- Dev (Turbo → `expo start`):
  - `pnpm dev:mobile`

Or directly inside the app:

- `cd apps/mobile && pnpm install`
- `cd apps/mobile && pnpm start` (alias for `expo start` via `package.json`)
- Platform-specific shortcuts:
  - `cd apps/mobile && pnpm android`
  - `cd apps/mobile && pnpm ios`
  - `cd apps/mobile && pnpm web`

### Workspace-level scripts (Turbo)

From `package.json` at the repo root:

- Run all builds: `pnpm build` (Turbo orchestrates `build` in each app).
- Run all linters: `pnpm lint` (delegates to app-level `lint` scripts).

## Environment configuration

Environment variables are primarily app-scoped; use the examples below when wiring up Supabase and local dev.

### Web app (`apps/web/.env.local`)

- `NEXT_PUBLIC_SUPABASE_URL` – Supabase project URL.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` – Supabase anon key.

The architecture docs also mention a potential server-only service role key; if you add it, keep it server-only and do not expose it to client bundles.

The Supabase check script (`pnpm check:supabase`) reads `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to verify connectivity and RLS behavior.

### Mobile app (`apps/mobile/.env`)

See `apps/mobile/.env.example`:

- `EXPO_PUBLIC_API_URL` – Base URL for the web app API (typically `http://localhost:3000` in dev).
- `EXPO_PUBLIC_SUPABASE_URL` – Supabase project URL.
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` – Supabase anon key.

These are used by `apps/mobile/lib/api/client.ts` and `apps/mobile/lib/supabase.ts` to talk to the same backend as the web app.

## High-level architecture

For a thorough, canonical description, see `docs/requirements/architecture.md`. This section summarizes the parts that show up directly in the current code layout.

### System-level view

- **Clients**
  - `apps/web`: Next.js 16 web client (App Router, server-first).
  - `apps/mobile`: Expo app using Expo Router; will consume REST endpoints exposed from the web app.
  - `apps/admin`: Separate Next.js instance for admin-facing pages.
- **Backend**
  - Supabase (PostgreSQL + Auth + Storage) holds all core domain data: users, cards, tags, study logs, etc.
  - Row-Level Security (RLS) ensures each user only accesses their own data.
- **Hosting/CI (from docs)**
  - Web is designed to run on Vercel with GitHub Actions CI (lint → typecheck → test → build → deploy). See `docs/infrastructure/ci-cd.md` for pipeline details.

### Web app architecture (`apps/web`)

Key directories under `apps/web/src`:

- `app/`
  - Next.js App Router entry. `layout.tsx` wires fonts and global providers (`<Providers>` + `<Toaster>`).
  - `(main)/page.tsx` is the main dashboard page. It is a client component that:
    - Uses `useTodayCards` from `hooks/useCards` to fetch today's cards.
    - Categorizes them into `due`, `learning`, and `completed` buckets.
    - Renders high-level dashboard UI via `components/home` (e.g., `HomeStudyCard`, `CardTabs`, `QuickInputForm`).
  - `(auth)/layout.tsx` defines a minimal auth layout wrapper for login/signup-related pages.
- `components/`
  - `components/home/*`: Dashboard-specific components (study card UI, quick-add form, tabs, list, etc.).
  - `components/cards/*`, `components/tags/*`, `components/stats/*`, `components/settings/*`: Feature-specific UI building blocks.
  - `components/layout/*`: Shell layout (header, sidebar, mobile nav, page header).
  - `components/ui/*`: Shadcn-style design system primitives (button, card, dialogs, inputs, skeletons, toaster, etc.).
  - `components/providers.tsx`: Top-level React providers (theme, React Query, etc.) used by `app/layout.tsx`.
- `lib/`
  - `lib/supabase/client.ts` / `lib/supabase/server.ts`: Supabase client helpers for browser and server contexts.
  - `lib/utils.ts`: Utility helpers (string/number/date helpers used across the app).
- `actions/`
  - Server Actions grouped by domain: `cards.ts`, `tags.ts`, `study.ts`, `stats.ts`, `auth.ts`.
  - Encapsulate all write-side behavior and some reads, and handle cache invalidation (e.g. via `revalidatePath`).
- `hooks/`
  - React Query hooks that orchestrate data fetching and mutation for each domain:
    - `useCards.ts`, `useTags.ts`, `useStudy.ts`, `useStats.ts`, `useAuth.ts`, plus mobile-specific helper `use-mobile.tsx`.
  - Tests for hooks live in `hooks/__tests__`.
- `types/`
  - TypeScript domain models and API shapes: `card.ts`, `tag.ts`, `study-log.ts`, `user.ts`, `database.ts`, `api.ts`, and barrel `index.ts`.
  - These represent the canonical in-app view of the Supabase schema.
- `validations/`
  - Zod schemas for input validation: `card.ts`, `tag.ts`, `user.ts`, `study-log.ts`, with `index.ts` as an entry point.
  - Tests for core validation rules live under `validations/__tests__/`.
- `__tests__/`
  - App-level or lib-level tests, e.g. `__tests__/lib/utils.test.ts` and validation tests.

**Web-side data flow (current pattern)**

- Components import domain-specific hooks from `src/hooks`.
- Hooks use TanStack Query to fetch from either:
  - Supabase directly via `lib/supabase/server`/`client`, or
  - Server Actions exposed in `src/actions`.
- Zod schemas (`src/validations`) and TypeScript types (`src/types`) ensure consistent shapes for data passing between UI, hooks, actions, and Supabase.

### Mobile app architecture (`apps/mobile`)

The mobile app mirrors the web app's domain and is progressively built out to use the web API and shared concepts.

Key directories under `apps/mobile`:

- `app/`
  - `_layout.tsx` sets up the React Query client and Expo Router `Stack`.
  - `index.tsx` is a simple home screen (currently BBS Mobile placeholder text).
- `components/`
  - `components/ui/*`: Reusable UI primitives adapted for React Native (button, input, study card, tag badge, etc.).
  - `components/cards/*`: Card-specific mobile UI such as `MobileCardList`.
- `lib/`
  - `lib/api/client.ts`: Centralized HTTP client for talking to the web API (using `EXPO_PUBLIC_API_URL`).
  - `lib/supabase.ts`: Supabase client/auth helpers for the mobile app.
  - `lib/cn.ts`: Class name / style utility.
- `constants/`
  - Default constants such as API base URL configuration.
- `types/`
  - Domain types for cards, tags, and API payloads (`api.ts`, `card.ts`, `tag.ts`). These should stay aligned with `apps/web/src/types`.

As the API routes in the web app are implemented, the intended flow (from `docs/requirements/architecture.md`) is:

- Mobile screen → React Query hooks (once added) → `lib/api/client.ts` → `apps/web` API routes → Supabase.

When making cross-cutting domain changes (e.g. new card fields), update both the web and mobile type/validation definitions together.

### Supabase and data model (`supabase/`)

Supabase is the single source of truth for all persistent data. The schema is defined in SQL migrations under `supabase/migrations/` (see `20260103161530_init.sql` as the base) and documented more extensively in `docs/requirements/architecture.md`.

Core tables (from the docs):

- `cards`: User-owned flashcards (`front`, `back`, `review_level`, `next_review_at`, timestamps).
- `tags`: User-owned labels for cards (name, color, created_at).
- `card_tags`: Join table implementing many-to-many between cards and tags.
- `study_logs`: Records of individual study events (`assessment`, `studied_at`).

Row Level Security policies are configured so that:

- Users can only CRUD their own `cards`, `tags`, `card_tags`, and `study_logs`.
- RLS is also what the Supabase check script verifies when it tests DB access.

## Domain-specific behavior

The spaced-repetition logic and domain rules are important to keep consistent across web, mobile, and database layers. Key points from `CLAUDE.md` and `docs/requirements/architecture.md`:

### Review schedule

- Fixed intervals (in days): `1, 3, 7, 14, 30, 180`.
- `review_level` and `next_review_at` drive when a card appears again.

From the docs:

- `review_level: 0 → 1日後`
- `review_level: 1 → 3日後`
- `review_level: 2 → 7日後`
- `review_level: 3 → 14日後`
- `review_level: 4 → 30日後`
- `review_level: 5 → 180日後`
- After the final level, `next_review_at` becomes `NULL` and the card is considered complete.

The home dashboard (`(main)/page.tsx`) uses a local `REVIEW_INTERVALS` array and `getNextInterval` helper to present next-interval labels in the UI; server-side logic in Supabase/actions should remain consistent with this schedule.

### Assessment outcomes

User answers map to changes in `review_level` and `next_review_at`:

- **`ok`**: Increment `review_level` by 1 and set `next_review_at` to the corresponding interval.
- **`again`**: Reset `review_level` to 0 (shortest interval).
- **`remembered`**: Mark as complete by setting `next_review_at = NULL`.

These rules are enforced in the server-side logic (Server Actions / API handlers) and assumed by the front-end categorization logic.

## Shared code and cross-app conventions

There is a strong convention that the web app defines the canonical domain model and validation rules, and other surfaces (especially mobile) stay in sync with it:

- Treat `apps/web/src/types` and `apps/web/src/validations` as the source of truth for domain types and Zod schemas.
- When you add or change fields on core entities (cards, tags, users, study logs):
  - Update the TypeScript types in `apps/web/src/types/*`.
  - Update the Zod schemas in `apps/web/src/validations/*`.
  - Mirror equivalent changes in `apps/mobile/types/*` (and any mobile validations, as they are added).
  - Verify that related Supabase migration(s) under `supabase/migrations` still align with the code-level types.

The older docs mention manually copying from `web/src/types` to `mobile/types`; in this repo layout, those directories are under `apps/web` and `apps/mobile` respectively, but the intent is the same.

## Documentation map

For deeper context beyond what is encoded directly in the code:

- `CLAUDE.md` – High-level project summary, app list (web/admin/mobile), quick commands, data flow summary, environment variables, and review scheduling rules.
- `docs/README.md` – Entry point to the full documentation set (requirements, domain, DB, API, screens, auth, infra, security, testing, operations).
- `docs/requirements/architecture.md` – Detailed system architecture, directory roles, data flow patterns, RLS policies, and testing strategy. Use this as the canonical reference when making significant architectural or schema changes.
- `docs/screens/mock/sample/README.md` – Design patterns for the dashboard UI (useful if you’re working on front-end appearance or UX).

When working on substantial changes (new features, schema updates, or infra changes), consult the relevant `docs/**` file first, then ensure implementation in `apps/*` and `supabase/` stays aligned with those documents.
