import { useState } from 'react';
import { View, Text, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Link } from 'expo-router';
import { Input } from '@/components/ui/Input';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { Button } from '@/components/ui/Button';
import { FormAlert } from '@/components/ui/FormAlert';
import { useAuthContext } from '@/lib/auth/AuthProvider';
import { signupSchema } from '@/validations/user';

export default function SignupScreen() {
  const { signUp } = useAuthContext();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setErrors({});
    setApiError(null);

    const result = signupSchema.safeParse({ email, password, confirmPassword });
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
    const { error } = await signUp(email, password);
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
          message="確認メールを送信しました。メールのリンクをクリックして登録を完了してください。"
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
            新規登録
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
            placeholder="8文字以上、英字と数字を含む"
            value={password}
            onChangeText={setPassword}
            error={errors.password}
            autoComplete="new-password"
          />

          <PasswordInput
            label="パスワード(確認)"
            placeholder="パスワードをもう一度入力"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            error={errors.confirmPassword}
            autoComplete="new-password"
          />

          <Button onPress={handleSubmit} loading={loading} className="mt-2">
            登録する
          </Button>
        </View>

        <View className="mt-6 items-center">
          <Link href="/(auth)/login">
            <Text className="text-sm text-gray-600">
              既にアカウントをお持ちの方は
              <Text className="text-blue-600 font-medium"> ログイン</Text>
            </Text>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
