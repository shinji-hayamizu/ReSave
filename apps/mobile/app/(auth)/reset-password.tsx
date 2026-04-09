import { useState } from 'react';
import { View, Text, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Link } from 'expo-router';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { FormAlert } from '@/components/ui/FormAlert';
import { useAuthContext } from '@/lib/auth/AuthProvider';
import { resetPasswordSchema } from '@/validations/user';

export default function ResetPasswordScreen() {
  const { resetPassword } = useAuthContext();
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setErrors({});
    setApiError(null);

    const result = resetPasswordSchema.safeParse({ email });
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0];
        if (typeof field === 'string') {
          fieldErrors[field] = issue.message;
        }
      }
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);
    const { error } = await resetPassword(email);
    setLoading(false);

    if (error) {
      setApiError(error);
    } else {
      setSuccess(true);
    }
  };

  if (success) {
    return (
      <View className="flex-1 justify-center items-center px-6">
        <FormAlert
          variant="success"
          message="パスワードリセットメールを送信しました。メールをご確認ください。"
          className="mb-6"
        />
        <Link href="/(auth)/login">
          <Text className="text-blue-600 font-medium">ログインへ戻る</Text>
        </Link>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      className="flex-1"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerClassName="flex-1 justify-center px-6 py-12"
        keyboardShouldPersistTaps="handled"
      >
        <View className="mb-10">
          <Text className="text-3xl font-bold text-gray-900 text-center">
            ReSave
          </Text>
          <Text className="text-base text-gray-500 text-center mt-2">
            パスワードリセット
          </Text>
        </View>

        {apiError && (
          <FormAlert variant="error" message={apiError} className="mb-4" />
        )}

        <View className="gap-4">
          <Input
            label="メールアドレス"
            placeholder="mail@example.com"
            value={email}
            onChangeText={setEmail}
            error={errors.email}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />

          <Button onPress={handleSubmit} loading={loading} className="mt-2">
            リセットメールを送信
          </Button>
        </View>

        <View className="mt-6 items-center">
          <Link href="/(auth)/login">
            <Text className="text-sm text-blue-600">ログインへ戻る</Text>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
