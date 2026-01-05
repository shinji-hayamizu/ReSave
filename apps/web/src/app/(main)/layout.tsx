import { redirect } from 'next/navigation';

import { AppHeader } from '@/components/layout/app-header';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { createClient } from '@/lib/supabase/server';

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <AppSidebar />
      <div className="flex min-h-svh w-full flex-col bg-background">
        <AppHeader />
        <main className="flex-1 bg-background">
          <div className="mx-auto max-w-3xl w-full px-4">{children}</div>
        </main>
      </div>
    </SidebarProvider>
  );
}
