'use client';

import { BookOpen, Home, Info, Settings, Tag } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';

const APP_VERSION = '1.0.0';

const navItems = [
  { title: 'ホーム', href: '/', icon: Home },
  { title: 'タグ', href: '/tags', icon: Tag },
  { title: '設定', href: '/settings', icon: Settings },
  { title: 'ReSaveについて', href: '/about', icon: Info },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar>
      <SidebarHeader className="border-b p-4">
        <Link className="flex items-center gap-2" href="/">
          <BookOpen className="h-6 w-6 text-primary" />
          <span className="font-semibold text-foreground">ReSave</span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild isActive={pathname === item.href}>
                    <Link href={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border/50 bg-gradient-to-t from-muted/30 to-transparent">
        <div className="space-y-1.5 px-3 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-5 w-5 items-center justify-center rounded bg-primary/10">
              <BookOpen className="h-3 w-3 text-primary" />
            </div>
            <span className="text-xs font-medium text-foreground/90">ReSave</span>
            <span className="text-[10px] text-muted-foreground/70">v{APP_VERSION}</span>
          </div>
          <p className="whitespace-nowrap text-[11px] text-muted-foreground/70">
            忘却曲線に基づく間隔反復学習
          </p>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
