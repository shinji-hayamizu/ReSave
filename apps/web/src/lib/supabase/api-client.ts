import { NextRequest } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

import type { Database } from '@/types/database';
import type { CardWithTags } from '@/types/card';
import type { Tag } from '@/types/tag';

export type CardRow = Database['public']['Tables']['cards']['Row'];
type TagRow = Database['public']['Tables']['tags']['Row'];

export function mapRowToCard(row: CardRow): CardWithTags {
  return {
    id: row.id,
    userId: row.user_id,
    front: row.front,
    back: row.back,
    sourceUrl: row.source_url,
    schedule: row.schedule,
    currentStep: row.current_step,
    nextReviewAt: row.next_review_at,
    status: row.status,
    completedAt: row.completed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    tags: [],
  };
}

export function mapRowToTag(row: TagRow): Tag {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    color: row.color,
    createdAt: row.created_at,
  };
}

export function createAuthenticatedClient(token: string) {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    }
  );
}

export async function authenticateRequest(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.split(' ')[1];
  const supabase = createAuthenticatedClient(token);

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return { user, supabase };
}
