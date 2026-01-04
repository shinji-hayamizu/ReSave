import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function DataManagement() {
  return (
    <Card className="opacity-60">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          データ管理
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-normal text-muted-foreground">
            v1.3で追加予定
          </span>
        </CardTitle>
        <CardDescription>データのエクスポート、インポート、管理</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          データ管理機能は今後のアップデートで追加予定です。カードや学習進捗のエクスポート、他のアプリからのデータインポート、アカウントデータの管理ができるようになります。
        </p>
      </CardContent>
    </Card>
  );
}
