import { View, Text, Pressable } from 'react-native';
import type { Tag } from '@/types/tag';

const COLOR_MAP: Record<string, string> = {
  blue: '#3b82f6',
  green: '#22c55e',
  purple: '#a855f7',
  orange: '#f97316',
  pink: '#ec4899',
  cyan: '#06b6d4',
  yellow: '#eab308',
  gray: '#6b7280',
};

interface TagListItemProps {
  tag: Tag;
  onPress: (tag: Tag) => void;
  onLongPress?: (tag: Tag) => void;
}

export function TagListItem({ tag, onPress, onLongPress }: TagListItemProps) {
  const colorHex = COLOR_MAP[tag.color] ?? '#6b7280';

  return (
    <Pressable
      className="flex-row items-center px-4 py-4 bg-white active:bg-gray-50"
      onPress={() => onPress(tag)}
      onLongPress={() => onLongPress?.(tag)}
    >
      <View
        style={{
          width: 12,
          height: 12,
          borderRadius: 6,
          backgroundColor: colorHex,
          marginRight: 12,
        }}
      />
      <Text className="text-base text-gray-900 flex-1">{tag.name}</Text>
    </Pressable>
  );
}
