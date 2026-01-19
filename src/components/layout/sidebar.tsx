'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Sparkle, Plus, SignOut, ChartBar, Calendar, Lightbulb, List, X, Bell, FileText, ChatCircleDots } from 'phosphor-react';
import { Button } from '@/components/ui/button';
import { useApp } from '@/context/app-context';
import { useState } from 'react';

const navItems = [
  { label: 'Campaigns', href: '/dashboard', icon: ChartBar },
  { label: 'Sessions', href: '/planner', icon: Calendar },
  { label: 'Knowledge Hub', href: '/graph', icon: Lightbulb },
  { label: 'Concierge', href: '/concierge', icon: ChatCircleDots },
  { label: 'Reports', href: '/reports', icon: FileText },
  { label: 'Notifications', href: '/notifications', icon: Bell, disabled: true },
];

export function Sidebar() {
  const pathname = usePathname();
  const { appUser, signOut } = useApp();
  const [isOpen, setIsOpen] = useState(false);

  // Don't show sidebar on auth pages or public form pages
  if (
    pathname === '/login' ||
    pathname === '/signup' ||
    pathname.startsWith('/feedback/') ||
    pathname.startsWith('/assess/') ||
    pathname.startsWith('/guide/')
  ) {
    return null;
  }

  // Don't show sidebar on capture session page (full-screen experience)
  if (pathname.startsWith('/capture/')) {
    return null;
  }

  const initials = appUser?.fullName
    ? appUser.fullName.split(' ').map(n => n[0]).join('').toUpperCase()
    : appUser?.email?.substring(0, 2).toUpperCase() || 'U';

  const handleSignOut = async () => {
    setIsOpen(false);
    await signOut();
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
          {isOpen ? <X className="w-5 h-5" weight="bold" /> : <List className="w-5 h-5" weight="bold" />}
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
          'fixed left-0 top-0 h-screen w-64 bg-stone-50 dark:bg-stone-900/50 border-r border-stone-200 dark:border-stone-800 flex flex-col transition-transform duration-300 z-40 lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
        role="navigation"
        aria-label="Main navigation"
      >
        {/* Header */}
        <div className="p-6 border-b border-stone-200 dark:border-stone-800">
          <Link href="/dashboard" className="flex items-center gap-3" onClick={() => setIsOpen(false)}>
            <div className="flex items-center justify-center w-8 h-8 rounded bg-stone-900 dark:bg-stone-100 text-stone-50 dark:text-stone-900">
              <Sparkle className="w-5 h-5" weight="fill" />
            </div>
            <span className="font-serif font-bold text-2xl text-stone-900 dark:text-stone-100">Tacit</span>
          </Link>
        </div>

        {/* New Campaign Button */}
        <div className="px-4 py-4 border-b border-stone-200 dark:border-stone-800">
          <Link href="/new" onClick={() => setIsOpen(false)}>
            <Button className="w-full" size="sm">
              <Plus className="w-4 h-4 mr-2" weight="bold" />
              New Campaign
            </Button>
          </Link>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-6 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href === '/dashboard' && pathname === '/');
            const Icon = item.icon;

            if (item.disabled) {
              return (
                <Button
                  key={item.href}
                  variant="ghost"
                  disabled
                  className="w-full justify-start gap-3 px-4 py-2.5 h-auto font-normal text-muted-foreground/50 cursor-not-allowed"
                >
                  <Icon className="w-5 h-5 flex-shrink-0" weight="bold" />
                  {item.label}
                  <span className="ml-auto text-xs bg-muted px-1.5 py-0.5 rounded">Soon</span>
                </Button>
              );
            }

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
                  <Icon className="w-5 h-5 flex-shrink-0" weight="bold" />
                  {item.label}
                </Button>
              </Link>
            );
          })}
        </nav>

        {/* User Profile Section */}
        <div className="p-4 border-t border-stone-200 dark:border-stone-800">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-stone-200 dark:bg-stone-700 flex items-center justify-center text-sm font-semibold text-stone-700 dark:text-stone-200 flex-shrink-0">
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
            <SignOut className="w-4 h-4" weight="bold" />
            Sign out
          </Button>
        </div>
      </aside>
    </>
  );
}
