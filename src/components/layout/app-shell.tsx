'use client'

import { ReactNode } from 'react'
import { Sidebar } from '@/components/layout/sidebar'
import { MainContent } from '@/components/layout/main-content'
import { SessionErrorBanner } from '@/components/error/session-error-banner'

interface AppShellProps {
  children: ReactNode
}

/**
 * AppShell provides the main layout structure with error handling.
 * It wraps the sidebar and main content, and displays error banners when needed.
 */
export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen">
      <SessionErrorBanner />
      <Sidebar />
      <MainContent>
        {children}
      </MainContent>
    </div>
  )
}
