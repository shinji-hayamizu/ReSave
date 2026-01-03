import { useState } from 'react'
import { View, Text, Pressable } from 'react-native'
import { cn } from '@/lib/cn'

interface StudyCardProps {
  question: string
  answer?: string
  tags?: React.ReactNode
  ratingButtons?: React.ReactNode
  onEdit?: () => void
  defaultOpen?: boolean
  className?: string
}

function EyeIcon() {
  return <Text className="text-base">{'\u{1F441}'}</Text>
}

function EyeOffIcon() {
  return <Text className="text-base">{'\u{1F576}'}</Text>
}

function PencilIcon() {
  return <Text className="text-sm">{'\u{270F}'}</Text>
}

export function StudyCard({
  question,
  answer,
  tags,
  ratingButtons,
  onEdit,
  defaultOpen = false,
  className,
}: StudyCardProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <View
      className={cn(
        'bg-white rounded-xl overflow-hidden shadow-sm',
        className
      )}
    >
      {(ratingButtons || tags) && (
        <View className="flex-row items-center justify-between gap-3 px-4 py-3 bg-white">
          {ratingButtons && <View className="flex-shrink-0">{ratingButtons}</View>}
          {tags && (
            <View className="flex-row flex-wrap gap-1.5 justify-end flex-1">
              {tags}
            </View>
          )}
        </View>
      )}

      <View className="px-5 py-4">
        <View className="flex-row items-start justify-between gap-3">
          <Text className="text-base text-gray-900 leading-relaxed flex-1">
            {question}
          </Text>
          {onEdit && (
            <Pressable
              className="h-8 w-8 items-center justify-center rounded-lg bg-gray-100 active:bg-gray-200"
              onPress={onEdit}
            >
              <PencilIcon />
            </Pressable>
          )}
        </View>
      </View>

      {answer && (
        <>
          <Pressable
            className="flex-row items-center justify-center gap-2 py-3 bg-white active:bg-gray-50"
            onPress={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <EyeOffIcon /> : <EyeIcon />}
            <Text className="text-sm font-medium text-blue-600">
              {isOpen ? '\u7B54\u3048\u3092\u96A0\u3059' : '\u7B54\u3048\u3092\u898B\u308B'}
            </Text>
          </Pressable>

          {isOpen && (
            <View className="px-5 py-4 bg-white">
              <View className="px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg">
                <Text className="text-base text-gray-900 leading-relaxed">
                  {answer}
                </Text>
              </View>
            </View>
          )}
        </>
      )}
    </View>
  )
}

export type { StudyCardProps }
