import { View, Text } from 'react-native'
import { cn } from '@/lib/cn'

interface ProgressBarProps {
  value: number
  max?: number
  label?: string
  showPercentage?: boolean
  className?: string
  barClassName?: string
}

export function ProgressBar({
  value,
  max = 100,
  label,
  showPercentage = false,
  className,
  barClassName,
}: ProgressBarProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100)

  return (
    <View className={cn('w-full', className)}>
      <View className="h-2 bg-gray-100 rounded-full overflow-hidden mb-1">
        <View
          className={cn(
            'h-full bg-blue-600 rounded-full',
            barClassName
          )}
          style={{ width: `${percentage}%` }}
        />
      </View>
      {(label || showPercentage) && (
        <View className="flex-row justify-between">
          {label && (
            <Text className="text-xs text-gray-500">{label}</Text>
          )}
          {showPercentage && (
            <Text className="text-xs text-gray-500 text-right">
              {Math.round(percentage)}%
            </Text>
          )}
        </View>
      )}
    </View>
  )
}

export type { ProgressBarProps }
