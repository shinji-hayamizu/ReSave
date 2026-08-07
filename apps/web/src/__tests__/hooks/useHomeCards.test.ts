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
    dueCount: () => ['cards', 'home', 'due-count'],
  },
}));

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

import { cardKeys } from '@/hooks/useCards';

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

describe('useHomeSubmitAssessment の onMutate - 評価後タブから削除', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('OK評価: learningタブから該当カードが削除され、todayStudiedCardIdsに追加される', async () => {
    const card = {
      id: 'card-1',
      currentStep: 0,
      schedule: [1, 3, 7, 14, 30, 180],
      status: 'new',
      nextReviewAt: null,
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

    await mutationOptions.onMutate({ cardId: 'card-1', assessment: 'ok' });

    expect(mockSetQueryData).toHaveBeenCalled();
    const setQueryDataCall = mockSetQueryData.mock.calls[0];
    const updater = setQueryDataCall[1] as (old: unknown) => unknown;
    const result = updater(buildInfiniteData(card)) as {
      pages: Array<{ cards: Array<unknown>; todayStudiedCardIds: string[] }>;
    };

    expect(result.pages[0].cards).toHaveLength(0);
    expect(result.pages[0].todayStudiedCardIds).toContain('card-1');
  });

  it('again評価: learningタブから該当カードが削除される', async () => {
    const card = {
      id: 'card-1',
      currentStep: 3,
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

    await mutationOptions.onMutate({ cardId: 'card-1', assessment: 'again' });

    const setQueryDataCall = mockSetQueryData.mock.calls[0];
    const updater = setQueryDataCall[1] as (old: unknown) => unknown;
    const result = updater(buildInfiniteData(card)) as {
      pages: Array<{ cards: Array<unknown>; todayStudiedCardIds: string[] }>;
    };

    expect(result.pages[0].cards).toHaveLength(0);
    expect(result.pages[0].todayStudiedCardIds).toContain('card-1');
  });

  it('remembered評価: learningタブから該当カードが削除される', async () => {
    const card = {
      id: 'card-1',
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

    await mutationOptions.onMutate({ cardId: 'card-1', assessment: 'remembered' });

    const setQueryDataCall = mockSetQueryData.mock.calls[0];
    const updater = setQueryDataCall[1] as (old: unknown) => unknown;
    const result = updater(buildInfiniteData(card)) as {
      pages: Array<{ cards: Array<unknown>; todayStudiedCardIds: string[] }>;
    };

    expect(result.pages[0].cards).toHaveLength(0);
    expect(result.pages[0].todayStudiedCardIds).toContain('card-1');
  });
});

describe('useHomeSubmitAssessment の onSettled - 関連キャッシュ invalidate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('cardKeys.todayCompleted() が正しいキーを返す', () => {
    const key = cardKeys.todayCompleted();
    expect(key).toEqual(['cards', 'today-completed']);
  });

  it('onSettled で learning / due / completed / dueCount / todayCompleted の全キャッシュが invalidate される', async () => {
    const { useMutation } = await import('@tanstack/react-query');
    vi.mocked(useMutation).mockClear();
    const { useHomeSubmitAssessment } = await import('@/hooks/useHomeCards');
    useHomeSubmitAssessment();

    const mutationOptions = vi.mocked(useMutation).mock.calls[0][0] as {
      onSettled: () => void;
    };

    mutationOptions.onSettled();

    const invalidatedKeys = mockInvalidateQueries.mock.calls.map((c) => c[0]?.queryKey);

    expect(invalidatedKeys).toContainEqual(['cards', 'home', 'learning']);
    expect(invalidatedKeys).toContainEqual(['cards', 'home', 'due']);
    expect(invalidatedKeys).toContainEqual(['cards', 'home', 'completed']);
    expect(invalidatedKeys).toContainEqual(['cards', 'home', 'due-count']);
    expect(invalidatedKeys).toContainEqual(cardKeys.todayCompleted());
  });
});
