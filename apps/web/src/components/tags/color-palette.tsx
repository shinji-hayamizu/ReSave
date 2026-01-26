'use client';

import { cn } from '@/lib/utils';

export const TAG_COLORS = {
  blue: {
    bg: 'bg-sky-100',
    text: 'text-sky-700',
    border: 'border-sky-200',
    swatch: 'bg-sky-600',
  },
  green: {
    bg: 'bg-green-100',
    text: 'text-green-700',
    border: 'border-green-200',
    swatch: 'bg-green-600',
  },
  purple: {
    bg: 'bg-violet-100',
    text: 'text-violet-700',
    border: 'border-violet-200',
    swatch: 'bg-violet-600',
  },
  orange: {
    bg: 'bg-orange-100',
    text: 'text-orange-700',
    border: 'border-orange-200',
    swatch: 'bg-orange-600',
  },
  pink: {
    bg: 'bg-pink-100',
    text: 'text-pink-700',
    border: 'border-pink-200',
    swatch: 'bg-pink-600',
  },
  cyan: {
    bg: 'bg-cyan-100',
    text: 'text-cyan-700',
    border: 'border-cyan-200',
    swatch: 'bg-cyan-600',
  },
  yellow: {
    bg: 'bg-yellow-100',
    text: 'text-yellow-700',
    border: 'border-yellow-200',
    swatch: 'bg-yellow-600',
  },
  gray: {
    bg: 'bg-slate-100',
    text: 'text-slate-600',
    border: 'border-slate-200',
    swatch: 'bg-slate-500',
  },
} as const;

export type TagColorName = keyof typeof TAG_COLORS;

export const TAG_COLOR_NAMES: TagColorName[] = [
  'blue',
  'green',
  'purple',
  'orange',
  'pink',
  'cyan',
  'yellow',
  'gray',
];

interface ColorPaletteProps {
  value: TagColorName;
  onChange: (color: TagColorName) => void;
}

export function ColorPalette({ value, onChange }: ColorPaletteProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {TAG_COLOR_NAMES.map((colorName) => {
        const color = TAG_COLORS[colorName];
        const isSelected = value === colorName;

        return (
          <button
            key={colorName}
            type="button"
            data-testid="color-button"
            data-selected={isSelected}
            onClick={() => onChange(colorName)}
            className={cn(
              'h-8 w-8 rounded-full transition-transform hover:scale-110',
              'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
              color.swatch,
              isSelected && 'ring-2 ring-foreground ring-offset-2'
            )}
            title={colorName}
            aria-label={`${colorName}色を選択`}
            aria-pressed={isSelected}
          >
            {isSelected && (
              <span className="flex h-full w-full items-center justify-center">
                <span className="h-3 w-3 rounded-full bg-white" />
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export function getTagColorClasses(colorName: string): string {
  const color = TAG_COLORS[colorName as TagColorName];
  if (!color) {
    return TAG_COLORS.blue.bg + ' ' + TAG_COLORS.blue.text + ' ' + TAG_COLORS.blue.border;
  }
  return `${color.bg} ${color.text} ${color.border}`;
}
