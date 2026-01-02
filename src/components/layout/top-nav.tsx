'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Brain, Plus, SignOut, CaretDown } from 'phosphor-react';
import { Button } from '@/components/ui/button';
import { useApp } from '@/context/app-context';
import { useState } from 'react';

const navItems = [
  { label: 'Campaigns', href: '/dashboard' },
  { label: 'Sessions', href: '/planner' },
  { label: 'Knowledge', href: '/graph' },
  { label: 'Reports', href: '/reports' },
];

export function TopNav() {
  const pathname = usePathname();
  const { appUser, signOut } = useApp();
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Don't show nav on auth pages
  if (pathname === '/login' || pathname === '/signup') {
    return null;
  }

  // Don't show nav on capture session page (full-screen experience)
  if (pathname.startsWith('/capture/')) {
    return null;
  }

  const initials = appUser?.fullName
    ? appUser.fullName.split(' ').map(n => n[0]).join('').toUpperCase()
    : appUser?.email?.substring(0, 2).toUpperCase() || 'U';

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background">
      <div className="max-w-5xl mx-auto flex h-14 items-center px-6">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="flex items-center justify-center w-7 h-7 rounded bg-foreground text-background">
            <Brain className="w-4 h-4" weight="bold" />
          </div>
          <span className="font-semibold text-sm">Tacit</span>
        </Link>

        {/* Nav Links - Centered */}
        <nav className="flex-1 flex items-center justify-center gap-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href ||
              (item.href === '/dashboard' && pathname === '/');

            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    'h-8 px-3 text-sm font-normal',
                    isActive
                      ? 'bg-secondary text-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {item.label}
                </Button>
              </Link>
            );
          })}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-3">
          <Link href="/prepare">
            <Button size="sm" className="h-8 gap-1.5">
              <Plus className="w-3.5 h-3.5" weight="bold" />
              New Campaign
            </Button>
          </Link>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-secondary transition-colors"
            >
              <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center text-xs font-medium">
                {initials}
              </div>
              <CaretDown className={cn(
                "w-3.5 h-3.5 text-muted-foreground transition-transform",
                showUserMenu && "rotate-180"
              )} weight="bold" />
            </button>

            {showUserMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowUserMenu(false)}
                />
                <div className="absolute right-0 mt-2 w-48 rounded-md border bg-popover shadow-md z-50">
                  <div className="p-3 border-b">
                    <p className="text-sm font-medium truncate">
                      {appUser?.fullName || appUser?.email || 'User'}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {appUser?.email}
                    </p>
                  </div>
                  <div className="p-1">
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        signOut();
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary rounded-sm transition-colors"
                    >
                      <SignOut className="w-4 h-4" weight="bold" />
                      Sign out
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
