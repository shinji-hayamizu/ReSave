'use client';

import { useState } from 'react';
import { X, Plus } from 'lucide-react';

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useTags } from '@/hooks/useTags';
import { cn } from '@/lib/utils';

interface TagSelectorProps {
  selectedTagIds: string[];
  onChange: (tagIds: string[]) => void;
  maxTags?: number;
}

const TAG_COLORS: Record<string, { bg: string; text: string; hoverBg: string }> = {
  blue: { bg: 'bg-primary', text: 'text-primary-foreground', hoverBg: 'hover:bg-primary/90' },
  green: { bg: 'bg-emerald-500', text: 'text-white', hoverBg: 'hover:bg-emerald-600' },
  purple: { bg: 'bg-violet-500', text: 'text-white', hoverBg: 'hover:bg-violet-600' },
  orange: { bg: 'bg-orange-500', text: 'text-white', hoverBg: 'hover:bg-orange-600' },
  pink: { bg: 'bg-pink-500', text: 'text-white', hoverBg: 'hover:bg-pink-600' },
  cyan: { bg: 'bg-cyan-500', text: 'text-white', hoverBg: 'hover:bg-cyan-600' },
  yellow: { bg: 'bg-amber-500', text: 'text-white', hoverBg: 'hover:bg-amber-600' },
  gray: { bg: 'bg-slate-500', text: 'text-white', hoverBg: 'hover:bg-slate-600' },
};

function getTagColorClasses(color: string) {
  return TAG_COLORS[color] ?? TAG_COLORS.blue;
}

export function TagSelector({ selectedTagIds, onChange, maxTags = 10 }: TagSelectorProps) {
  const [open, setOpen] = useState(false);
  const { data: tags = [], isLoading } = useTags();

  const selectedTags = tags.filter((tag) => selectedTagIds.includes(tag.id));
  const availableTags = tags.filter((tag) => !selectedTagIds.includes(tag.id));
  const canAddMore = selectedTagIds.length < maxTags;

  function handleSelect(tagId: string) {
    if (!canAddMore) return;
    onChange([...selectedTagIds, tagId]);
  }

  function handleRemove(tagId: string) {
    onChange(selectedTagIds.filter((id) => id !== tagId));
  }

  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-2 min-h-[52px] p-3',
        'rounded-lg border border-input bg-background',
        'transition-all duration-150',
        'hover:border-muted-foreground/50',
        'focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary'
      )}
    >
      {/* Selected Tags */}
      {selectedTags.map((tag) => {
        const colorClasses = getTagColorClasses(tag.color);
        return (
          <span
            key={tag.id}
            className={cn(
              'inline-flex items-center gap-1.5 h-8 px-3',
              'text-[13px] font-medium rounded-full',
              'transition-colors',
              colorClasses.bg,
              colorClasses.text,
              colorClasses.hoverBg
            )}
          >
            <span>{tag.name}</span>
            <button
              type="button"
              onClick={() => handleRemove(tag.id)}
              className={cn(
                'flex items-center justify-center w-[18px] h-[18px] -mr-1',
                'rounded-full bg-white/25 hover:bg-white/40',
                'transition-colors'
              )}
              aria-label={`${tag.name}を削除`}
            >
              <X className="h-2.5 w-2.5" />
            </button>
          </span>
        );
      })}

      {/* Placeholder when no tags */}
      {selectedTags.length === 0 && !open && (
        <span className="text-sm text-muted-foreground leading-7">タグを選択</span>
      )}

      {/* Add Tag Button */}
      {canAddMore && (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className={cn(
                'inline-flex items-center gap-1 h-8 px-3',
                'text-[13px] font-medium rounded-full',
                'bg-muted/60 text-muted-foreground',
                'border border-dashed border-border',
                'transition-all duration-150',
                'hover:bg-primary/10 hover:text-primary hover:border-primary'
              )}
            >
              <Plus className="h-3.5 w-3.5" />
              <span>追加</span>
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-[280px] p-2" align="start">
            <div className="max-h-[200px] overflow-y-auto">
              {isLoading ? (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  読み込み中...
                </div>
              ) : availableTags.length === 0 ? (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  {tags.length === 0 ? 'タグがありません' : '全てのタグが選択されています'}
                </div>
              ) : (
                <div className="space-y-0.5">
                  {availableTags.map((tag) => {
                    const colorClasses = getTagColorClasses(tag.color);
                    return (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => {
                          handleSelect(tag.id);
                          if (selectedTagIds.length + 1 >= maxTags) {
                            setOpen(false);
                          }
                        }}
                        className={cn(
                          'flex items-center gap-2 w-full px-3 py-2 rounded-md',
                          'text-sm text-left',
                          'transition-colors',
                          'hover:bg-accent focus:bg-accent focus:outline-none'
                        )}
                      >
                        <span
                          className={cn(
                            'inline-flex items-center px-2.5 py-0.5',
                            'text-xs font-medium rounded-full',
                            colorClasses.bg,
                            colorClasses.text
                          )}
                        >
                          {tag.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}

export { TAG_COLORS, getTagColorClasses };
