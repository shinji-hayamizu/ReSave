import { NextRequest, NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';
import { createTagSchema, tagQuerySchema } from '@/validations/tag';

export const dynamic = 'force-dynamic';

/**
 * タグ一覧取得エンドポイント (Mobile用)
 * GET /api/tags?limit=20&offset=0
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
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

    const { searchParams } = request.nextUrl;
    const queryValidation = tagQuerySchema.safeParse({
      limit: searchParams.get('limit'),
      offset: searchParams.get('offset'),
    });

    if (!queryValidation.success) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'パラメータが不正です',
            details: queryValidation.error.issues,
          },
        },
        { status: 400 }
      );
    }

    const { limit, offset } = queryValidation.data;

    const { data: tags, error: fetchError, count } = await supabase
      .from('tags')
      .select('*, card_count:card_tags(count)', { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (fetchError) {
      return NextResponse.json(
        {
          error: {
            code: 'DATABASE_ERROR',
            message: 'タグの取得に失敗しました',
          },
        },
        { status: 500 }
      );
    }

    const formattedTags = tags.map((tag) => ({
      id: tag.id,
      userId: tag.user_id,
      name: tag.name,
      color: tag.color,
      createdAt: tag.created_at,
      cardCount: Array.isArray(tag.card_count) ? tag.card_count.length : 0,
    }));

    return NextResponse.json({
      data: formattedTags,
      pagination: {
        total: count ?? 0,
        limit,
        offset,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'サーバーエラーが発生しました',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * タグ作成エンドポイント (Mobile用)
 * POST /api/tags
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
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

    const body = await request.json();
    const validation = createTagSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: '入力内容が不正です',
            details: validation.error.issues,
          },
        },
        { status: 400 }
      );
    }

    const { name, color } = validation.data;

    const { data: tag, error: createError } = await supabase
      .from('tags')
      .insert({
        user_id: user.id,
        name,
        color,
      })
      .select()
      .single();

    if (createError) {
      return NextResponse.json(
        {
          error: {
            code: 'DATABASE_ERROR',
            message: 'タグの作成に失敗しました',
          },
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        id: tag.id,
        userId: tag.user_id,
        name: tag.name,
        color: tag.color,
        createdAt: tag.created_at,
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'サーバーエラーが発生しました',
        },
      },
      { status: 500 }
    );
  }
}
