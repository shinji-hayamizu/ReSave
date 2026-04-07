'use server';

import { revalidatePath } from 'next/cache';

import type { Card, CardWithTags, CreateCardInput, UpdateCardInput, CardFilters, CardListResponse, HomeCardsData, HomeCardsPage } from '@/types/card';
import { DEFAULT_INTERVALS } from '@/types/review-schedule';
import { createCardSchema, updateCardSchema } from '@/validations/card';
import { createClient } from '@/lib/supabase/server';

interface SupabaseCardTag {
  tag: {
    id: string;
    user_id: string;
    name: string;
    color: string;
    created_at: string;
  };
}

interface SupabaseCardRow {
  id: string;
  user_id: string;
  front: string;
  back: string;
  schedule: number[];
  current_step: number;
  next_review_at: string | null;
  status: string;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  card_tags: SupabaseCardTag[];
}

function mapCardRow(card: SupabaseCardRow): CardWithTags {
  return {
    id: card.id,
    userId: card.user_id,
    front: card.front,
    back: card.back,
    schedule: card.schedule,
    currentStep: card.current_step,
    nextReviewAt: card.next_review_at,
    status: card.status as CardWithTags['status'],
    completedAt: card.completed_at,
    createdAt: card.created_at,
    updatedAt: card.updated_at,
    tags: card.card_tags.map((ct) => ({
      id: ct.tag.id,
      userId: ct.tag.user_id,
      name: ct.tag.name,
      color: ct.tag.color,
      createdAt: ct.tag.created_at,
    })),
  };
}

/**
 * カードを新規作成（タグ関連付けオプション付き）
 */
export async function createCard(input: CreateCardInput): Promise<Card> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('Unauthorized');
  }

  const validated = createCardSchema.parse(input);

  const schedule = validated.schedule || DEFAULT_INTERVALS;

  const { data: card, error } = await supabase
    .from('cards')
    .insert({
      user_id: user.id,
      front: validated.front,
      back: validated.back,
      schedule,
      current_step: 0,
      next_review_at: null,
      status: 'new',
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create card: ${error.message}`);
  }

  if (validated.tagIds && validated.tagIds.length > 0) {
    const cardTags = validated.tagIds.map((tagId) => ({
      card_id: card.id,
      tag_id: tagId,
    }));

    const { error: tagError } = await supabase
      .from('card_tags')
      .insert(cardTags);

    if (tagError) {
      throw new Error(`Failed to associate tags: ${tagError.message}`);
    }
  }

  revalidatePath('/cards');

  return {
    id: card.id,
    userId: card.user_id,
    front: card.front,
    back: card.back,
    schedule: card.schedule,
    currentStep: card.current_step,
    nextReviewAt: card.next_review_at,
    status: card.status,
    completedAt: card.completed_at,
    createdAt: card.created_at,
    updatedAt: card.updated_at,
  };
}

/**
 * 既存カードを更新
 */
export async function updateCard(id: string, input: UpdateCardInput): Promise<Card> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('Unauthorized');
  }

  const validated = updateCardSchema.parse(input);

  const { data: card, error } = await supabase
    .from('cards')
    .update({
      front: validated.front,
      back: validated.back,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update card: ${error.message}`);
  }

  if (validated.tagIds !== undefined) {
    const { error: deleteError } = await supabase
      .from('card_tags')
      .delete()
      .eq('card_id', id);

    if (deleteError) {
      throw new Error(`Failed to remove existing tags: ${deleteError.message}`);
    }

    if (validated.tagIds.length > 0) {
      const cardTags = validated.tagIds.map((tagId) => ({
        card_id: id,
        tag_id: tagId,
      }));

      const { error: insertError } = await supabase
        .from('card_tags')
        .insert(cardTags);

      if (insertError) {
        throw new Error(`Failed to associate tags: ${insertError.message}`);
      }
    }
  }

  revalidatePath('/cards');

  return {
    id: card.id,
    userId: card.user_id,
    front: card.front,
    back: card.back,
    schedule: card.schedule,
    currentStep: card.current_step,
    nextReviewAt: card.next_review_at,
    status: card.status,
    completedAt: card.completed_at,
    createdAt: card.created_at,
    updatedAt: card.updated_at,
  };
}

/**
 * カードを削除
 */
export async function deleteCard(id: string): Promise<void> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('Unauthorized');
  }

  const { error } = await supabase
    .from('cards')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    throw new Error(`Failed to delete card: ${error.message}`);
  }

  revalidatePath('/cards');
}

