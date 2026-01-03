# Project Structure

## Organization Philosophy

**Turborepo Monorepo** with apps-first organization. Each app is self-contained with its own dependencies while sharing backend infrastructure (Supabase).

## Directory Patterns

### Root Level
```
resave/
  apps/           # All applications
  docs/           # Project documentation
  supabase/       # Database migrations & config
  .kiro/          # Kiro specs and steering
```

### Web App (`apps/web/`)
**Technology**: Next.js 16 + App Router

```
apps/web/src/
  app/            # App Router pages & API routes
  components/     # React components
    ui/           # shadcn/ui primitives
  lib/            # Utilities, Supabase clients
  hooks/          # TanStack Query hooks
  actions/        # Server Actions
  types/          # TypeScript types (MASTER)
  validations/    # Zod schemas (MASTER)
```

**Key Pattern**: Server Components by default, `use client` only at leaf components.

### Admin App (`apps/admin/`)
**Technology**: Next.js 15

Separate admin dashboard with independent routing.

### Mobile App (`apps/mobile/`)
**Technology**: Expo 54 + Expo Router

```
apps/mobile/
  app/            # Expo Router pages
  components/     # React Native components
  lib/            # API client, Supabase
  hooks/          # TanStack Query hooks
  types/          # Copy from web/src/types/
  validations/    # Copy from web/src/validations/
```

**Key Pattern**: Fetches data via `apps/web/src/app/api/` routes.

## Naming Conventions

- **Files**: kebab-case for non-components, PascalCase for components
- **Components**: PascalCase (`CardList.tsx`)
- **Functions/Variables**: lowerCamelCase
- **Constants**: CONSTANT_CASE

## Import Organization

```typescript
// 1. External libraries
import { z } from 'zod';

// 2. Internal modules (path aliases)
import { supabase } from '@/lib/supabase/client';
import type { Card } from '@/types/card';
```

**Path Aliases (web)**:
- `@/` -> `apps/web/src/`

**Relative imports prohibited** for internal modules.

## Code Organization Principles

### Data Flow Patterns

**Web (Server Actions)**:
```
Component -> hooks/ -> actions/ (Server Actions) -> Supabase
```

**Mobile (API Routes)**:
```
Component -> hooks/ -> fetch('/api/...') -> API Routes -> Supabase
```

### Shared Code Management
- `apps/web/src/types/` and `apps/web/src/validations/` are **master**
- Changes must be manually copied to `apps/mobile/`
- No npm package extraction (over-engineering for solo project)

### Component Boundaries
- Server Components: Data fetching, layout
- Client Components: Interactivity, forms, state

---
_Document patterns, not file trees. New files following patterns shouldn't require updates_
