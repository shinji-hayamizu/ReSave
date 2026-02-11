import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import { createElement } from 'react';

import type { Card, CardWithTags, HomeCardsData } from '@/types/card';
import {
  homeCardKeys,
  useHomeCards,
  useHomeCreateCard,
  useHomeUpdateCard,
  useHomeDeleteCard,
  useHomeResetCard,
  useHomeSubmitAssessment,
} from '../useHomeCards';

const mockGetHomeCards = vi.fn();
const mockCreateCard = vi.fn();
const mockUpdateCard = vi.fn();
const mockDeleteCard = vi.fn();
const mockResetCardToUnlearned = vi.fn();
const mockSubmitAssessment = vi.fn();

vi.mock('@/actions/cards', () => ({
  getHomeCards: (...args: unknown[]) => mockGetHomeCards(...args),
  createCard: (...args: unknown[]) => mockCreateCard(...args),
  updateCard: (...args: unknown[]) => mockUpdateCard(...args),
  deleteCard: (...args: unknown[]) => mockDeleteCard(...args),
  resetCardToUnlearned: (...args: unknown[]) => mockResetCardToUnlearned(...args),
}));

vi.mock('@/actions/study', () => ({
  submitAssessment: (...args: unknown[]) => mockSubmitAssessment(...args),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

function createTestCard(overrides: Partial<CardWithTags> = {}): CardWithTags {
  return {
    id: 'card-1',
    userId: 'user-1',
    front: 'front text',
    back: 'back text',
    schedule: [1, 3, 7, 14, 30, 180],
    currentStep: 1,
    nextReviewAt: new Date().toISOString(),
    status: 'active',
    completedAt: null,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
    tags: [],
    ...overrides,
  };
}

function createHomeData(
  cards: CardWithTags[] = [],
  todayStudiedCardIds: string[] = []
): HomeCardsData {
  return { cards, todayStudiedCardIds };
}

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

describe('homeCardKeys', () => {
  it('キャッシュキーが正しく定義されている', () => {
    expect(homeCardKeys.all).toEqual(['cards', 'home']);
  });
});

describe('useHomeCards', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = createQueryClient();
  });

  it('getHomeCardsからデータを取得する', async () => {
    const card = createTestCard();
    const data = createHomeData([card], ['card-1']);
    mockGetHomeCards.mockResolvedValue(data);

    const { result } = renderHook(() => useHomeCards(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(data);
    expect(mockGetHomeCards).toHaveBeenCalledTimes(1);
  });

  it('staleTimeが30秒に設定されている', () => {
    mockGetHomeCards.mockResolvedValue(createHomeData());

    renderHook(() => useHomeCards(), {
      wrapper: createWrapper(queryClient),
    });

    const queryState = queryClient.getQueryCache().find({ queryKey: homeCardKeys.all });
    expect(queryState?.options.staleTime).toBe(30 * 1000);
  });

  it('キャッシュキーが正しい', async () => {
    mockGetHomeCards.mockResolvedValue(createHomeData());

    renderHook(() => useHomeCards(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(queryClient.getQueryData(homeCardKeys.all)).toBeDefined();
    });
  });
});

describe('useHomeCreateCard', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = createQueryClient();
  });

  it('楽観的更新: 新カードがキャッシュに即時追加される', async () => {
    const existingCard = createTestCard({ id: 'existing-1' });
    const initialData = createHomeData([existingCard]);
    queryClient.setQueryData(homeCardKeys.all, initialData);

    const newCardFromServer: Card = {
      id: 'server-card-1',
      userId: 'user-1',
      front: 'new front',
      back: 'new back',
      schedule: [1, 3, 7, 14, 30, 180],
      currentStep: 0,
      nextReviewAt: null,
      status: 'new',
      completedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockCreateCard.mockResolvedValue(newCardFromServer);

    const { result } = renderHook(() => useHomeCreateCard(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      result.current.mutate({ front: 'new front', back: 'new back' });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    const cached = queryClient.getQueryData<HomeCardsData>(homeCardKeys.all);
    expect(cached?.cards).toHaveLength(2);
    expect(cached?.cards[0].id).toBe('server-card-1');
  });

  it('エラー時: 前の状態にロールバックされる', async () => {
    const existingCard = createTestCard({ id: 'existing-1' });
    const initialData = createHomeData([existingCard]);
    queryClient.setQueryData(homeCardKeys.all, initialData);

    mockCreateCard.mockRejectedValue(new Error('Server error'));

    const { result } = renderHook(() => useHomeCreateCard(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      result.current.mutate({ front: 'will fail' });
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    const cached = queryClient.getQueryData<HomeCardsData>(homeCardKeys.all);
    expect(cached?.cards).toHaveLength(1);
    expect(cached?.cards[0].id).toBe('existing-1');
  });
});

describe('useHomeUpdateCard', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = createQueryClient();
  });

  it('楽観的更新: カードが即時更新される', async () => {
    const card = createTestCard({ id: 'card-1', front: 'old front' });
    queryClient.setQueryData(homeCardKeys.all, createHomeData([card]));

    const updatedFromServer: Card = {
      ...card,
      front: 'new front',
      tags: undefined as never,
    };
    mockUpdateCard.mockResolvedValue(updatedFromServer);

    const { result } = renderHook(() => useHomeUpdateCard(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      result.current.mutate({ id: 'card-1', input: { front: 'new front' } });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    const cached = queryClient.getQueryData<HomeCardsData>(homeCardKeys.all);
    expect(cached?.cards[0].front).toBe('new front');
  });

  it('エラー時: 前の状態にロールバックされる', async () => {
    const card = createTestCard({ id: 'card-1', front: 'original' });
    queryClient.setQueryData(homeCardKeys.all, createHomeData([card]));

    mockUpdateCard.mockRejectedValue(new Error('fail'));

    const { result } = renderHook(() => useHomeUpdateCard(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      result.current.mutate({ id: 'card-1', input: { front: 'updated' } });
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    const cached = queryClient.getQueryData<HomeCardsData>(homeCardKeys.all);
    expect(cached?.cards[0].front).toBe('original');
  });
});

describe('useHomeDeleteCard', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = createQueryClient();
  });

  it('楽観的更新: カードがキャッシュから即時除去される', async () => {
    const card1 = createTestCard({ id: 'card-1' });
    const card2 = createTestCard({ id: 'card-2' });
    queryClient.setQueryData(
      homeCardKeys.all,
      createHomeData([card1, card2], ['card-1'])
    );

    mockDeleteCard.mockResolvedValue(undefined);

    const { result } = renderHook(() => useHomeDeleteCard(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      result.current.mutate('card-1');
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    const cached = queryClient.getQueryData<HomeCardsData>(homeCardKeys.all);
    expect(cached?.cards).toHaveLength(1);
    expect(cached?.cards[0].id).toBe('card-2');
    expect(cached?.todayStudiedCardIds).not.toContain('card-1');
  });

  it('エラー時: 前の状態にロールバックされる', async () => {
    const card = createTestCard({ id: 'card-1' });
    queryClient.setQueryData(homeCardKeys.all, createHomeData([card]));

    mockDeleteCard.mockRejectedValue(new Error('fail'));

    const { result } = renderHook(() => useHomeDeleteCard(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      result.current.mutate('card-1');
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    const cached = queryClient.getQueryData<HomeCardsData>(homeCardKeys.all);
    expect(cached?.cards).toHaveLength(1);
  });
});

describe('useHomeResetCard', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = createQueryClient();
  });

  it('楽観的更新: カードのステータスがactiveに、currentStepが0にリセットされる', async () => {
    const card = createTestCard({
      id: 'card-1',
      status: 'completed',
      currentStep: 5,
      completedAt: '2025-01-01T00:00:00Z',
    });
    queryClient.setQueryData(homeCardKeys.all, createHomeData([card]));

    const resetFromServer: Card = {
      ...card,
      status: 'active',
      currentStep: 0,
      completedAt: null,
      nextReviewAt: new Date().toISOString(),
      tags: undefined as never,
    };
    mockResetCardToUnlearned.mockResolvedValue(resetFromServer);

    const { result } = renderHook(() => useHomeResetCard(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      result.current.mutate('card-1');
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    const cached = queryClient.getQueryData<HomeCardsData>(homeCardKeys.all);
    expect(cached?.cards[0].status).toBe('active');
    expect(cached?.cards[0].currentStep).toBe(0);
    expect(cached?.cards[0].completedAt).toBeNull();
  });

  it('エラー時: 前の状態にロールバックされる', async () => {
    const card = createTestCard({
      id: 'card-1',
      status: 'completed',
      currentStep: 5,
    });
    queryClient.setQueryData(homeCardKeys.all, createHomeData([card]));

    mockResetCardToUnlearned.mockRejectedValue(new Error('fail'));

    const { result } = renderHook(() => useHomeResetCard(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      result.current.mutate('card-1');
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    const cached = queryClient.getQueryData<HomeCardsData>(homeCardKeys.all);
    expect(cached?.cards[0].status).toBe('completed');
    expect(cached?.cards[0].currentStep).toBe(5);
  });
});

describe('useHomeSubmitAssessment', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = createQueryClient();
  });

  it('ok評価: currentStepが進み、todayStudiedCardIdsに追加される', async () => {
    const card = createTestCard({
      id: 'card-1',
      status: 'active',
      currentStep: 1,
    });
    queryClient.setQueryData(homeCardKeys.all, createHomeData([card]));

    const updatedCard: Card = {
      ...card,
      currentStep: 2,
      status: 'active',
      nextReviewAt: new Date().toISOString(),
      tags: undefined as never,
    };
    mockSubmitAssessment.mockResolvedValue({ ok: true, data: { card: updatedCard } });

    const { result } = renderHook(() => useHomeSubmitAssessment(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      result.current.mutate({ cardId: 'card-1', assessment: 'ok' });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    const cached = queryClient.getQueryData<HomeCardsData>(homeCardKeys.all);
    expect(cached?.todayStudiedCardIds).toContain('card-1');
  });

  it('again評価: currentStepが0にリセットされる', async () => {
    const card = createTestCard({
      id: 'card-1',
      status: 'active',
      currentStep: 3,
    });
    queryClient.setQueryData(homeCardKeys.all, createHomeData([card]));

    const updatedCard: Card = {
      ...card,
      currentStep: 0,
      status: 'active',
      tags: undefined as never,
    };
    mockSubmitAssessment.mockResolvedValue({ ok: true, data: { card: updatedCard } });

    const { result } = renderHook(() => useHomeSubmitAssessment(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      result.current.mutate({ cardId: 'card-1', assessment: 'again' });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    const cached = queryClient.getQueryData<HomeCardsData>(homeCardKeys.all);
    expect(cached?.cards[0].currentStep).toBe(0);
    expect(cached?.todayStudiedCardIds).toContain('card-1');
  });

  it('remembered評価: ステータスがcompletedになる', async () => {
    const card = createTestCard({
      id: 'card-1',
      status: 'active',
      currentStep: 2,
    });
    queryClient.setQueryData(homeCardKeys.all, createHomeData([card]));

    const updatedCard: Card = {
      ...card,
      status: 'completed',
      completedAt: new Date().toISOString(),
      nextReviewAt: null,
      tags: undefined as never,
    };
    mockSubmitAssessment.mockResolvedValue({ ok: true, data: { card: updatedCard } });

    const { result } = renderHook(() => useHomeSubmitAssessment(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      result.current.mutate({ cardId: 'card-1', assessment: 'remembered' });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    const cached = queryClient.getQueryData<HomeCardsData>(homeCardKeys.all);
    expect(cached?.cards[0].status).toBe('completed');
    expect(cached?.todayStudiedCardIds).toContain('card-1');
  });

  it('エラー時: 前の状態にロールバックされる', async () => {
    const card = createTestCard({
      id: 'card-1',
      status: 'active',
      currentStep: 1,
    });
    queryClient.setQueryData(homeCardKeys.all, createHomeData([card]));

    mockSubmitAssessment.mockResolvedValue({ ok: false, error: 'Server error' });

    const { result } = renderHook(() => useHomeSubmitAssessment(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      result.current.mutate({ cardId: 'card-1', assessment: 'ok' });
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    const cached = queryClient.getQueryData<HomeCardsData>(homeCardKeys.all);
    expect(cached?.cards[0].currentStep).toBe(1);
    expect(cached?.todayStudiedCardIds).toEqual([]);
  });

  it('重複カードIDはtodayStudiedCardIdsに追加されない', async () => {
    const card = createTestCard({ id: 'card-1' });
    queryClient.setQueryData(
      homeCardKeys.all,
      createHomeData([card], ['card-1'])
    );

    const updatedCard: Card = {
      ...card,
      currentStep: 2,
      tags: undefined as never,
    };
    mockSubmitAssessment.mockResolvedValue({ ok: true, data: { card: updatedCard } });

    const { result } = renderHook(() => useHomeSubmitAssessment(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      result.current.mutate({ cardId: 'card-1', assessment: 'ok' });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    const cached = queryClient.getQueryData<HomeCardsData>(homeCardKeys.all);
    const occurrences = cached?.todayStudiedCardIds.filter((id) => id === 'card-1');
    expect(occurrences).toHaveLength(1);
  });
});
