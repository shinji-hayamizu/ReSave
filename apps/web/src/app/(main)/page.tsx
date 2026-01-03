import { PageHeader } from '@/components/layout/page-header';

export default function DashboardPage() {
  return (
    <div>
      <PageHeader
        description="今日の復習カードを確認しましょう"
        title="ダッシュボード"
      />
      <div className="p-4 md:p-6">
        <p className="text-muted-foreground">
          今日復習するカードはありません
        </p>
      </div>
    </div>
  );
}
