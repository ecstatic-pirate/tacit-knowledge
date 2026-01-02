'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { BrainCircuit, Plus, LogOut, BarChart3, Calendar, Lightbulb, FileText, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useApp } from '@/context/app-context';
import { useState } from 'react';

const navItems = [
  { label: 'Campaigns', href: '/dashboard', icon: BarChart3 },
  { label: 'Sessions', href: '/planner', icon: Calendar },
  { label: 'Knowledge', href: '/graph', icon: Lightbulb },
  { label: 'Reports', href: '/reports', icon: FileText },
];

export function Sidebar() {
  const pathname = usePathname();
  const { appUser, signOut } = useApp();
  const [isOpen, setIsOpen] = useState(false);

  // Don't show sidebar on auth pages
  if (pathname === '/login' || pathname === '/signup') {
    return null;
  }

  // Don't show sidebar on capture session page (full-screen experience)
  if (pathname.startsWith('/capture/')) {
    return null;
  }

  const initials = appUser?.fullName
    ? appUser.fullName.split(' ').map(n => n[0]).join('').toUpperCase()
    : appUser?.email?.substring(0, 2).toUpperCase() || 'U';

  const handleSignOut = () => {
    setIsOpen(false);
    signOut();
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="fixed top-4 left-4 z-50 lg:hidden">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsOpen(!isOpen)}
          aria-label={isOpen ? 'Close menu' : 'Open menu'}
        >
          {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
      </div>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 h-screen w-64 bg-card border-r border-border flex flex-col transition-transform duration-300 z-40 lg:static lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
        role="navigation"
        aria-label="Main navigation"
      >
        {/* Header */}
        <div className="p-6 border-b border-border">
          <Link href="/dashboard" className="flex items-center gap-3" onClick={() => setIsOpen(false)}>
            <div className="flex items-center justify-center w-8 h-8 rounded bg-primary text-primary-foreground">
              <BrainCircuit className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-lg block">Tacit</span>
              <span className="text-xs text-muted-foreground">Knowledge Capture</span>
            </div>
          </Link>
        </div>

        {/* New Campaign Button */}
        <div className="px-4 py-4 border-b border-border">
          <Link href="/prepare" onClick={() => setIsOpen(false)}>
            <Button className="w-full" size="sm">
              <Plus className="w-4 h-4 mr-2" />
              New Campaign
            </Button>
          </Link>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-6 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href === '/dashboard' && pathname === '/');
            const Icon = item.icon;

            return (
              <Link key={item.href} href={item.href} onClick={() => setIsOpen(false)}>
                <Button
                  variant="ghost"
                  className={cn(
                    'w-full justify-start gap-3 px-4 py-2.5 h-auto font-normal',
                    isActive
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                  )}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {item.label}
                </Button>
              </Link>
            );
          })}
        </nav>

        {/* User Profile Section */}
        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary flex-shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {appUser?.fullName || appUser?.email || 'User'}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {appUser?.email}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
            onClick={handleSignOut}
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </Button>
        </div>
      </aside>
    </>
  );
}
