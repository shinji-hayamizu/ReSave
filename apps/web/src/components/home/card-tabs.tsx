'use client';

import { memo } from 'react';

import { cn } from '@/lib/utils';

export type CardTabValue = 'due' | 'learning';

interface CardTabsProps {
  value: CardTabValue;
  onChange: (value: CardTabValue) => void;
  counts?: {
    due: number;
    learning: number;
  };
  className?: string;
}

interface TabConfig {
  value: CardTabValue;
  label: string;
  badgeBg: string;
  badgeText: string;
  activeBg: string;
}

const tabs: TabConfig[] = [
  { value: 'due', label: '未学習', badgeBg: 'bg-warning/10', badgeText: 'text-warning', activeBg: 'bg-warning/5' },
  { value: 'learning', label: '復習中', badgeBg: 'bg-primary/10', badgeText: 'text-primary', activeBg: 'bg-primary/5' },
];

function formatCount(count: number): string {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1).replace(/\.0$/, '')}k`;
  }
  return String(count);
}

export const CardTabs = memo(function CardTabs({ value, onChange, counts, className }: CardTabsProps) {
  return (
    <div className={cn('flex border-b border-border', className)}>
      {tabs.map((tab) => {
        const isActive = value === tab.value;
        return (
          <button
            key={tab.value}
            type="button"
            className={cn(
              'flex-1 transition-all -mb-px rounded-t-lg',
              'flex flex-col items-center gap-0.5 py-2 px-2 border-b-2 border-transparent',
              'md:flex-row md:justify-center md:gap-2 md:py-2 md:px-4',
              isActive
                ? `${tab.activeBg} border-b-current ${tab.badgeText}`
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
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
        );
      })}
    </div>
  );
});
