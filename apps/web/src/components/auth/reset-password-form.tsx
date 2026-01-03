'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

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
import { createClient } from '@/lib/supabase/client';
import { resetPasswordSchema } from '@/validations/user';

import type { ResetPasswordInput } from '@/validations/user';

export function ResetPasswordForm() {
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const form = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: ResetPasswordInput) => {
    setLoading(true);

    const supabase = createClient();
    await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/update-password`,
    });

    setSuccess(true);
    setLoading(false);
  };

  if (success) {
    return (
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">メールを送信しました</CardTitle>
          <CardDescription>
            パスワードリセット用のメールを送信しました。
            メールに記載されたリンクからパスワードを再設定してください。
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
        <CardTitle className="text-2xl">パスワードリセット</CardTitle>
        <CardDescription>
          登録済みのメールアドレスを入力してください
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
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
            <Button className="w-full" disabled={loading} type="submit">
              {loading ? '送信中...' : 'リセットリンクを送信'}
            </Button>
            <p className="text-center text-sm">
              <Link className="text-primary hover:underline" href="/login">
                ログインに戻る
              </Link>
            </p>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
