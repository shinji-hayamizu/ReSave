'use client';

import { FileQuestion } from 'lucide-react';

import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { StudyCard } from '@/components/ui/study-card';
import { TagBadge } from '@/components/ui/tag-badge';
import type { CardWithTags } from '@/types/card';

interface CardListProps {
  cards: CardWithTags[] | undefined;
  isLoading?: boolean;
  emptyMessage?: string;
  className?: string;
}

function CardListSkeleton() {
  return (
    <div className="space-y-4">
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

export function CardList({
  cards,
  isLoading,
  emptyMessage = 'カードがありません',
  className,
}: CardListProps) {
  if (isLoading) {
    return <CardListSkeleton />;
  }

  if (!cards || cards.length === 0) {
    return (
      <EmptyState
        className={className}
        description={emptyMessage}
        icon={<FileQuestion />}
        title="カードなし"
      />
    );
  }

  return (
    <div className={className}>
      <div className="space-y-4">
        {cards.map((card) => (
          <StudyCard
            key={card.id}
            answer={card.back}
            question={card.front}
            tags={
              card.tags.length > 0 ? (
                <>
                  {card.tags.map((tag) => (
                    <TagBadge key={tag.id}>{tag.name}</TagBadge>
                  ))}
                </>
              ) : undefined
            }
          />
        ))}
      </div>
    </div>
  );
}
