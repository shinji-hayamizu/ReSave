import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockInvalidateQueries = vi.fn();
const mockSetQueryData = vi.fn();
const mockCancelQueries = vi.fn();
const mockGetQueryData = vi.fn();

vi.mock('@tanstack/react-query', () => ({
  useMutation: vi.fn((options) => ({
    mutate: vi.fn(),
    mutateAsync: vi.fn(),
    ...options,
  })),
  useQuery: vi.fn((options) => ({
    data: undefined,
    isLoading: false,
    ...options,
  })),
  useQueryClient: vi.fn(() => ({
    invalidateQueries: mockInvalidateQueries,
    setQueryData: mockSetQueryData,
    cancelQueries: mockCancelQueries,
    getQueryData: mockGetQueryData,
  })),
}));

vi.mock('@/actions/cards', () => ({
  getHomeCards: vi.fn(),
  createCard: vi.fn(),
  deleteCard: vi.fn(),
  updateCard: vi.fn(),
  resetCardToUnlearned: vi.fn(),
}));

vi.mock('@/actions/study', () => ({
  submitAssessment: vi.fn(),
}));

vi.mock('@/lib/query-keys', () => ({
  homeCardKeys: {
    all: ['cards', 'home'],
    tab: (tab: string) => ['cards', 'home', tab],
  },
}));

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

import { cardKeys } from '@/hooks/useCards';

describe('useHomeSubmitAssessment の onMutate - 楽観的更新ステップ計算', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function buildInfiniteData(card: {
    id: string;
    currentStep: number;
    schedule: number[];
    status: string;
    nextReviewAt: string | null;
    completedAt: string | null;
  }) {
    return {
      pages: [
        {
          cards: [
            {
              ...card,
              userId: 'user-1',
              front: 'Q',
              back: 'A',
              sourceUrl: null,
              createdAt: '2026-01-01T00:00:00Z',
              updatedAt: '2026-01-01T00:00:00Z',
              tags: [],
            },
          ],
          todayStudiedCardIds: [],
          fetchedAt: '2026-01-01T00:00:00Z',
          pagination: { total: 1, limit: 10, offset: 0, hasMore: false },
        },
      ],
      pageParams: [0],
    };
  }

  it('OK評価: currentStep=0 のとき schedule[0]=1日後を使う（schedule[1]の3日後ではない）', async () => {
    // Given: currentStep=0, schedule=[1, 3, 7, 14, 30, 180] のカード
    const card = {
      id: 'card-1',
      currentStep: 0,
      schedule: [1, 3, 7, 14, 30, 180],
      status: 'new',
      nextReviewAt: null,
      completedAt: null,
    };

    const { useMutation } = await import('@tanstack/react-query');
    const { useHomeSubmitAssessment } = await import('@/hooks/useHomeCards');
    useHomeSubmitAssessment();

    const mutationOptions = vi.mocked(useMutation).mock.calls[0][0] as {
      onMutate: (input: { cardId: string; assessment: string }) => Promise<unknown>;
    };

    mockGetQueryData.mockReturnValue(buildInfiniteData(card));

    const before = new Date();
    await mutationOptions.onMutate({ cardId: 'card-1', assessment: 'ok' });

    // Then: setQueryData が呼ばれ、楽観的更新のカードが currentStep 基準の日付を使う
    expect(mockSetQueryData).toHaveBeenCalled();
    const setQueryDataCall = mockSetQueryData.mock.calls[0];
    const updater = setQueryDataCall[1] as (old: unknown) => unknown;
    const result = updater(buildInfiniteData(card)) as {
      pages: Array<{ cards: Array<{ nextReviewAt: string; currentStep: number }> }>;
    };

    const updatedCard = result.pages[0].cards[0];
    expect(updatedCard.currentStep).toBe(1);

    // nextReviewAt は schedule[0]=1日後 (サーバー側と一致)
    const expectedDate = new Date(before);
    expectedDate.setDate(expectedDate.getDate() + 1);
    const actualDate = new Date(updatedCard.nextReviewAt);

    // 日付が schedule[0]=1日後 であることを確認（schedule[1]=3日後ではない）
    expect(actualDate.toDateString()).toBe(expectedDate.toDateString());
  });

  it('OK評価: currentStep=2 のとき schedule[2]=7日後を使う（schedule[3]=14日後ではない）', async () => {
    // Given: currentStep=2, schedule=[1, 3, 7, 14, 30, 180] のカード
    const card = {
      id: 'card-2',
      currentStep: 2,
      schedule: [1, 3, 7, 14, 30, 180],
      status: 'active',
      nextReviewAt: '2026-01-01T00:00:00Z',
      completedAt: null,
    };

    const { useMutation } = await import('@tanstack/react-query');
    vi.mocked(useMutation).mockClear();
    const { useHomeSubmitAssessment } = await import('@/hooks/useHomeCards');
    useHomeSubmitAssessment();

    const mutationOptions = vi.mocked(useMutation).mock.calls[0][0] as {
      onMutate: (input: { cardId: string; assessment: string }) => Promise<unknown>;
    };

    mockGetQueryData.mockReturnValue(buildInfiniteData(card));

    const before = new Date();
    await mutationOptions.onMutate({ cardId: 'card-2', assessment: 'ok' });

    const setQueryDataCall = mockSetQueryData.mock.calls[0];
    const updater = setQueryDataCall[1] as (old: unknown) => unknown;
    const result = updater(buildInfiniteData(card)) as {
      pages: Array<{ cards: Array<{ nextReviewAt: string; currentStep: number }> }>;
    };

    const updatedCard = result.pages[0].cards[0];
    expect(updatedCard.currentStep).toBe(3);

    // nextReviewAt は schedule[2]=7日後 (サーバー側と一致)
    const expectedDate = new Date(before);
    expectedDate.setDate(expectedDate.getDate() + 7);
    const actualDate = new Date(updatedCard.nextReviewAt);

    expect(actualDate.toDateString()).toBe(expectedDate.toDateString());
  });

  it('OK評価: 最終step(=5)のとき completed になる', async () => {
    // Given: currentStep=5（最終）, schedule=[1, 3, 7, 14, 30, 180] のカード
    const card = {
      id: 'card-3',
      currentStep: 5,
      schedule: [1, 3, 7, 14, 30, 180],
      status: 'active',
      nextReviewAt: '2026-01-01T00:00:00Z',
      completedAt: null,
    };

    const { useMutation } = await import('@tanstack/react-query');
    vi.mocked(useMutation).mockClear();
    const { useHomeSubmitAssessment } = await import('@/hooks/useHomeCards');
    useHomeSubmitAssessment();

    const mutationOptions = vi.mocked(useMutation).mock.calls[0][0] as {
      onMutate: (input: { cardId: string; assessment: string }) => Promise<unknown>;
    };

    mockGetQueryData.mockReturnValue(buildInfiniteData(card));
    await mutationOptions.onMutate({ cardId: 'card-3', assessment: 'ok' });

    const setQueryDataCall = mockSetQueryData.mock.calls[0];
    const updater = setQueryDataCall[1] as (old: unknown) => unknown;
    const result = updater(buildInfiniteData(card)) as {
      pages: Array<{ cards: Array<{ status: string; nextReviewAt: string | null; currentStep: number }> }>;
    };

    const updatedCard = result.pages[0].cards[0];

    // Then: completed 状態、nextReviewAt は null
    expect(updatedCard.status).toBe('completed');
    expect(updatedCard.nextReviewAt).toBeNull();
    expect(updatedCard.currentStep).toBe(6);
  });
});

