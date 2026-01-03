import { View, Text, Pressable } from 'react-native'
import { cn } from '@/lib/cn'

type Rating = 'ok' | 'learned' | 'again'

interface RatingButtonsProps {
  onRate: (rating: Rating) => void
  intervals?: { ok?: string; again?: string }
  disabled?: boolean
  className?: string
}

const ratingConfig = {
  ok: {
    label: 'OK',
    bgClass: 'bg-emerald-100',
    bgActiveClass: 'bg-emerald-500',
    textClass: 'text-emerald-600',
    textActiveClass: 'text-white',
  },
  learned: {
    label: '\u899A\u3048\u305F',
    preview: '\u5B8C\u4E86',
    bgClass: 'bg-blue-100',
    bgActiveClass: 'bg-blue-500',
    textClass: 'text-blue-600',
    textActiveClass: 'text-white',
  },
  again: {
    label: '\u3082\u3046\u4E00\u5EA6',
    bgClass: 'bg-red-100',
    bgActiveClass: 'bg-red-500',
    textClass: 'text-red-500',
    textActiveClass: 'text-white',
  },
} as const

export function RatingButtons({
  onRate,
  intervals,
  disabled,
  className,
}: RatingButtonsProps) {
  return (
    <View className={cn('flex-row gap-1.5', className)}>
      {(['ok', 'learned', 'again'] as const).map((rating) => (
        <Pressable
          key={rating}
          disabled={disabled}
          className={cn(
            'flex-row items-center gap-1.5 px-3.5 py-2 rounded-lg',
            ratingConfig[rating].bgClass,
            disabled && 'opacity-50'
          )}
          onPress={() => onRate(rating)}
        >
          <Text
            className={cn(
              'text-sm font-semibold',
              ratingConfig[rating].textClass
            )}
          >
            {ratingConfig[rating].label}
          </Text>
          <Text
            className={cn(
              'text-xs',
              ratingConfig[rating].textClass,
              'opacity-85'
            )}
          >
            {rating === 'learned'
              ? ratingConfig[rating].preview
              : intervals?.[rating as 'ok' | 'again']}
          </Text>
        </Pressable>
      ))}
    </View>
  )
}

export type { Rating, RatingButtonsProps }
