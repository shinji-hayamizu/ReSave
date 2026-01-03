import { View, Text } from 'react-native'
import { cn } from '@/lib/cn'

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

function InboxIcon() {
  return <Text className="text-5xl text-gray-300">{'\u{1F4E5}'}</Text>
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <View
      className={cn(
        'items-center justify-center py-12 px-5',
        className
      )}
    >
      <View className="mb-4">
        {icon || <InboxIcon />}
      </View>
      <Text className="text-base font-medium text-gray-600 text-center mb-2">
        {title}
      </Text>
      {description && (
        <Text className="text-sm text-gray-400 text-center mb-4">
          {description}
        </Text>
      )}
      {action && <View className="mt-2">{action}</View>}
    </View>
  )
}

export type { EmptyStateProps }
