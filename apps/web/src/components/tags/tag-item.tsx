'use client';

import { Pencil, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import { getTagColorClasses } from './color-palette';

interface TagItemProps {
  id: string;
  name: string;
  color: string;
  cardCount: number;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export function TagItem({
  id,
  name,
  color,
  cardCount,
  onEdit,
  onDelete,
}: TagItemProps) {
  return (
    <div data-testid="tag-item" className="flex items-center gap-3 rounded-lg bg-background p-4 shadow-sm transition-shadow hover:shadow-md">
      <span
        className={cn(
          'inline-flex items-center whitespace-nowrap rounded-full border px-3.5 py-1.5 text-sm font-medium',
          getTagColorClasses(color)
        )}
      >
        {name}
      </span>

      <div className="min-w-0 flex-1">
        <div className="truncate font-medium text-foreground">{name}</div>
        <div className="text-sm text-muted-foreground">
          {cardCount}枚のカード
        </div>
      </div>

      <div className="flex gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onEdit(id)}
          className="h-9 w-9 text-muted-foreground hover:text-foreground"
          title="編集"
        >
          <Pencil className="h-4 w-4" />
          <span className="sr-only">編集</span>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDelete(id)}
          className="h-9 w-9 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          title="削除"
        >
          <Trash2 className="h-4 w-4" />
          <span className="sr-only">削除</span>
        </Button>
      </div>
    </div>
  );
}
