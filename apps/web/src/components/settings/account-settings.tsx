'use client';

import { LogOut } from 'lucide-react';

import { signOut } from '@/actions/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';

export function AccountSettings() {
  const { user, loading } = useAuth();

  async function handleSignOut() {
    await signOut();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>アカウント設定</CardTitle>
        <CardDescription>アカウント情報を管理</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <p className="text-sm font-medium">メールアドレス</p>
          {loading ? (
            <p className="text-sm text-muted-foreground">読み込み中...</p>
          ) : (
            <p className="text-sm text-muted-foreground">{user?.email ?? '取得できません'}</p>
          )}
        </div>
        <div className="pt-2">
          <Button variant="destructive" onClick={handleSignOut}>
            <LogOut className="mr-2 h-4 w-4" />
            ログアウト
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
