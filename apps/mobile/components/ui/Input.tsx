import { TextInput, type TextInputProps, View, Text } from 'react-native'
import { cn } from '@/lib/cn'

interface InputProps extends TextInputProps {
  label?: string
  error?: string
  containerClassName?: string
}

export function Input({
  label,
  error,
  className,
  containerClassName,
  ...props
}: InputProps) {
  return (
    <View className={cn('w-full', containerClassName)}>
      {label && (
        <Text className="text-sm font-medium text-gray-600 mb-1.5">
          {label}
        </Text>
      )}
      <TextInput
        className={cn(
          'w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-base text-gray-900',
          'placeholder:text-gray-400',
          error && 'border-red-500',
          className
        )}
        placeholderTextColor="#9ca3af"
        {...props}
      />
      {error && (
        <Text className="text-xs text-red-500 mt-1">
          {error}
        </Text>
      )}
    </View>
  )
}

export type { InputProps }
