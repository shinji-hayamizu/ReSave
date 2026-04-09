import { useState } from 'react';
import { View, Alert, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { TagForm } from '@/components/tags/TagForm';
import { Button } from '@/components/ui/Button';
import { useTags, useUpdateTag, useDeleteTag } from '@/hooks/useTags';

export default function TagDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: tagsData, isLoading } = useTags();
  const updateTag = useUpdateTag();
  const deleteTag = useDeleteTag();
  const [error, setError] = useState<string | undefined>();

  const tag = tagsData?.data.find((t) => t.id === id);

  const handleSubmit = (values: { name: string; color: string }) => {
    if (!id) return;
    setError(undefined);
    updateTag.mutate(
      { id, input: values },
      {
        onSuccess: () => router.back(),
        onError: () => setError('タグの更新に失敗しました'),
      }
    );
  };

  const handleDelete = () => {
    if (!id) return;
    Alert.alert('タグの削除', 'このタグを削除しますか?', [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: '削除',
        style: 'destructive',
        onPress: () => {
          deleteTag.mutate(id, {
            onSuccess: () => router.back(),
            onError: () => setError('タグの削除に失敗しました'),
          });
        },
      },
    ]);
  };

  if (isLoading || !tag) {
    return (
      <>
        <Stack.Screen options={{ title: 'タグ編集' }} />
        <View className="flex-1 items-center justify-center bg-white">
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: 'タグ編集' }} />
      <View className="flex-1">
        <TagForm
          initialValues={{ name: tag.name, color: tag.color }}
          onSubmit={handleSubmit}
          loading={updateTag.isPending}
          submitLabel="保存する"
          error={error}
        />
        <View className="px-4 pb-6">
          <Button
            variant="destructive"
            onPress={handleDelete}
            loading={deleteTag.isPending}
          >
            タグを削除
          </Button>
        </View>
      </View>
    </>
  );
}
