import { useCallback, useLayoutEffect } from 'react';
import { View, Text, FlatList, Pressable, ActivityIndicator } from 'react-native';
import { useRouter, useNavigation } from 'expo-router';
import { TagListItem } from '@/components/tags/TagListItem';
import { EmptyState } from '@/components/ui/EmptyState';
import { useTags } from '@/hooks/useTags';
import type { Tag } from '@/types/tag';

export default function TagsScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { data, isLoading, refetch, isRefetching } = useTags();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable
          className="mr-2 h-8 w-8 items-center justify-center rounded-lg active:bg-gray-100"
          onPress={() => router.push('/tags/new' as never)}
        >
          <Text className="text-2xl text-blue-600">+</Text>
        </Pressable>
      ),
    });
  }, [navigation, router]);

  const handleTagPress = useCallback(
    (tag: Tag) => {
      router.push(`/tags/${tag.id}` as never);
    },
    [router]
  );

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  const tags = data?.data ?? [];

  return (
    <View className="flex-1 bg-gray-50">
      <FlatList
        data={tags}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TagListItem tag={item} onPress={handleTagPress} />
        )}
        ItemSeparatorComponent={() => <View className="h-px bg-gray-100" />}
        ListEmptyComponent={
          <EmptyState
            title="タグがありません"
            description="タグを作成してカードを整理しましょう"
          />
        }
        contentContainerStyle={tags.length === 0 ? { flex: 1, justifyContent: 'center' } : undefined}
        onRefresh={refetch}
        refreshing={isRefetching}
      />
    </View>
  );
}
