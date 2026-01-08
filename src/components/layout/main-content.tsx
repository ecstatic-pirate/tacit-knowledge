'use client';

import { usePathname } from 'next/navigation';

interface MainContentProps {
  children: React.ReactNode;
}

// Routes where sidebar is hidden
const noSidebarRoutes = [
  '/login',
  '/signup',
  '/feedback/',
  '/assess/',
  '/guide/',
  '/capture/',
  '/interview/',
];

export function MainContent({ children }: MainContentProps) {
  const pathname = usePathname();

  // Check if current route should have sidebar
  const hasSidebar = !noSidebarRoutes.some(route =>
    pathname === route || pathname.startsWith(route)
  );

  return (
    <main className={`min-h-screen ${hasSidebar ? 'lg:pl-64' : ''}`}>
      <div className="w-full max-w-full">
        {children}
      </div>
    </main>
  );
}
