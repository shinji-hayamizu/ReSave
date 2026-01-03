'use server';

import { revalidatePath } from 'next/cache';

import type { CreateTagInput, Tag, UpdateTagInput } from '@/types/tag';
import { createClient } from '@/lib/supabase/server';
import { createTagSchema, updateTagSchema } from '@/validations/tag';

type TagWithCardCount = Tag & {
  cardCount: number;
};

/**
 * タグを新規作成
 */
export async function createTag(input: CreateTagInput): Promise<Tag> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('認証が必要です');
  }

  const validated = createTagSchema.parse(input);

  const { data, error } = await supabase
    .from('tags')
    .insert({
      user_id: user.id,
      name: validated.name,
      color: validated.color,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`タグの作成に失敗しました: ${error.message}`);
  }

  revalidatePath('/tags');
  revalidatePath('/cards');

  return {
    id: data.id,
    userId: data.user_id,
    name: data.name,
    color: data.color,
    createdAt: data.created_at,
  };
}

/**
 * 既存タグを更新
 */
export async function updateTag(id: string, input: UpdateTagInput): Promise<Tag> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('認証が必要です');
  }

  const validated = updateTagSchema.parse(input);

  const { data, error } = await supabase
    .from('tags')
    .update({
      name: validated.name,
      color: validated.color,
    })
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) {
    throw new Error(`タグの更新に失敗しました: ${error.message}`);
  }

  if (!data) {
    throw new Error('タグが見つかりません');
  }

  revalidatePath('/tags');
  revalidatePath('/cards');

  return {
    id: data.id,
    userId: data.user_id,
    name: data.name,
    color: data.color,
    createdAt: data.created_at,
  };
}

/**
 * タグを削除
 * 関連するcard_tagsレコードはCASCADE制約により自動削除される
 */
export async function deleteTag(id: string): Promise<void> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('認証が必要です');
  }

  const { error } = await supabase.from('tags').delete().eq('id', id).eq('user_id', user.id);

  if (error) {
    throw new Error(`タグの削除に失敗しました: ${error.message}`);
  }

  revalidatePath('/tags');
  revalidatePath('/cards');
}

/**
 * IDでタグを1件取得
 */
export async function getTag(id: string): Promise<Tag> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('認証が必要です');
  }

  const { data, error } = await supabase
    .from('tags')
    .select()
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (error) {
    throw new Error(`タグの取得に失敗しました: ${error.message}`);
  }

  if (!data) {
    throw new Error('タグが見つかりません');
  }

  return {
    id: data.id,
    userId: data.user_id,
    name: data.name,
    color: data.color,
    createdAt: data.created_at,
  };
}

/**
 * 現在ユーザーのタグ一覧をカード数付きで取得
 */
export async function getTags(): Promise<TagWithCardCount[]> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('認証が必要です');
  }

  const { data: tags, error: tagsError } = await supabase
    .from('tags')
    .select()
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (tagsError) {
    throw new Error(`タグ一覧の取得に失敗しました: ${tagsError.message}`);
  }

  const tagsWithCount = await Promise.all(
    tags.map(async (tag) => {
      const { count, error: countError } = await supabase
        .from('card_tags')
        .select('*', { count: 'exact', head: true })
        .eq('tag_id', tag.id);

      if (countError) {
        throw new Error(`カード数の取得に失敗しました: ${countError.message}`);
      }

      return {
        id: tag.id,
        userId: tag.user_id,
        name: tag.name,
        color: tag.color,
        createdAt: tag.created_at,
        cardCount: count ?? 0,
      };
    })
  );

  return tagsWithCount;
}
