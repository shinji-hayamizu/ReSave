import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

import type { Database } from '@/types/database';
import type { CardWithTags } from '@/types/card';
import type { Tag } from '@/types/tag';
import { cardQuerySchema, createCardSchema } from '@/validations/card';

type CardRow = Database['public']['Tables']['cards']['Row'];
type TagRow = Database['public']['Tables']['tags']['Row'];
type CardTagRow = Database['public']['Tables']['card_tags']['Row'];

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
    const { searchParams } = request.nextUrl;

    const queryResult = cardQuerySchema.safeParse({
      limit: searchParams.get('limit'),
      offset: searchParams.get('offset'),
      tagId: searchParams.get('tagId'),
      status: searchParams.get('status'),
    });

    if (!queryResult.success) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'リクエストパラメータが不正です',
            details: queryResult.error.issues,
          },
        },
        { status: 400 }
      );
    }

    const { limit, offset, tagId, status } = queryResult.data;

    let query = supabase
      .from('cards')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status === 'new') {
      query = query.eq('status', 'new');
    } else if (status === 'due') {
      const now = new Date().toISOString();
      query = query.eq('status', 'active').lte('next_review_at', now);
    } else if (status === 'completed') {
      query = query.eq('status', 'completed');
    }

    const { data: cardsData, error: cardsError, count } = await query;

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

    let cards: CardWithTags[] = (cardsData || []).map(mapRowToCard);

    if (tagId) {
      const { data: cardTagsData, error: cardTagsError } = await supabase
        .from('card_tags')
        .select('card_id')
        .eq('tag_id', tagId);

      if (cardTagsError) {
        return NextResponse.json(
          {
            error: {
              code: 'DATABASE_ERROR',
              message: 'タグフィルタの適用に失敗しました',
            },
          },
          { status: 500 }
        );
      }

      const filteredCardIds = new Set(cardTagsData?.map((ct) => ct.card_id) || []);
      cards = cards.filter((card) => filteredCardIds.has(card.id));
    }

    const cardIds = cards.map((card) => card.id);

    if (cardIds.length > 0) {
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

        cards = cards.map((card) => ({
          ...card,
          tags: (cardTagsMap.get(card.id) || [])
            .map((tagId) => tagsMap.get(tagId))
            .filter((tag): tag is Tag => tag !== undefined),
        }));
      }
    }

    return NextResponse.json({
      data: cards,
      pagination: {
        total: count || 0,
        limit,
        offset,
      },
    });
  } catch (error) {
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

export async function POST(request: NextRequest) {
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
    const body = await request.json();

    const validationResult = createCardSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'リクエストボディが不正です',
            details: validationResult.error.issues,
          },
        },
        { status: 400 }
      );
    }

    const { front, back, tagIds } = validationResult.data;

    const { data: cardData, error: cardError } = await supabase
      .from('cards')
      .insert({
        user_id: user.id,
        front,
        back,
        schedule: [1, 3, 7, 14, 30, 90],
        current_step: 0,
        next_review_at: null,
        status: 'new',
      })
      .select()
      .single();

    if (cardError || !cardData) {
      return NextResponse.json(
        {
          error: {
            code: 'DATABASE_ERROR',
            message: 'カードの作成に失敗しました',
          },
        },
        { status: 500 }
      );
    }

    const card: CardWithTags = { ...mapRowToCard(cardData), tags: [] };

    if (tagIds && tagIds.length > 0) {
      const { data: tagsData, error: tagsError } = await supabase
        .from('tags')
        .select('*')
        .in('id', tagIds)
        .eq('user_id', user.id);

      if (tagsError) {
        return NextResponse.json(
          {
            error: {
              code: 'DATABASE_ERROR',
              message: 'タグの検証に失敗しました',
            },
          },
          { status: 500 }
        );
      }

      if (!tagsData || tagsData.length !== tagIds.length) {
        return NextResponse.json(
          {
            error: {
              code: 'VALIDATION_ERROR',
              message: '指定されたタグが存在しないか、アクセス権限がありません',
            },
          },
          { status: 400 }
        );
      }

      const { error: cardTagsError } = await supabase
        .from('card_tags')
        .insert(tagIds.map((tagId) => ({ card_id: card.id, tag_id: tagId })));

      if (cardTagsError) {
        return NextResponse.json(
          {
            error: {
              code: 'DATABASE_ERROR',
              message: 'タグの関連付けに失敗しました',
            },
          },
          { status: 500 }
        );
      }

      card.tags = tagsData.map(mapRowToTag);
    }

    return NextResponse.json(card, { status: 201 });
  } catch (error) {
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
