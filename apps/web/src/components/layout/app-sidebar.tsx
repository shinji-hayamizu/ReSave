'use client';

import { CheckCheck, Home, Info, Menu, Settings, Tag } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { ReSaveIcon } from '@/components/icons/resave-icon';
import { Button } from '@/components/ui/button';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { useCompletedCount } from '@/hooks/useHomeCards';

export function AppSidebar() {
  const pathname = usePathname();
  const { toggleSidebar } = useSidebar();
  const completedCount = useCompletedCount();

  const navItems = [
    { title: 'ホーム', href: '/', icon: Home, badge: 0 },
    { title: '完了', href: '/cards/completed', icon: CheckCheck, badge: completedCount },
    { title: 'タグ', href: '/tags', icon: Tag, badge: 0 },
    { title: '設定', href: '/settings', icon: Settings, badge: 0 },
    { title: 'About', href: '/about', icon: Info, badge: 0 },
  ];

  return (
    <Sidebar collapsible="icon" className="border-none bg-background">
      <SidebarHeader className="p-2">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            aria-label="Toggle sidebar"
            className="h-10 w-10 shrink-0"
          >
            <Menu className="h-6 w-6" />
          </Button>
          <div className="flex items-end gap-0.5 group-data-[collapsible=icon]:hidden">
            <ReSaveIcon size={28} className="mb-[2px]" />
            <span className="text-xl font-bold">ReSave</span>
          </div>
        </div>
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
                    className="h-auto py-3 group-data-[collapsible=icon]:!h-auto group-data-[collapsible=icon]:!w-full group-data-[collapsible=icon]:flex-col group-data-[collapsible=icon]:gap-1 group-data-[collapsible=icon]:py-4"
                  >
                    <Link href={item.href}>
                      <item.icon className="h-5 w-5 group-data-[collapsible=icon]:h-6 group-data-[collapsible=icon]:w-6" />
                      <span className="text-sm group-data-[collapsible=icon]:text-[10px]">{item.title}</span>
                      {item.badge > 0 && (
                        <span className="ml-auto group-data-[collapsible=icon]:hidden rounded-full bg-primary/10 px-1.5 py-0.5 text-xs font-semibold text-primary">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
