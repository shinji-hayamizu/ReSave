'use client';

import { Menu } from 'lucide-react';

import { CreateCardDialog } from '@/components/cards/create-card-dialog';
import { Button } from '@/components/ui/button';
import { useSidebar } from '@/components/ui/sidebar';

export function AppHeader() {
  const { toggleSidebar } = useSidebar();

  return (
    <header className="sticky top-0 z-40 bg-background">
      <div className="mx-auto flex h-12 max-w-3xl items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={toggleSidebar}
            aria-label="Toggle menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-bold">ReSave</h1>
          <span className="hidden text-sm text-muted-foreground sm:inline">
            - 記憶を科学する -
          </span>
        </div>
        <div className="flex items-center gap-2">
          <CreateCardDialog />
        </div>
      </div>
    </header>
  );
}
