'use client';

import { useState } from 'react';
import { X, ChevronsUpDown, Check } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useTags } from '@/hooks/useTags';
import { cn } from '@/lib/utils';

interface TagSelectorProps {
  selectedTagIds: string[];
  onChange: (tagIds: string[]) => void;
  maxTags?: number;
}

const TAG_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  blue: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200' },
  green: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200' },
  purple: { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200' },
  orange: { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-200' },
  pink: { bg: 'bg-pink-100', text: 'text-pink-700', border: 'border-pink-200' },
  cyan: { bg: 'bg-cyan-100', text: 'text-cyan-700', border: 'border-cyan-200' },
  yellow: { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-200' },
  gray: { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200' },
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
    <div className="space-y-2">
      <div
        className={cn(
          'flex flex-wrap gap-2 min-h-[48px] p-3 rounded-md border bg-background',
          'focus-within:ring-1 focus-within:ring-ring'
        )}
      >
        {selectedTags.length === 0 ? (
          <span className="text-sm text-muted-foreground">タグを選択</span>
        ) : (
          selectedTags.map((tag) => {
            const colorClasses = getTagColorClasses(tag.color);
            return (
              <span
                key={tag.id}
                className={cn(
                  'inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full border',
                  colorClasses.bg,
                  colorClasses.text,
                  colorClasses.border
                )}
              >
                {tag.name}
                <button
                  type="button"
                  onClick={() => handleRemove(tag.id)}
                  className="flex items-center justify-center w-3.5 h-3.5 rounded-full bg-white/50 hover:bg-white/80 transition-colors"
                  aria-label={`${tag.name}を削除`}
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </span>
            );
          })
        )}
      </div>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
            disabled={!canAddMore && availableTags.length > 0}
          >
            {canAddMore ? 'タグを追加...' : 'タグ上限に達しました'}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0" align="start">
          <div className="max-h-[200px] overflow-y-auto p-1">
            {isLoading ? (
              <div className="p-4 text-center text-sm text-muted-foreground">読み込み中...</div>
            ) : availableTags.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                {tags.length === 0 ? 'タグがありません' : '全てのタグが選択されています'}
              </div>
            ) : (
              availableTags.map((tag) => {
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
                      'flex items-center gap-2 w-full px-3 py-2 text-sm rounded-sm',
                      'hover:bg-accent hover:text-accent-foreground',
                      'focus:bg-accent focus:text-accent-foreground focus:outline-none'
                    )}
                  >
                    <span
                      className={cn(
                        'inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full border',
                        colorClasses.bg,
                        colorClasses.text,
                        colorClasses.border
                      )}
                    >
                      {tag.name}
                    </span>
                    {selectedTagIds.includes(tag.id) && (
                      <Check className="ml-auto h-4 w-4" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

export { TAG_COLORS, getTagColorClasses };
