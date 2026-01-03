# API Standards

> Project memory for ReSave API design patterns and decisions.
>
> Detailed implementation patterns: `.claude/rules/next/api-design.md`
>
> Last updated: 2025-01-03

---

## Philosophy

- **Server-first**: Prefer Server Actions over API Routes for Web
- **Mobile via REST**: API Routes exist primarily for Expo mobile app
- **Supabase RLS**: Let the database enforce access control
- **Zod everywhere**: Validate at boundaries (actions, routes)

---

## Data Flow Patterns

### Web (Next.js)

```
Component -> hooks/use*.ts -> actions/*.ts (Server Action) -> Supabase
```

- Server Actions handle mutations (`'use server'`)
- TanStack Query wraps Server Actions via `useMutation`
- `revalidatePath()` for cache invalidation

### Mobile (Expo)

```
Component -> hooks/use*.ts -> lib/api/client.ts -> fetch('/api/...') -> API Route -> Supabase
```

- REST API at `/api/*` for mobile consumption
- Bearer token authentication via Supabase Auth
- Same TanStack Query patterns as Web

---

## API Route Location

```
app/api/
  cards/
    route.ts           # GET (list), POST (create)
    today/route.ts     # GET (today's review cards)
    [id]/route.ts      # GET, PATCH, DELETE
  tags/
    route.ts           # GET (list), POST (create)
    [id]/route.ts      # GET, PATCH, DELETE
  study/
    route.ts           # POST (submit assessment)
```

Pattern: `/{resource}` for collections, `/{resource}/[id]` for items.

---

## Authentication

### Web (Cookie-based)

- `@supabase/ssr` handles cookies automatically
- Middleware refreshes tokens on each request
- Server Actions access authenticated user via `createServerClient()`

### Mobile (Bearer Token)

```typescript
// Mobile sends token
Authorization: Bearer {supabase_access_token}

// API Route validates
const authHeader = request.headers.get('Authorization');
const token = authHeader?.split(' ')[1];
const supabase = createClient(url, anonKey, {
  global: { headers: { Authorization: `Bearer ${token}` } }
});
```

RLS policies enforce user-scoped data access.

---

## Request/Response Format

### Success (Collection)

```json
{
  "data": [...],
  "pagination": { "total": 100, "limit": 20, "offset": 0 }
}
```

### Success (Single Item)

```json
{ "id": "...", "front": "...", "back": "...", ... }
```

### Error

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Front text is required",
    "field": "front"
  }
}
```

---

## HTTP Status Codes

| Code | Usage |
|------|-------|
| 200 | Success (GET, PATCH) |
| 201 | Created (POST) |
| 204 | Deleted (DELETE, no body) |
| 400 | Bad request (malformed) |
| 401 | Unauthorized (no/invalid token) |
| 404 | Resource not found |
| 422 | Validation error |
| 500 | Server error |

---

## Validation Pattern

```typescript
// validations/card.ts
import { z } from 'zod';

export const createCardSchema = z.object({
  front: z.string().min(1).max(2000),
  back: z.string().min(1).max(5000),
  tagIds: z.array(z.string().uuid()).optional(),
});

// In API Route or Server Action
const result = createCardSchema.safeParse(body);
if (!result.success) {
  return NextResponse.json({
    error: { code: 'VALIDATION_ERROR', message: result.error.issues[0].message }
  }, { status: 422 });
}
```

---

## TanStack Query Keys

```typescript
// hooks/useCards.ts
export const cardKeys = {
  all: ['cards'] as const,
  lists: () => [...cardKeys.all, 'list'] as const,
  list: (filters: CardFilters) => [...cardKeys.lists(), filters] as const,
  today: () => [...cardKeys.all, 'today'] as const,
  detail: (id: string) => [...cardKeys.all, 'detail', id] as const,
};
```

Convention: Hierarchical keys for granular invalidation.

---

## Server Action Pattern

```typescript
// actions/cards.ts
'use server';

import { createServerClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { createCardSchema } from '@/validations/card';

export async function createCard(input: unknown) {
  const parsed = createCardSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from('cards')
    .insert(parsed.data)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };

  revalidatePath('/cards');
  return { ok: true, data };
}
```

---

## Key Decisions

| Decision | Rationale |
|----------|-----------|
| Server Actions for Web | Direct DB access, no REST overhead, type-safe |
| REST API for Mobile | Expo cannot call Server Actions directly |
| No API versioning | Single client (mobile app), can update simultaneously |
| Supabase RLS | Security at DB layer, not app layer |
| Zod for validation | Shared schemas between Web and Mobile |

---

## Anti-patterns

- Direct `fetch('/api/...')` from Web components (use Server Actions)
- Skipping Zod validation in Server Actions
- Returning raw Supabase errors to clients
- Hardcoding user_id (rely on RLS with `auth.uid()`)
