'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { BookOpen, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { createClient } from '@/lib/supabase/client';
import { loginSchema } from '@/validations/user';

import type { LoginInput } from '@/validations/user';

export function LoginForm() {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/home';
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam === 'oauth_failed') {
      setError('Googleログインに失敗しました。もう一度お試しください。');
    }
  }, [searchParams]);

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginInput) => {
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (error) {
      setError('メールアドレスまたはパスワードが正しくありません');
      setLoading(false);
      return;
    }

    // eslint-disable-next-line react-hooks/immutability -- full page navigation to ensure auth cookies are sent
    window.location.href = redirectTo;
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setGoogleLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`,
      },
    });

    if (error) {
      setError('Googleログインの開始に失敗しました');
      setGoogleLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="flex items-center gap-2">
            <BookOpen className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold text-foreground">ReSave</span>
          </div>
        </div>
        <div>
          <CardTitle className="text-xl">ログイン</CardTitle>
          <CardDescription className="mt-1">記憶を科学する - 間隔反復学習</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
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
                    <PasswordInput autoComplete="current-password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button className="w-full" disabled={loading || googleLoading} type="submit">
              {loading ? 'ログイン中...' : 'ログイン'}
            </Button>
            <div className="space-y-2 text-center text-sm">
              <p>
                <Link
                  className="text-primary hover:underline"
                  href="/reset-password"
                >
                  パスワードを忘れた方
                </Link>
              </p>
              <p className="text-muted-foreground">
                アカウントをお持ちでない方は{' '}
                <Link className="text-primary hover:underline" href="/signup">
                  新規登録
                </Link>
              </p>
            </div>
          </form>
        </Form>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">または</span>
          </div>
        </div>

        <Button
          className="w-full"
          disabled={loading || googleLoading}
          onClick={handleGoogleLogin}
          type="button"
          variant="outline"
        >
          {googleLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <GoogleIcon size={18} />
          )}
          Googleでログイン
        </Button>
      </CardContent>
    </Card>
  );
}
