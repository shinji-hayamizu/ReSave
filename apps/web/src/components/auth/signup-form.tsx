'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { GoogleIcon } from '@/components/icons/google-icon';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { createClient } from '@/lib/supabase/client';
import { signupSchema } from '@/validations/user';

import type { SignupInput } from '@/validations/user';

function getSignupErrorMessage(error: { code?: string; message?: string; status?: number }): string {
  if (error.code === 'user_already_exists') {
    return 'このメールアドレスはすでに登録されています';
  }
  if (error.code === 'weak_password') {
    return 'パスワードが弱すぎます。8文字以上の英数字混在にしてください';
  }
  if (error.code === 'email_rate_limit_exceeded' || error.status === 429) {
    return 'しばらく時間をおいてから再度お試しください';
  }
  if (error.code === 'email_provider_disabled') {
    return 'メール認証が無効です。管理者にお問い合わせください';
  }
  return '登録に失敗しました。しばらくしてから再度お試しください';
}

export function SignupForm() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const form = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: SignupInput) => {
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { data: signUpData, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(getSignupErrorMessage(error));
      setLoading(false);
      return;
    }

    if (signUpData.user?.identities?.length === 0) {
      setError('このメールアドレスはすでに登録されています');
      setLoading(false);
      return;
    }

    setEmailSent(true);
    setLoading(false);
  };

  const handleGoogleSignup = async () => {
    setError(null);
    setGoogleLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError('Googleでの登録に失敗しました');
      setGoogleLoading(false);
    }
  };

  if (emailSent) {
    return (
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">確認メールを送信しました</CardTitle>
          <CardDescription>
            {form.getValues('email')} に確認メールを送信しました。
            メールに記載されたリンクをクリックして登録を完了してください。
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <Link className="text-sm text-primary hover:underline" href="/login">
            ログインに戻る
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">新規登録</CardTitle>
        <CardDescription>アカウントを作成してください</CardDescription>
      </CardHeader>
      <CardContent>
        <Button
          className="w-full"
          disabled={loading || googleLoading}
          onClick={handleGoogleSignup}
          type="button"
          variant="outline"
        >
          {googleLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <GoogleIcon size={18} />
          )}
          Googleで登録
        </Button>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">または</span>
          </div>
        </div>

        <Form {...form}>
          <form className="space-y-4" noValidate onSubmit={form.handleSubmit(onSubmit)}>
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>メールアドレス</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="email@example.com"
                      type="email"
                      autoComplete="email"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>パスワード</FormLabel>
                  <FormControl>
                    <PasswordInput autoComplete="new-password" {...field} />
                  </FormControl>
                  <FormDescription>8文字以上、英字と数字を含む</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>パスワード（確認）</FormLabel>
                  <FormControl>
                    <PasswordInput autoComplete="new-password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button className="w-full" disabled={loading || googleLoading} type="submit">
              {loading ? '登録中...' : '新規登録'}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              すでにアカウントをお持ちの方は{' '}
              <Link className="text-primary hover:underline" href="/login">
                ログイン
              </Link>
            </p>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
