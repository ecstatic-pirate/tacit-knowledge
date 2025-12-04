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
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';

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
    <div className="flex h-screen w-64 flex-col border-r bg-card">
      <div className="p-6">
        <div className="flex items-center gap-2 mb-8">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-primary-foreground">
            <BrainCircuit className="w-5 h-5" />
          </div>
          <div className="flex flex-col gap-0.5">
            <h1 className="font-semibold leading-none tracking-tight">
              Tacit
            </h1>
            <p className="text-[10px] text-muted-foreground font-medium">
              Knowledge Platform
            </p>
          </div>
        </div>

        <div className="space-y-1">
          {sidebarItems.map((item) => (
            <Link key={item.href} href={item.href} passHref>
              <Button
                variant={pathname.startsWith(item.href) ? 'secondary' : 'ghost'}
                className={cn(
                  'w-full justify-start gap-3 mb-1 font-normal',
                  pathname.startsWith(item.href) && 'font-medium'
                )}
              >
                <item.icon className="w-4 h-4" />
                {item.title}
              </Button>
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-auto p-6 border-t">
         <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
              <span className="text-xs font-semibold">JD</span>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium">John Doe</span>
              <span className="text-xs text-muted-foreground">Admin</span>
            </div>
         </div>
         <div className="space-y-1">
            <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-muted-foreground">
              <Settings className="w-4 h-4" />
              Settings
            </Button>
            <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-muted-foreground">
              <LogOut className="w-4 h-4" />
              Log out
            </Button>
         </div>
      </div>
    </div>
  );
}

