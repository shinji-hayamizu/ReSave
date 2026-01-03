import { View, Text, Pressable } from 'react-native'
import { cn } from '@/lib/cn'

type AlertVariant = 'error' | 'warning' | 'success' | 'info'

interface FormAlertProps {
  variant?: AlertVariant
  message: string
  linkText?: string
  onLinkPress?: () => void
  className?: string
}

const variantStyles: Record<AlertVariant, { container: string; text: string; link: string }> = {
  error: {
    container: 'bg-red-50 border-red-200',
    text: 'text-red-600',
    link: 'text-red-700',
  },
  warning: {
    container: 'bg-amber-50 border-amber-200',
    text: 'text-amber-600',
    link: 'text-amber-700',
  },
  success: {
    container: 'bg-emerald-50 border-emerald-200',
    text: 'text-emerald-600',
    link: 'text-emerald-700',
  },
  info: {
    container: 'bg-blue-50 border-blue-200',
    text: 'text-blue-600',
    link: 'text-blue-700',
  },
}

export function FormAlert({
  variant = 'error',
  message,
  linkText,
  onLinkPress,
  className,
}: FormAlertProps) {
  const styles = variantStyles[variant]

  return (
    <View
      className={cn(
        'px-4 py-3 rounded-lg border',
        styles.container,
        className
      )}
    >
      <Text className={cn('text-sm', styles.text)}>
        {message}
        {linkText && onLinkPress && (
          <>
            {' '}
            <Pressable onPress={onLinkPress}>
              <Text className={cn('text-sm font-semibold underline', styles.link)}>
                {linkText}
              </Text>
            </Pressable>
          </>
        )}
      </Text>
    </View>
  )
}

export type { FormAlertProps, AlertVariant }
