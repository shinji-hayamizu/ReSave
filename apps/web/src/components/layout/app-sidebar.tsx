'use client';

import { Home, Info, Menu, Settings, Tag } from 'lucide-react';
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

const navItems = [
  { title: 'ホーム', href: '/', icon: Home },
  { title: 'タグ', href: '/tags', icon: Tag },
  { title: '設定', href: '/settings', icon: Settings },
  { title: 'About', href: '/about', icon: Info },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { toggleSidebar } = useSidebar();

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