describe('useHomeSubmitAssessment の onSuccess', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('cardKeys.todayCompleted() が正しいキーを返す', () => {
    // Given: cardKeys が定義されている状態
    // When: todayCompleted キーを取得
    const key = cardKeys.todayCompleted();

    // Then: 期待されるキー構造を返す
    expect(key).toEqual(['cards', 'today-completed']);
  });

  it('useHomeSubmitAssessment の onSuccess で todayCompleted キャッシュを invalidate する', async () => {
    // Given: useMutation の onSuccess コールバックを取得するためにフックを動的インポート
    const { useMutation } = await import('@tanstack/react-query');
    const { useHomeSubmitAssessment } = await import('@/hooks/useHomeCards');

    useHomeSubmitAssessment();

    const mutationOptions = vi.mocked(useMutation).mock.calls[0][0] as {
      onSuccess: (data: { card: { id: string; status: string } }) => void;
    };

    // When: onSuccess を実行（assessment='remembered' 後の状態）
    const updatedCard = {
      id: 'card-1',
      userId: 'user-1',
      front: 'Q',
      back: 'A',
      sourceUrl: null,
      schedule: [1, 3, 7, 14, 30, 90],
      currentStep: 0,
      nextReviewAt: null,
      status: 'completed',
      completedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    mockGetQueryData.mockReturnValue({
      cards: [updatedCard],
      todayStudiedCardIds: [],
      fetchedAt: new Date().toISOString(),
    });

    mutationOptions.onSuccess({ card: updatedCard });

    // Then: todayCompleted キャッシュが invalidate される
    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: cardKeys.todayCompleted(),
    });
  });
});
