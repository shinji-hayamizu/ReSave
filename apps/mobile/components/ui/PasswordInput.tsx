import { useState } from 'react'
import { TextInput, type TextInputProps, View, Text, Pressable } from 'react-native'
import { cn } from '@/lib/cn'

interface PasswordInputProps extends Omit<TextInputProps, 'secureTextEntry'> {
  label?: string
  error?: string
  containerClassName?: string
  showToggle?: boolean
}

function EyeIcon({ size = 20, color = '#6b7280' }: { size?: number; color?: string }) {
  return (
    <View style={{ width: size, height: size }}>
      <Text style={{ color, fontSize: size }}>
        {'\u{1F441}'}
      </Text>
    </View>
  )
}

function EyeOffIcon({ size = 20, color = '#6b7280' }: { size?: number; color?: string }) {
  return (
    <View style={{ width: size, height: size }}>
      <Text style={{ color, fontSize: size }}>
        {'\u{1F576}'}
      </Text>
    </View>
  )
}

export function PasswordInput({
  label,
  error,
  className,
  containerClassName,
  showToggle = true,
  ...props
}: PasswordInputProps) {
  const [isVisible, setIsVisible] = useState(false)

  return (
    <View className={cn('w-full', containerClassName)}>
      {label && (
        <Text className="text-sm font-medium text-gray-600 mb-1.5">
          {label}
        </Text>
      )}
      <View className="relative">
        <TextInput
          className={cn(
            'w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-base text-gray-900',
            'placeholder:text-gray-400',
            showToggle && 'pr-12',
            error && 'border-red-500',
            className
          )}
          secureTextEntry={!isVisible}
          placeholderTextColor="#9ca3af"
          {...props}
        />
        {showToggle && (
          <Pressable
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1"
            onPress={() => setIsVisible(!isVisible)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            {isVisible ? (
              <EyeOffIcon size={20} color="#6b7280" />
            ) : (
              <EyeIcon size={20} color="#6b7280" />
            )}
          </Pressable>
        )}
      </View>
      {error && (
        <Text className="text-xs text-red-500 mt-1">
          {error}
        </Text>
      )}
    </View>
  )
}

export type { PasswordInputProps }
