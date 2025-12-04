'use client';

import { TabName } from '@/types';
import {
  LayoutDashboard,
  FileText,
  Mic,
  Calendar,
  BarChart3,
  LucideIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface NavigationProps {
  activeTab: TabName;
  onTabChange: (tab: TabName) => void;
}

const tabs: { id: TabName; label: string; icon: LucideIcon }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'prepare', label: 'Prepare', icon: FileText },
  { id: 'capture', label: 'Capture', icon: Mic },
  { id: 'planner', label: 'Planner', icon: Calendar },
  { id: 'reports', label: 'Reports', icon: BarChart3 },
];

export function Navigation({ activeTab, onTabChange }: NavigationProps) {
  return (
    <div className="border-b bg-background">
      <div className="container flex h-12 items-center space-x-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <Button
              key={tab.id}
              variant={isActive ? "secondary" : "ghost"}
              size="sm"
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "gap-2 h-8",
                isActive ? "text-foreground font-medium" : "text-muted-foreground"
              )}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
