import { useState } from 'react';
import { View, Text, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Link } from 'expo-router';
import { Input } from '@/components/ui/Input';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { Button } from '@/components/ui/Button';
import { FormAlert } from '@/components/ui/FormAlert';
import { useAuthContext } from '@/lib/auth/AuthProvider';
import { loginSchema } from '@/validations/user';

export default function LoginScreen() {
  const { signIn } = useAuthContext();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setErrors({});
    setApiError(null);

    const result = loginSchema.safeParse({ email, password });
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
    const { error } = await signIn(email, password);
    setLoading(false);

    if (error) {
      setApiError(error);
    }
  };

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
            ログイン
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

          <PasswordInput
            label="パスワード"
            placeholder="パスワードを入力"
            value={password}
            onChangeText={setPassword}
            error={errors.password}
            autoComplete="password"
          />

          <Button onPress={handleSubmit} loading={loading} className="mt-2">
            ログイン
          </Button>
        </View>

        <View className="mt-6 gap-3 items-center">
          <Link href="/(auth)/reset-password">
            <Text className="text-sm text-blue-600">
              パスワードを忘れた場合
            </Text>
          </Link>
          <Link href="/(auth)/signup">
            <Text className="text-sm text-gray-600">
              アカウントをお持ちでない方は
              <Text className="text-blue-600 font-medium"> 新規登録</Text>
            </Text>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
