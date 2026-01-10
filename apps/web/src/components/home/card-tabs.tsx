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

interface TabConfig {
  value: CardTabValue;
  label: string;
  badgeBg: string;
  badgeText: string;
}

const tabs: TabConfig[] = [
  { value: 'due', label: '未学習', badgeBg: 'bg-amber-100', badgeText: 'text-amber-600' },
  { value: 'learning', label: '復習中', badgeBg: 'bg-blue-100', badgeText: 'text-blue-600' },
  { value: 'completed', label: '完了', badgeBg: 'bg-emerald-100', badgeText: 'text-emerald-600' },
];

function formatCount(count: number): string {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1).replace(/\.0$/, '')}k`;
  }
  return String(count);
}

export function CardTabs({ value, onChange, counts, className }: CardTabsProps) {
  return (
    <div className={cn('flex border-b border-border', className)}>
      {tabs.map((tab) => (
        <button
          key={tab.value}
          type="button"
          className={cn(
            'flex-1 transition-all -mb-px',
            'flex flex-col items-center gap-1 py-2 px-2 border-b-2 border-transparent',
            'md:flex-row md:justify-center md:gap-2 md:py-2 md:px-4',
            value === tab.value
              ? 'text-primary border-b-primary'
              : 'text-muted-foreground hover:text-foreground'
          )}
          onClick={() => onChange(tab.value)}
        >
          <span className="text-xs md:text-sm font-medium">{tab.label}</span>
          {counts && (
            <span
              className={cn(
                'text-base md:text-xs font-bold md:font-semibold',
                'md:px-1.5 md:py-0.5 md:rounded',
                tab.badgeBg,
                tab.badgeText
              )}
            >
              {formatCount(counts[tab.value])}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
