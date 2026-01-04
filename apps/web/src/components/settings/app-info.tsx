import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const APP_VERSION = '1.0.0';

export function AppInfo() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>アプリ情報</CardTitle>
        <CardDescription>ReSaveについて</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2">
          <div className="flex justify-between">
            <span className="text-sm font-medium">バージョン</span>
            <span className="text-sm text-muted-foreground">{APP_VERSION}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm font-medium">アプリ名</span>
            <span className="text-sm text-muted-foreground">ReSave</span>
          </div>
        </div>
        <div className="pt-2 text-sm text-muted-foreground">
          <p>
            ReSaveは忘却曲線に基づいた間隔反復学習アプリです。最適なタイミングでカードを復習することで、効率的に学習できます。
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
