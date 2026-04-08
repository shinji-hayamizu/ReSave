'use client';

import { memo } from 'react';

import { getTagColorClasses } from '@/components/cards/tag-selector';
import { cn } from '@/lib/utils';
import type { Tag } from '@/types/tag';

interface TagFilterBarProps {
  tags: Tag[];
  selectedTagId: string | null;
  onTagSelect: (tagId: string | null) => void;
}

const TAG_FILTER_COLORS: Record<string, { activeBg: string; activeText: string; activeRing: string }> = {
  blue: { activeBg: 'bg-blue-100', activeText: 'text-blue-700', activeRing: 'ring-blue-300' },
  green: { activeBg: 'bg-emerald-100', activeText: 'text-emerald-700', activeRing: 'ring-emerald-300' },
  purple: { activeBg: 'bg-violet-100', activeText: 'text-violet-700', activeRing: 'ring-violet-300' },
  orange: { activeBg: 'bg-orange-100', activeText: 'text-orange-700', activeRing: 'ring-orange-300' },
  pink: { activeBg: 'bg-pink-100', activeText: 'text-pink-700', activeRing: 'ring-pink-300' },
  cyan: { activeBg: 'bg-cyan-100', activeText: 'text-cyan-700', activeRing: 'ring-cyan-300' },
  yellow: { activeBg: 'bg-amber-100', activeText: 'text-amber-700', activeRing: 'ring-amber-300' },
  gray: { activeBg: 'bg-slate-100', activeText: 'text-slate-700', activeRing: 'ring-slate-300' },
};

function getFilterColorClasses(color: string) {
  return TAG_FILTER_COLORS[color] ?? TAG_FILTER_COLORS.blue;
}

export const TagFilterBar = memo(function TagFilterBar({
  tags,
  selectedTagId,
  onTagSelect,
}: TagFilterBarProps) {
  if (tags.length === 0) return null;

  const isAllSelected = selectedTagId === null;

  return (
    <div className="flex gap-1.5 overflow-x-auto py-1 scrollbar-hide">
      <button
        type="button"
        className={cn(
          'shrink-0 flex items-center gap-1 px-3 py-1.5',
          'text-xs font-medium rounded-full',
          'transition-colors',
          isAllSelected
            ? 'bg-foreground text-background'
            : 'border border-border text-muted-foreground bg-background hover:bg-muted/50'
        )}
        onClick={() => onTagSelect(null)}
      >
        すべて
      </button>
      {tags.map((tag) => {
        const isSelected = selectedTagId === tag.id;
        const dotColor = getTagColorClasses(tag.color);
        const filterColor = getFilterColorClasses(tag.color);

        return (
          <button
            key={tag.id}
            type="button"
            className={cn(
              'shrink-0 flex items-center gap-1.5 px-3 py-1.5',
              'text-xs font-medium rounded-full',
              'transition-colors',
              isSelected
                ? `${filterColor.activeBg} ${filterColor.activeText} ring-1 ${filterColor.activeRing}`
                : 'border border-border text-muted-foreground bg-background hover:bg-muted/50'
            )}
            onClick={() => onTagSelect(isSelected ? null : tag.id)}
          >
            <span className={cn('w-2 h-2 rounded-full shrink-0', dotColor.bg)} />
            {tag.name}
          </button>
        );
      })}
    </div>
  );
});

export type { TagFilterBarProps };
