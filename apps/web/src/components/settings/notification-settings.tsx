import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function NotificationSettings() {
  return (
    <Card className="opacity-60">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Notification Settings
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-normal text-muted-foreground">
            Coming in v1.2
          </span>
        </CardTitle>
        <CardDescription>Configure push notifications and reminders</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Notification settings will be available in a future update. You will be able to set daily
          reminders and study notifications.
        </p>
      </CardContent>
    </Card>
  );
}
