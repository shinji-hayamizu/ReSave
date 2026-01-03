import { Pressable, Text, type PressableProps, ActivityIndicator } from 'react-native'
import { cn } from '@/lib/cn'

type ButtonVariant = 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
type ButtonSize = 'default' | 'sm' | 'lg' | 'icon'

interface ButtonProps extends Omit<PressableProps, 'children'> {
  children: React.ReactNode
  variant?: ButtonVariant
  size?: ButtonSize
  className?: string
  textClassName?: string
  loading?: boolean
}

const variantStyles: Record<ButtonVariant, { container: string; text: string }> = {
  default: {
    container: 'bg-blue-600 active:bg-blue-700',
    text: 'text-white',
  },
  destructive: {
    container: 'bg-red-500 active:bg-red-600',
    text: 'text-white',
  },
  outline: {
    container: 'border border-gray-300 bg-white active:bg-gray-100',
    text: 'text-gray-900',
  },
  secondary: {
    container: 'bg-gray-100 active:bg-gray-200',
    text: 'text-gray-900',
  },
  ghost: {
    container: 'active:bg-gray-100',
    text: 'text-gray-900',
  },
  link: {
    container: '',
    text: 'text-blue-600',
  },
}

const sizeStyles: Record<ButtonSize, { container: string; text: string }> = {
  default: {
    container: 'h-11 px-5 py-2.5',
    text: 'text-base',
  },
  sm: {
    container: 'h-9 px-3 py-2',
    text: 'text-sm',
  },
  lg: {
    container: 'h-12 px-8 py-3',
    text: 'text-lg',
  },
  icon: {
    container: 'h-11 w-11 p-0',
    text: '',
  },
}

export function Button({
  children,
  variant = 'default',
  size = 'default',
  className,
  textClassName,
  loading = false,
  disabled,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading

  return (
    <Pressable
      className={cn(
        'flex-row items-center justify-center rounded-lg',
        variantStyles[variant].container,
        sizeStyles[size].container,
        isDisabled && 'opacity-50',
        className
      )}
      disabled={isDisabled}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'default' || variant === 'destructive' ? '#ffffff' : '#374151'}
        />
      ) : typeof children === 'string' ? (
        <Text
          className={cn(
            'font-medium text-center',
            variantStyles[variant].text,
            sizeStyles[size].text,
            textClassName
          )}
        >
          {children}
        </Text>
      ) : (
        children
      )}
    </Pressable>
  )
}

export type { ButtonProps, ButtonVariant, ButtonSize }
