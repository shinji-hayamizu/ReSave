import { NextRequest, NextResponse } from 'next/server';

import type { CardWithTags } from '@/types/card';
import { authenticateRequest, mapRowToCard, mapRowToTag, type CardRow } from '@/lib/supabase/api-client';
import { updateCardSchema } from '@/validations/card';

type Params = Promise<{ id: string }>;



export async function GET(request: NextRequest, { params }: { params: Params }) {
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
    const { id } = await params;

    const { data: cardData, error: cardError } = await supabase
      .from('cards')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (cardError || !cardData) {
      return NextResponse.json(
        {
          error: {
            code: 'NOT_FOUND',
            message: 'カードが見つかりません',
          },
        },
        { status: 404 }
      );
    }

    const card: CardWithTags = { ...mapRowToCard(cardData), tags: [] };

    const { data: cardTagsData, error: cardTagsError } = await supabase
      .from('card_tags')
      .select('tag_id')
      .eq('card_id', card.id);

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

    const tagIds = (cardTagsData || []).map((ct) => ct.tag_id);

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

      card.tags = (tagsData || []).map(mapRowToTag);
    }

    return NextResponse.json(card);
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

export async function PATCH(request: NextRequest, { params }: { params: Params }) {
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
    const { id } = await params;
    const body = await request.json();

    const validationResult = updateCardSchema.safeParse(body);
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

    const { front, back, tagIds, sourceUrl } = validationResult.data;

    const { data: existingCard, error: existingError } = await supabase
      .from('cards')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (existingError || !existingCard) {
      return NextResponse.json(
        {
          error: {
            code: 'NOT_FOUND',
            message: 'カードが見つかりません',
          },
        },
        { status: 404 }
      );
    }

    const updateData: Partial<CardRow> = {};
    if (front !== undefined) updateData.front = front;
    if (back !== undefined) updateData.back = back;
    if (sourceUrl !== undefined) updateData.source_url = sourceUrl || null;

    if (Object.keys(updateData).length > 0) {
      updateData.updated_at = new Date().toISOString();

      const { data: cardData, error: cardError } = await supabase
        .from('cards')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (cardError || !cardData) {
        return NextResponse.json(
          {
            error: {
              code: 'DATABASE_ERROR',
              message: 'カードの更新に失敗しました',
            },
          },
          { status: 500 }
        );
      }
    }

    const { data: updatedCardData, error: updatedCardError } = await supabase
      .from('cards')
      .select('*')
      .eq('id', id)
      .single();

    if (updatedCardError || !updatedCardData) {
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

    const card: CardWithTags = { ...mapRowToCard(updatedCardData), tags: [] };

    if (tagIds !== undefined) {
      const { error: deleteError } = await supabase
        .from('card_tags')
        .delete()
        .eq('card_id', card.id);

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

      if (tagIds.length > 0) {
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

        const { error: insertError } = await supabase
          .from('card_tags')
          .insert(tagIds.map((tagId) => ({ card_id: card.id, tag_id: tagId })));

        if (insertError) {
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
    } else {
      const { data: cardTagsData, error: cardTagsError } = await supabase
        .from('card_tags')
        .select('tag_id')
        .eq('card_id', card.id);

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

      const tagIds = (cardTagsData || []).map((ct) => ct.tag_id);

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

        card.tags = (tagsData || []).map(mapRowToTag);
      }
    }

    return NextResponse.json(card);
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

export async function DELETE(request: NextRequest, { params }: { params: Params }) {
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
    const { id } = await params;

    const { data: existingCard, error: existingError } = await supabase
      .from('cards')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (existingError || !existingCard) {
      return NextResponse.json(
        {
          error: {
            code: 'NOT_FOUND',
            message: 'カードが見つかりません',
          },
        },
        { status: 404 }
      );
    }

    const { error: deleteError } = await supabase
      .from('cards')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (deleteError) {
      return NextResponse.json(
        {
          error: {
            code: 'DATABASE_ERROR',
            message: 'カードの削除に失敗しました',
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
          message: '予期しないエラーが発生しました',
        },
      },
      { status: 500 }
    );
  }
}
