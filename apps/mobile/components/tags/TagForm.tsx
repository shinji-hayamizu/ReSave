import { useState, useCallback } from 'react';
import { View, Text, Pressable, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { FormAlert } from '@/components/ui/FormAlert';

const COLOR_OPTIONS = [
  { name: 'blue', hex: '#3b82f6' },
  { name: 'green', hex: '#22c55e' },
  { name: 'purple', hex: '#a855f7' },
  { name: 'orange', hex: '#f97316' },
  { name: 'pink', hex: '#ec4899' },
  { name: 'cyan', hex: '#06b6d4' },
  { name: 'yellow', hex: '#eab308' },
  { name: 'gray', hex: '#6b7280' },
] as const;

interface TagFormProps {
  initialValues?: { name: string; color: string };
  onSubmit: (values: { name: string; color: string }) => void;
  loading: boolean;
  submitLabel: string;
  error?: string;
}

export function TagForm({ initialValues, onSubmit, loading, submitLabel, error }: TagFormProps) {
  const [name, setName] = useState(initialValues?.name ?? '');
  const [color, setColor] = useState(initialValues?.color ?? 'blue');
  const [validationError, setValidationError] = useState<string | undefined>();

  const handleSubmit = useCallback(() => {
    if (!name.trim()) {
      setValidationError('タグ名を入力してください');
      return;
    }
    setValidationError(undefined);
    onSubmit({ name: name.trim(), color });
  }, [name, color, onSubmit]);

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
        {displayError && <FormAlert message={displayError} variant="error" />}

        <Input
          label="タグ名"
          placeholder="タグ名を入力"
          value={name}
          onChangeText={setName}
        />

        <View>
          <Text className="text-sm font-medium text-gray-600 mb-3">カラー</Text>
          <View className="flex-row flex-wrap gap-3">
            {COLOR_OPTIONS.map((option) => {
              const isSelected = color === option.name;
              return (
                <Pressable
                  key={option.name}
                  onPress={() => setColor(option.name)}
                  className="items-center justify-center"
                >
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      backgroundColor: option.hex,
                      borderWidth: isSelected ? 3 : 0,
                      borderColor: '#1e40af',
                    }}
                  />
                </Pressable>
              );
            })}
          </View>
        </View>

        <View className="pt-4">
          <Button loading={loading} onPress={handleSubmit}>
            {submitLabel}
          </Button>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
