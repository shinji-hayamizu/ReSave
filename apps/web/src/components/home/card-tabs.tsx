'use client';

import { cn } from '@/lib/utils';

export type CardTabValue = 'due' | 'learning' | 'completed';

interface CardTabsProps {
  value: CardTabValue;
  onChange: (value: CardTabValue) => void;
  counts?: {
    due: number;
    learning: number;
    completed: number;
  };
  className?: string;
}

const tabs: { value: CardTabValue; label: string }[] = [
  { value: 'due', label: '未学習' },
  { value: 'learning', label: '復習中' },
  { value: 'completed', label: '完了' },
];

export function CardTabs({ value, onChange, counts, className }: CardTabsProps) {
  return (
    <div className={cn('flex gap-1 p-1 bg-muted rounded-lg', className)}>
      {tabs.map((tab) => (
        <button
          key={tab.value}
          type="button"
          className={cn(
            'flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors',
            value === tab.value
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
          onClick={() => onChange(tab.value)}
        >
          {tab.label}
          {counts && (
            <span
              className={cn(
                'ml-1.5 text-xs',
                value === tab.value ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              {counts[tab.value]}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
