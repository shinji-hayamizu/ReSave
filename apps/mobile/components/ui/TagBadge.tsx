import { View, Text } from 'react-native'
import { cn } from '@/lib/cn'

interface TagBadgeProps {
  children: React.ReactNode
  className?: string
}

export function TagBadge({ children, className }: TagBadgeProps) {
  return (
    <View
      className={cn(
        'flex-row items-center px-3 py-1',
        'bg-sky-100 border border-sky-200',
        'rounded-full',
        className
      )}
    >
      <Text className="text-xs font-medium text-sky-700">
        {children}
      </Text>
    </View>
  )
}

export type { TagBadgeProps }
