'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  FileText,
  Mic,
  Calendar,
  BarChart3,
  BrainCircuit,
  Settings,
  LogOut,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

const sidebarItems = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Prepare',
    href: '/prepare',
    icon: FileText,
  },
  {
    title: 'Capture',
    href: '/capture',
    icon: Mic,
  },
  {
    title: 'Planner',
    href: '/planner',
    icon: Calendar,
  },
  {
    title: 'Reports',
    href: '/reports',
    icon: BarChart3,
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-screen w-[240px] flex-col border-r bg-secondary/30">
      <div className="p-4">
        <div className="flex items-center gap-2 mb-6 px-2">
          <div className="flex items-center justify-center w-7 h-7 rounded-md bg-primary text-primary-foreground shadow-sm">
            <BrainCircuit className="w-4 h-4" />
          </div>
          <span className="font-semibold text-sm tracking-tight">Tacit Knowledge</span>
        </div>

        <div className="space-y-1">
          {sidebarItems.map((item) => {
             const isActive = pathname.startsWith(item.href);
             return (
              <Link key={item.href} href={item.href} passHref>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    'w-full justify-between mb-0.5 h-8 font-normal text-muted-foreground hover:text-foreground hover:bg-muted/50',
                    isActive && 'bg-background text-foreground shadow-sm font-medium hover:bg-background'
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <item.icon className={cn("w-4 h-4", isActive ? "text-primary" : "text-muted-foreground")} />
                    {item.title}
                  </div>
                  {isActive && <ChevronRight className="w-3 h-3 opacity-50" />}
                </Button>
              </Link>
            )
          })}
        </div>
      </div>

      <div className="mt-auto p-4 border-t bg-background/50">
         <div className="flex items-center gap-3 mb-3 px-1">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-muted to-muted-foreground/20 flex items-center justify-center border shadow-sm">
              <span className="text-xs font-semibold">JD</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-medium">John Doe</span>
              <span className="text-[10px] text-muted-foreground">Admin Workspace</span>
            </div>
         </div>
         <div className="grid gap-1">
            <Button variant="ghost" size="sm" className="w-full justify-start gap-2 h-7 text-xs text-muted-foreground">
              <Settings className="w-3.5 h-3.5" />
              Settings
            </Button>
            <Button variant="ghost" size="sm" className="w-full justify-start gap-2 h-7 text-xs text-muted-foreground">
              <LogOut className="w-3.5 h-3.5" />
              Log out
            </Button>
         </div>
      </div>
    </div>
  );
}
