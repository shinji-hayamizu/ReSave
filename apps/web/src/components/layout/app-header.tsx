'use client';

import { LogOut, Menu, Plus, Settings } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { signOut } from '@/actions/auth';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useSidebar } from '@/components/ui/sidebar';

export function AppHeader() {
  const { toggleSidebar } = useSidebar();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b bg-background px-4">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
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
        <Button asChild size="sm">
          <Link href="/cards/new">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">新規カード</span>
          </Link>
        </Button>

        {mounted ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                    U
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href="/settings" className="cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  設定
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleSignOut}
                className="cursor-pointer"
              >
                <LogOut className="mr-2 h-4 w-4" />
                ログアウト
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button variant="ghost" size="icon" className="rounded-full">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                U
              </AvatarFallback>
            </Avatar>
          </Button>
        )}
      </div>
    </header>
  );
}
