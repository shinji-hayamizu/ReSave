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
  { title: 'ホーム', shortTitle: 'ホーム', href: '/', icon: Home },
  { title: 'タグ', shortTitle: 'タグ', href: '/tags', icon: Tag },
  { title: '設定', shortTitle: '設定', href: '/settings', icon: Settings },
  { title: 'ReSaveについて', shortTitle: 'About', href: '/about', icon: Info },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="offcanvas">
      <SidebarHeader className="p-4 md:p-2 lg:p-4">
        <Link className="flex items-center gap-2 md:flex-col md:gap-1 lg:flex-row lg:gap-2" href="/">
          <BookOpen className="h-6 w-6 text-primary" />
          <span className="font-semibold text-foreground md:text-xs lg:text-base">ReSave</span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href}
                    tooltip={item.title}
                    className="md:flex-col md:h-auto md:gap-1 md:py-3 lg:flex-row lg:h-8 lg:gap-2 lg:py-2"
                  >
                    <Link href={item.href}>
                      <item.icon className="h-5 w-5 md:h-6 md:w-6 lg:h-4 lg:w-4" />
                      <span className="md:text-[10px] lg:text-sm">
                        <span className="md:inline lg:hidden">{item.shortTitle}</span>
                        <span className="hidden lg:inline">{item.title}</span>
                      </span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="bg-gradient-to-t from-muted/30 to-transparent md:p-2 lg:p-2">
        <div className="space-y-1.5 px-3 py-3 md:px-1 md:py-2 lg:px-3 lg:py-3">
          <div className="flex items-center gap-2 md:flex-col md:gap-0.5 md:text-center lg:flex-row lg:gap-2 lg:text-left">
            <div className="flex h-5 w-5 items-center justify-center rounded bg-primary/10">
              <BookOpen className="h-3 w-3 text-primary" />
            </div>
            <span className="text-xs font-medium text-foreground/90 md:text-[9px] lg:text-xs">ReSave</span>
            <span className="text-[10px] text-muted-foreground/70 md:text-[8px] lg:text-[10px]">v{APP_VERSION}</span>
          </div>
          <p className="whitespace-nowrap text-[11px] text-muted-foreground/70 md:hidden lg:block">
            忘却曲線に基づく間隔反復学習
          </p>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
