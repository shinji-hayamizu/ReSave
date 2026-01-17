import { PageHeader } from '@/components/layout/page-header';
import {
  AccountSettings,
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
        <NotificationSettings />
        <AccountSettings />
      </div>
    </div>
  );
}
