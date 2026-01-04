import { memo, useCallback, useMemo } from 'react';
import { View, Text, FlatList, type ListRenderItemInfo } from 'react-native';

import { EmptyState } from '@/components/ui/EmptyState';
import { StudyCard } from '@/components/ui/StudyCard';
import { TagBadge } from '@/components/ui/TagBadge';
import { cn } from '@/lib/cn';
import type { CardWithTags } from '@/types/card';

interface MobileCardListProps {
  cards: CardWithTags[] | undefined;
  isLoading?: boolean;
  emptyMessage?: string;
  onCardPress?: (card: CardWithTags) => void;
  className?: string;
}

function LoadingState() {
  return (
    <View className="space-y-4 px-4">
      {[1, 2, 3].map((i) => (
        <View key={i} className="bg-white rounded-xl shadow-sm p-4 space-y-3">
          <View className="h-4 w-3/4 bg-gray-200 rounded animate-pulse" />
          <View className="h-4 w-1/2 bg-gray-200 rounded animate-pulse" />
          <View className="flex-row gap-2">
            <View className="h-6 w-16 bg-gray-200 rounded-full animate-pulse" />
            <View className="h-6 w-16 bg-gray-200 rounded-full animate-pulse" />
          </View>
        </View>
      ))}
    </View>
  );
}

const MobileCardItem = memo(function MobileCardItem({
  card,
  onCardPress,
}: {
  card: CardWithTags;
  onCardPress?: (card: CardWithTags) => void;
}) {
  const handleEdit = useCallback(() => {
    onCardPress?.(card);
  }, [card, onCardPress]);

  const tags = useMemo(() => {
    if (card.tags.length === 0) {
      return undefined;
    }
    return (
      <>
        {card.tags.map((tag) => (
          <TagBadge key={tag.id}>{tag.name}</TagBadge>
        ))}
      </>
    );
  }, [card.tags]);

  return (
    <StudyCard
      answer={card.back}
      onEdit={handleEdit}
      question={card.front}
      tags={tags}
    />
  );
});

export const MobileCardList = memo(function MobileCardList({
  cards,
  isLoading,
  emptyMessage = 'カードがありません',
  onCardPress,
  className,
}: MobileCardListProps) {
  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<CardWithTags>) => (
      <MobileCardItem card={item} onCardPress={onCardPress} />
    ),
    [onCardPress]
  );

  const keyExtractor = useCallback((item: CardWithTags) => item.id, []);

  const ItemSeparatorComponent = useCallback(
    () => <View className="h-4" />,
    []
  );

  const ListEmptyComponent = useMemo(
    () => (
      <EmptyState
        description="新しいカードを作成してください"
        title={emptyMessage}
      />
    ),
    [emptyMessage]
  );

  if (isLoading) {
    return <LoadingState />;
  }

  return (
    <View className={cn('flex-1', className)}>
      <FlatList
        ItemSeparatorComponent={ItemSeparatorComponent}
        ListEmptyComponent={ListEmptyComponent}
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 16 }}
        data={cards}
        initialNumToRender={10}
        keyExtractor={keyExtractor}
        maxToRenderPerBatch={5}
        removeClippedSubviews
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        windowSize={5}
      />
    </View>
  );
});
