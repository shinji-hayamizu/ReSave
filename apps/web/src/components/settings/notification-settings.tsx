import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function NotificationSettings() {
  return (
    <Card className="opacity-60">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          通知設定
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-normal text-muted-foreground">
            v1.2で追加予定
          </span>
        </CardTitle>
        <CardDescription>プッシュ通知とリマインダーの設定</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          通知設定は今後のアップデートで追加予定です。毎日のリマインダーや学習通知を設定できるようになります。
        </p>
      </CardContent>
    </Card>
  );
}
