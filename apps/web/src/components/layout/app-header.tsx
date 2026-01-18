'use client';

import { Menu } from 'lucide-react';

import { CreateCardDialog } from '@/components/cards/create-card-dialog';
import { Button } from '@/components/ui/button';
import { useSidebar } from '@/components/ui/sidebar';

export function AppHeader() {
  const { toggleSidebar } = useSidebar();

  return (
    <header className="sticky top-0 z-40 bg-background">
      <div className="w-full px-4">
        <div className="flex h-14 items-center justify-between">
          <div className="flex items-center gap-4">
            {/* モバイル時のみ表示（md:768px未満）- CSSで制御してハイドレーションエラーを防ぐ */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              aria-label="Toggle menu"
              className="h-10 w-10 md:hidden"
            >
              <Menu className="h-6 w-6" />
            </Button>
            <h1 className="text-xl font-bold">ReSave</h1>
          </div>
          <div className="flex items-center gap-2">
            <CreateCardDialog />
          </div>
        </div>
      </div>
    </header>
  );
}