/**
 * IDでカードを1件取得
 */
export async function getCard(id: string): Promise<CardWithTags> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('Unauthorized');
  }

  const { data: card, error } = await supabase
    .from('cards')
    .select(`
      *,
      card_tags (
        tag:tags (*)
      )
    `)
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (error) {
    throw new Error(`Failed to fetch card: ${error.message}`);
  }

  return mapCardRow(card as unknown as SupabaseCardRow);
}

/**
 * カード一覧を取得（フィルター・ページネーション対応）
 */
export async function getCards(filters?: CardFilters): Promise<CardListResponse> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('Unauthorized');
  }

  const limit = filters?.limit || 20;
  const offset = filters?.offset || 0;

  let query = supabase
    .from('cards')
    .select(`
      *,
      card_tags (
        tag:tags (*)
      )
    `, { count: 'exact' })
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (filters?.status === 'new') {
    query = query.eq('status', 'new');
  } else if (filters?.status === 'due') {
    const today = new Date().toISOString();
    query = query.eq('status', 'active').lte('next_review_at', today);
  } else if (filters?.status === 'completed') {
    query = query.eq('status', 'completed');
  }

  if (filters?.tagId) {
    const { data: cardIds } = await supabase
      .from('card_tags')
      .select('card_id')
      .eq('tag_id', filters.tagId);

    if (cardIds && cardIds.length > 0) {
      const ids = cardIds.map((ct) => ct.card_id);
      query = query.in('id', ids);
    } else {
      return {
        data: [],
        pagination: {
          total: 0,
          limit,
          offset,
        },
      };
    }
  }

  const { data: cards, error, count } = await query;

  if (error) {
    throw new Error(`Failed to fetch cards: ${error.message}`);
  }

  const cardsWithTags: CardWithTags[] = (cards as unknown as SupabaseCardRow[]).map(mapCardRow);

  return {
    data: cardsWithTags,
    pagination: {
      total: count || 0,
      limit,
      offset,
    },
  };
}

/**
 * カードを未学習状態にリセット（覚え直し用）
 */
export async function resetCardToUnlearned(id: string): Promise<Card> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('Unauthorized');
  }

  const now = new Date();

  const { data: card, error } = await supabase
    .from('cards')
    .update({
      current_step: 0,
      next_review_at: null,
      status: 'new',
      completed_at: null,
      updated_at: now.toISOString(),
    })
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to reset card: ${error.message}`);
  }

  revalidatePath('/');
  revalidatePath('/cards');

  return {
    id: card.id,
    userId: card.user_id,
    front: card.front,
    back: card.back,
    schedule: card.schedule,
    currentStep: card.current_step,
    nextReviewAt: card.next_review_at,
    status: card.status,
    completedAt: card.completed_at,
    createdAt: card.created_at,
    updatedAt: card.updated_at,
  };
}

/**
 * 完了タブに表示するカードを取得
 * status = 'completed' のカードのみ（completed_at 降順）
 */
export async function getTodayCompletedCards(): Promise<CardWithTags[]> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('Unauthorized');
  }

  const { data, error } = await supabase
    .from('cards')
    .select(`
      *,
      card_tags (
        tag:tags (*)
      )
    `)
    .eq('user_id', user.id)
    .eq('status', 'completed')
    .order('completed_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch completed cards: ${error.message}`);
  }

  return ((data || []) as unknown as SupabaseCardRow[]).map(mapCardRow);
}

/**
 * 未学習（status='new'）のカードを取得
 */
