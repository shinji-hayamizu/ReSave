import { NextRequest, NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';
import { updateTagSchema } from '@/validations/tag';

export const dynamic = 'force-dynamic';

type RouteParams = {
  params: Promise<{ id: string }>;
};

/**
 * タグ詳細取得 (Mobile用)
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
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

    const { id } = await params;

    const { data: tag, error: fetchError } = await supabase
      .from('tags')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !tag) {
      return NextResponse.json(
        {
          error: {
            code: 'NOT_FOUND',
            message: 'タグが見つかりません',
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: tag.id,
      userId: tag.user_id,
      name: tag.name,
      color: tag.color,
      createdAt: tag.created_at,
    });
  } catch {
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
 * タグ更新 (Mobile用)
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
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

    const { id } = await params;

    const { data: existingTag } = await supabase
      .from('tags')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (!existingTag) {
      return NextResponse.json(
        {
          error: {
            code: 'NOT_FOUND',
            message: 'タグが見つかりません',
          },
        },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validation = updateTagSchema.safeParse(body);

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

    const { data: updatedTag, error: updateError } = await supabase
      .from('tags')
      .update(validation.data)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError || !updatedTag) {
      return NextResponse.json(
        {
          error: {
            code: 'DATABASE_ERROR',
            message: 'タグの更新に失敗しました',
          },
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      id: updatedTag.id,
      userId: updatedTag.user_id,
      name: updatedTag.name,
      color: updatedTag.color,
      createdAt: updatedTag.created_at,
    });
  } catch {
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
 * タグ削除 (Mobile用)
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
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

    const { id } = await params;

    const { data: existingTag } = await supabase
      .from('tags')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (!existingTag) {
      return NextResponse.json(
        {
          error: {
            code: 'NOT_FOUND',
            message: 'タグが見つかりません',
          },
        },
        { status: 404 }
      );
    }

    const { error: deleteError } = await supabase
      .from('tags')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (deleteError) {
      return NextResponse.json(
        {
          error: {
            code: 'DATABASE_ERROR',
            message: 'タグの削除に失敗しました',
          },
        },
        { status: 500 }
      );
    }

    return new NextResponse(null, { status: 204 });
  } catch {
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
