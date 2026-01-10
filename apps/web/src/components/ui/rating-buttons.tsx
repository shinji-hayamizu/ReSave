'use client'

import { cn } from '@/lib/utils'

type Rating = 'ok' | 'learned' | 'again'

interface RatingButtonsProps {
  onRate: (rating: Rating) => void
  intervals?: { ok?: string; again?: string }
  disabled?: boolean
  showAgain?: boolean
  className?: string
}

const ratingConfig = {
  ok: {
    label: 'OK',
    className: 'bg-success/10 text-success hover:bg-success hover:text-success-foreground',
  },
  learned: {
    label: '覚えた',
    preview: '完了',
    className: 'bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground',
  },
  again: {
    label: 'もう一度',
    className: 'bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground',
  },
} as const

export function RatingButtons({
  onRate,
  intervals,
  disabled,
  showAgain = true,
  className,
}: RatingButtonsProps) {
  const ratings = showAgain ? (['ok', 'learned', 'again'] as const) : (['ok', 'learned'] as const)

  return (
    <div className={cn('flex gap-1.5', className)}>
      {ratings.map((rating) => (
        <button
          key={rating}
          type="button"
          disabled={disabled}
          className={cn(
            'flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium',
            'transition-colors disabled:opacity-50 disabled:pointer-events-none',
            ratingConfig[rating].className
          )}
          onClick={() => onRate(rating)}
        >
          <span className="font-semibold">{ratingConfig[rating].label}</span>
          <span className="text-xs opacity-85">
            {rating === 'learned'
              ? ratingConfig[rating].preview
              : intervals?.[rating as 'ok' | 'again']}
          </span>
        </button>
      ))}
    </div>
  )
}

export type { Rating, RatingButtonsProps }
