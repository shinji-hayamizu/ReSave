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
