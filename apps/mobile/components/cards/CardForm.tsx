import { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from 'react-native';
import { z } from 'zod';

import { Button } from '@/components/ui/Button';
import { FormAlert } from '@/components/ui/FormAlert';
import { Input } from '@/components/ui/Input';
import { useTags } from '@/hooks/useTags';

const cardFormSchema = z.object({
  front: z.string().trim().min(1, '表面を入力してください'),
  back: z.string(),
  tagIds: z.array(z.string()),
});

interface CardFormValues {
  front: string;
  back: string;
  tagIds: string[];
}

interface CardFormProps {
  initialValues?: Partial<CardFormValues>;
  onSubmit: (values: CardFormValues) => void;
  loading: boolean;
  submitLabel: string;
  error?: string;
}

export function CardForm({
  initialValues,
  onSubmit,
  loading,
  submitLabel,
  error,
}: CardFormProps) {
  const [front, setFront] = useState(initialValues?.front ?? '');
  const [back, setBack] = useState(initialValues?.back ?? '');
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(
    initialValues?.tagIds ?? []
  );
  const [validationError, setValidationError] = useState<string | undefined>(
    undefined
  );

  const { data: tagsResponse } = useTags();
  const tags = useMemo(() => tagsResponse?.data ?? [], [tagsResponse]);

  const handleToggleTag = useCallback((tagId: string) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId]
    );
  }, []);

  const handleSubmit = useCallback(() => {
    const result = cardFormSchema.safeParse({
      front,
      back,
      tagIds: selectedTagIds,
    });

    if (!result.success) {
      const firstError = result.error.issues[0];
      setValidationError(firstError?.message);
      return;
    }

    setValidationError(undefined);
    onSubmit(result.data);
  }, [front, back, selectedTagIds, onSubmit]);

  const displayError = validationError ?? error;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1"
    >
      <ScrollView
        className="flex-1 bg-gray-50"
        contentContainerStyle={{ padding: 16, gap: 16 }}
        keyboardShouldPersistTaps="handled"
      >
        {displayError && (
          <FormAlert message={displayError} variant="error" />
        )}

        <Input
          label="表面 *"
          multiline
          numberOfLines={4}
          onChangeText={setFront}
          placeholder="質問や覚えたい内容を入力"
          style={{ minHeight: 100, textAlignVertical: 'top' }}
          value={front}
        />

        <Input
          label="裏面"
          multiline
          numberOfLines={4}
          onChangeText={setBack}
          placeholder="答えや説明を入力"
          style={{ minHeight: 100, textAlignVertical: 'top' }}
          value={back}
        />

        {tags.length > 0 && (
          <View>
            <Text className="text-sm font-medium text-gray-600 mb-2">
              タグ
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {tags.map((tag) => {
                const isSelected = selectedTagIds.includes(tag.id);
                return (
                  <Pressable
                    key={tag.id}
                    className={
                      isSelected
                        ? 'flex-row items-center px-3 py-1 bg-blue-500 border border-blue-600 rounded-full'
                        : 'flex-row items-center px-3 py-1 bg-gray-100 border border-gray-200 rounded-full'
                    }
                    onPress={() => handleToggleTag(tag.id)}
                  >
                    <Text
                      className={
                        isSelected
                          ? 'text-xs font-medium text-white'
                          : 'text-xs font-medium text-gray-600'
                      }
                    >
                      {tag.name}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}

        <View className="pt-4">
          <Button loading={loading} onPress={handleSubmit}>
            {submitLabel}
          </Button>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
