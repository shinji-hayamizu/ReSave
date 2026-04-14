'use client';

import { CheckCheck } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { CompletedCard } from '@/components/home';
import { LoadMoreIndicator } from '@/components/home';
import { PageHeader } from '@/components/layout/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { useCompletedCards } from '@/hooks/useCompletedCards';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';

function CompletedPageSkeleton() {
  return (
    <div className="p-4 md:p-6 space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-card rounded-xl shadow-sm p-4 space-y-3">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <div className="flex gap-2">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function CompletedCardsPage() {
  const {
    data,
    isLoading,
    isFetching,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useCompletedCards();

  const completedCards = useMemo(
    () => data?.pages.flatMap((page) => page.cards) ?? [],
    [data],
  );

  const totalCount = data?.pages[0]?.pagination.total ?? 0;

  const handleFetchNextPage = useCallback(() => {
    fetchNextPage();
  }, [fetchNextPage]);

  const triggerRef = useIntersectionObserver({
    enabled: !!hasNextPage && !isFetchingNextPage,
    rootMargin: '200px',
    onIntersect: handleFetchNextPage,
  });

  const prevIdsRef = useRef<Set<string>>(new Set());
  const [newCardIds, setNewCardIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (completedCards.length === 0 || isLoading) {
      return;
    }

    const currentIds = new Set(completedCards.map((c) => c.id));
    const added = new Set<string>();
    for (const id of currentIds) {
      if (!prevIdsRef.current.has(id)) {
        added.add(id);
      }
    }
    prevIdsRef.current = currentIds;

    if (added.size === 0) {
      return;
    }

    const showTimer = setTimeout(() => {
      setNewCardIds(added);
    }, 0);
    const clearTimer = setTimeout(() => {
      setNewCardIds(new Set());
    }, 400);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(clearTimer);
    };
  }, [completedCards, isLoading]);

  return (
    <div>
      <div className="relative">
        {isFetching && !isLoading && !isFetchingNextPage && (
          <div
            data-testid="loading-bar"
            className="absolute bottom-0 left-0 right-0 h-px z-10"
            style={{
              background: 'linear-gradient(90deg, transparent 0%, hsl(217.2 91.2% 59.8%) 30%, hsl(200 100% 65%) 50%, hsl(217.2 91.2% 59.8%) 70%, transparent 100%)',
              backgroundSize: '200% 100%',
              animation: 'fetching-slide 1.6s ease-in-out infinite',
            }}
          />
        )}
        <PageHeader
          title="完了"
          description="学習が完了したカード"
        />
      </div>
      <div className="p-4 md:p-6">
        {isLoading ? (
          <CompletedPageSkeleton />
        ) : completedCards.length === 0 ? (
          <EmptyState
            icon={<CheckCheck />}
            title="完了済みカードなし"
            description="カードを学習して「覚えた」と評価すると、ここに表示されます"
          />
        ) : (
          <>
            <div className="space-y-4" data-testid="card-list">
              {completedCards.map((card, index) => (
                <div key={card.id} className={newCardIds.has(card.id) ? 'card-enter' : undefined}>
                  <CompletedCard card={card} />
                  {index === completedCards.length - 2 && (
                    <div ref={triggerRef} aria-hidden="true" />
                  )}
                </div>
              ))}
            </div>
            <LoadMoreIndicator
              hasNextPage={!!hasNextPage}
              isFetchingNextPage={isFetchingNextPage}
              totalCount={totalCount}
            />
          </>
        )}
      </div>
    </div>
  );
}
