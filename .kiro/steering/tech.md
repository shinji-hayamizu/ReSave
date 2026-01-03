# Technology Stack

## Architecture

**Turborepo Monorepo** with three independent apps sharing a common backend (Supabase).

| App | Technology | Port | Purpose |
|-----|------------|------|---------|
| web | Next.js 16 | 3000 | Main app + Mobile API |
| admin | Next.js 15 | 3001 | Admin dashboard |
| mobile | Expo 54 | - | Mobile app |

## Core Technologies

- **Language**: TypeScript 5.x (strict mode)
- **Runtime**: Node.js 20+
- **Package Manager**: pnpm 9.x
- **Monorepo Tool**: Turborepo

### Web (Next.js 16)
- React 19 with Server Components
- App Router (Server-first approach)
- Tailwind CSS 3.x + shadcn/ui
- TanStack Query for data fetching
- Zod for validation
- PWA support via @serwist/next

### Mobile (Expo 54)
- Expo Router (file-based routing)
- NativeWind (Tailwind for React Native)
- TanStack Query for data fetching
- Fetches data from web's API Routes

### Backend (Supabase)
- PostgreSQL with Row Level Security (RLS)
- Supabase Auth (Cookie-based SSR)
- Storage for future image attachments

## Development Standards

### Type Safety
- TypeScript strict mode enabled
- No `any` usage (use `unknown` with type guards)
- Zod for runtime validation

### Code Quality
- ESLint + Prettier for consistency
- Named exports only (no default exports in custom modules)
- ES Modules only (no `namespace`, no `require`)

### Testing
- **Unit**: Vitest (coverage target: 80%+)
- **Component**: Testing Library
- **E2E**: Playwright

## Common Commands

```bash
# Root level (Turborepo)
pnpm dev:web      # Start web dev server
pnpm dev:admin    # Start admin dev server
pnpm dev:mobile   # Start Expo dev server

# apps/web
pnpm test         # Run Vitest
pnpm test:e2e     # Run Playwright
```

## Key Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| UI Library | shadcn/ui | Copy-paste customization, small bundle |
| Auth | Supabase Auth | Integrated with DB/Storage, SSR-friendly |
| Data Fetching | TanStack Query | Caching, mutations, optimistic updates |
| State (client) | Zustand | Lightweight, TypeScript-friendly |
| Forms | React Hook Form + Zod | Validation + type inference |

---
_Document standards and patterns, not every dependency_