export async function getNewCards(): Promise<CardWithTags[]> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('Unauthorized');
  }

  const { data: cards, error } = await supabase
    .from('cards')
    .select(`
      *,
      card_tags (
        tag:tags (*)
      )
    `)
    .eq('user_id', user.id)
    .eq('status', 'new')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch new cards: ${error.message}`);
  }

  return (cards as unknown as SupabaseCardRow[]).map(mapCardRow);
}

/**
 * ホーム画面用: 全カード + 今日の学習済みカードIDを1回で取得
 */
export async function getHomeCards(): Promise<HomeCardsData> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('Unauthorized');
  }

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [cardsResult, studyLogsResult] = await Promise.all([
    supabase
      .from('cards')
      .select(`
        *,
        card_tags (
          tag:tags (*)
        )
      `)
      .eq('user_id', user.id)
      .in('status', ['new', 'active'])
      .order('created_at', { ascending: false }),
    supabase
      .from('study_logs')
      .select('card_id')
      .eq('user_id', user.id)
      .gte('studied_at', todayStart.toISOString()),
  ]);

  if (cardsResult.error) {
    throw new Error(`Failed to fetch home cards: ${cardsResult.error.message}`);
  }

  if (studyLogsResult.error) {
    throw new Error(`Failed to fetch study logs: ${studyLogsResult.error.message}`);
  }

  const cards: CardWithTags[] = ((cardsResult.data || []) as unknown as SupabaseCardRow[]).map(mapCardRow);

  const todayStudiedCardIds = [...new Set(
    (studyLogsResult.data || []).map(log => log.card_id)
  )];

  return { cards, todayStudiedCardIds, fetchedAt: new Date().toISOString() };
}

/**
 * ホーム画面: 未学習(status='new')カードをページネーション取得
 */
export async function getHomeDueCards({ limit, offset }: { limit: number; offset: number }): Promise<HomeCardsPage> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('Unauthorized');
  }

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [cardsResult, studyLogsResult] = await Promise.all([
    supabase
      .from('cards')
      .select(`
        *,
        card_tags (
          tag:tags (*)
        )
      `, { count: 'exact' })
      .eq('user_id', user.id)
      .eq('status', 'new')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1),
    supabase
      .from('study_logs')
      .select('card_id')
      .eq('user_id', user.id)
      .gte('studied_at', todayStart.toISOString()),
  ]);

  if (cardsResult.error) {
    throw new Error(`Failed to fetch due cards: ${cardsResult.error.message}`);
  }

  if (studyLogsResult.error) {
    throw new Error(`Failed to fetch study logs: ${studyLogsResult.error.message}`);
  }

  const cards: CardWithTags[] = ((cardsResult.data || []) as unknown as SupabaseCardRow[]).map(mapCardRow);
  const total = cardsResult.count ?? 0;
  const todayStudiedCardIds = [...new Set(
    (studyLogsResult.data || []).map(log => log.card_id)
  )];

  return {
    cards,
    todayStudiedCardIds,
    fetchedAt: new Date().toISOString(),
    pagination: { total, limit, offset, hasMore: offset + limit < total },
  };
}

/**
 * ホーム画面: 復習予定(status='active' & next_review_at <= now)カードをページネーション取得
 */
export async function getHomeLearningCards({ limit, offset }: { limit: number; offset: number }): Promise<HomeCardsPage> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('Unauthorized');
  }

  const now = new Date().toISOString();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [cardsResult, studyLogsResult] = await Promise.all([
    supabase
      .from('cards')
      .select(`
        *,
        card_tags (
          tag:tags (*)
        )
      `, { count: 'exact' })
      .eq('user_id', user.id)
      .eq('status', 'active')
      .lte('next_review_at', now)
      .order('next_review_at', { ascending: true })
      .range(offset, offset + limit - 1),
    supabase
      .from('study_logs')
      .select('card_id')
      .eq('user_id', user.id)
      .gte('studied_at', todayStart.toISOString()),
  ]);

  if (cardsResult.error) {
    throw new Error(`Failed to fetch learning cards: ${cardsResult.error.message}`);
  }

  if (studyLogsResult.error) {
    throw new Error(`Failed to fetch study logs: ${studyLogsResult.error.message}`);
  }

  const cards: CardWithTags[] = ((cardsResult.data || []) as unknown as SupabaseCardRow[]).map(mapCardRow);
  const total = cardsResult.count ?? 0;
  const todayStudiedCardIds = [...new Set(
    (studyLogsResult.data || []).map(log => log.card_id)
  )];

  return {
    cards,
    todayStudiedCardIds,
    fetchedAt: new Date().toISOString(),
    pagination: { total, limit, offset, hasMore: offset + limit < total },
  };
}

/**
 * 今日復習予定のカードを取得
 */
export async function getTodayCards(): Promise<CardWithTags[]> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('Unauthorized');
  }

  const today = new Date().toISOString();

  const { data: cards, error } = await supabase
    .from('cards')
    .select(`
      *,
      card_tags (
        tag:tags (*)
      )
    `)
    .eq('user_id', user.id)
    .eq('status', 'active')
    .lte('next_review_at', today)
    .order('next_review_at', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch today's cards: ${error.message}`);
  }

  return (cards as unknown as SupabaseCardRow[]).map(mapCardRow);
}
