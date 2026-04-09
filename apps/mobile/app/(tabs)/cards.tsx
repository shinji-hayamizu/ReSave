import { useState, useCallback, useLayoutEffect } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useRouter, useNavigation } from 'expo-router';

import { MobileCardList } from '@/components/cards/MobileCardList';
import { useCards } from '@/hooks/useCards';
import type { CardStatus, CardWithTags } from '@/types/card';

const STATUS_OPTIONS: { value: CardStatus; label: string }[] = [
  { value: 'all', label: 'すべて' },
  { value: 'due', label: '期限あり' },
  { value: 'completed', label: '完了' },
];

export default function CardsScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const [status, setStatus] = useState<CardStatus>('all');

  const filters = status === 'all' ? undefined : { status };
  const { data, isLoading, refetch, isRefetching } = useCards(filters);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable
          className="mr-2 h-8 w-8 items-center justify-center rounded-lg active:bg-gray-100"
          onPress={() => router.push('/cards/new')}
        >
          <Text className="text-2xl text-blue-600">+</Text>
        </Pressable>
      ),
    });
  }, [navigation, router]);

  const handleCardPress = useCallback(
    (card: CardWithTags) => {
      router.push(`/cards/${card.id}`);
    },
    [router]
  );

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  return (
    <View className="flex-1 bg-gray-50">
      <View className="flex-row gap-2 px-4 py-3 bg-white border-b border-gray-100">
        {STATUS_OPTIONS.map((option) => {
          const isActive = status === option.value;
          return (
            <Pressable
              key={option.value}
              className={
                isActive
                  ? 'px-4 py-2 rounded-full bg-blue-600'
                  : 'px-4 py-2 rounded-full bg-gray-100 active:bg-gray-200'
              }
              onPress={() => setStatus(option.value)}
            >
              <Text
                className={
                  isActive
                    ? 'text-sm font-medium text-white'
                    : 'text-sm font-medium text-gray-600'
                }
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <MobileCardList
        cards={data?.data}
        isLoading={isLoading}
        onCardPress={handleCardPress}
        onRefresh={handleRefresh}
        refreshing={isRefetching}
      />
    </View>
  );
}
