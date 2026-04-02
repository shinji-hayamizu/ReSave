'use client';

import { CheckCheck } from 'lucide-react';

import { CardList } from '@/components/home';
import { PageHeader } from '@/components/layout/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { useTodayCompletedCards } from '@/hooks/useCards';

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
  const { data: completedCards, isLoading } = useTodayCompletedCards();

  return (
    <div>
      <PageHeader
        title="完了"
        description="学習が完了したカード"
      />
      <div className="p-4 md:p-6">
        {isLoading ? (
          <CompletedPageSkeleton />
        ) : !completedCards || completedCards.length === 0 ? (
          <EmptyState
            icon={<CheckCheck />}
            title="完了済みカードなし"
            description="カードを学習して「覚えた」と評価すると、ここに表示されます"
          />
        ) : (
          <CardList cards={completedCards} />
        )}
      </div>
    </div>
  );
}
