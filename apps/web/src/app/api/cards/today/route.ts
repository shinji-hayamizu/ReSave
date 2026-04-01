import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

import type { Database } from '@/types/database';
import type { CardWithTags } from '@/types/card';
import type { Tag } from '@/types/tag';

type CardRow = Database['public']['Tables']['cards']['Row'];
type TagRow = Database['public']['Tables']['tags']['Row'];

function mapRowToCard(row: CardRow): CardWithTags {
  return {
    id: row.id,
    userId: row.user_id,
    front: row.front,
    back: row.back,
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

function mapRowToTag(row: TagRow): Tag {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    color: row.color,
    createdAt: row.created_at,
  };
}

function createAuthenticatedClient(token: string) {
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

async function authenticateRequest(request: NextRequest) {
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

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) {
      return NextResponse.json(
        {
          error: {
            code: 'UNAUTHORIZED',
            message: '認証が必要です',
          },
        },
        { status: 401 }
      );
    }

    const { user, supabase } = auth;
    const now = new Date().toISOString();

    const { data: cardsData, error: cardsError } = await supabase
      .from('cards')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .not('next_review_at', 'is', null)
      .lte('next_review_at', now)
      .order('next_review_at', { ascending: true });

    if (cardsError) {
      return NextResponse.json(
        {
          error: {
            code: 'DATABASE_ERROR',
            message: 'カードの取得に失敗しました',
          },
        },
        { status: 500 }
      );
    }

    const cards: CardWithTags[] = (cardsData || []).map(mapRowToCard);

    if (cards.length === 0) {
      return NextResponse.json({
        data: [],
        pagination: {
          total: 0,
          limit: 0,
          offset: 0,
        },
      });
    }

    const cardIds = cards.map((card) => card.id);

    const { data: cardTagsData, error: cardTagsError } = await supabase
      .from('card_tags')
      .select('card_id, tag_id')
      .in('card_id', cardIds);

    if (cardTagsError) {
      return NextResponse.json(
        {
          error: {
            code: 'DATABASE_ERROR',
            message: 'タグ情報の取得に失敗しました',
          },
        },
        { status: 500 }
      );
    }

    const tagIds = Array.from(new Set(cardTagsData?.map((ct) => ct.tag_id) || []));

    if (tagIds.length > 0) {
      const { data: tagsData, error: tagsError } = await supabase
        .from('tags')
        .select('*')
        .in('id', tagIds);

      if (tagsError) {
        return NextResponse.json(
          {
            error: {
              code: 'DATABASE_ERROR',
              message: 'タグ情報の取得に失敗しました',
            },
          },
          { status: 500 }
        );
      }

      const tagsMap = new Map<string, Tag>(
        (tagsData || []).map((tag) => [tag.id, mapRowToTag(tag)])
      );

      const cardTagsMap = new Map<string, string[]>();
      (cardTagsData || []).forEach((ct) => {
        if (!cardTagsMap.has(ct.card_id)) {
          cardTagsMap.set(ct.card_id, []);
        }
        cardTagsMap.get(ct.card_id)!.push(ct.tag_id);
      });

      cards.forEach((card) => {
        card.tags = (cardTagsMap.get(card.id) || [])
          .map((tagId) => tagsMap.get(tagId))
          .filter((tag): tag is Tag => tag !== undefined);
      });
    }

    return NextResponse.json({
      data: cards,
      pagination: {
        total: cards.length,
        limit: cards.length,
        offset: 0,
      },
    });
  } catch {
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: '予期しないエラーが発生しました',
        },
      },
      { status: 500 }
    );
  }
}
