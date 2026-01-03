import { PageHeader } from '@/components/layout/page-header';
import {
  AccountSettings,
  AppInfo,
  DataManagement,
  LearningSettings,
  NotificationSettings,
} from '@/components/settings';

export default function SettingsPage() {
  return (
    <div>
      <PageHeader
        title="設定"
        description="アプリの設定とアカウントを管理"
      />
      <div className="p-4 md:p-6 max-w-2xl space-y-6">
        <LearningSettings />
        <NotificationSettings />
        <AccountSettings />
        <DataManagement />
        <AppInfo />
      </div>
    </div>
  );
}
