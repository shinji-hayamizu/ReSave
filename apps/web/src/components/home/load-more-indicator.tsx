'use client';

import { Check } from 'lucide-react';

interface LoadMoreIndicatorProps {
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  totalCount: number;
}

function BouncingDots() {
  return (
    <div className="flex items-center justify-center gap-1.5 py-6" aria-label="読み込み中">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-2 w-2 rounded-full bg-muted-foreground/60 animate-bounce"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  );
}

export function LoadMoreIndicator({ isFetchingNextPage, hasNextPage, totalCount }: LoadMoreIndicatorProps) {
  if (isFetchingNextPage) {
    return <BouncingDots />;
  }

  if (!hasNextPage && totalCount > 0) {
    return (
      <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
        <Check className="h-4 w-4" />
        <span>{`全${totalCount}件のカードを表示中`}</span>
      </div>
    );
  }

  return null;
}
