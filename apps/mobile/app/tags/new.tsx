import { useState } from 'react';
import { useRouter, Stack } from 'expo-router';
import { TagForm } from '@/components/tags/TagForm';
import { useCreateTag } from '@/hooks/useTags';

export default function NewTagScreen() {
  const router = useRouter();
  const createTag = useCreateTag();
  const [error, setError] = useState<string | undefined>();

  const handleSubmit = (values: { name: string; color: string }) => {
    setError(undefined);
    createTag.mutate(values, {
      onSuccess: () => router.back(),
      onError: () => setError('タグの作成に失敗しました'),
    });
  };

  return (
    <>
      <Stack.Screen options={{ title: 'タグ作成' }} />
      <TagForm
        onSubmit={handleSubmit}
        loading={createTag.isPending}
        submitLabel="作成する"
        error={error}
      />
    </>
  );
}
