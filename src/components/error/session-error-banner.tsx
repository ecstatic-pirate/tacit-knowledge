'use client'

import { Warning, ArrowsClockwise, SignOut, X } from 'phosphor-react'
import { Button } from '@/components/ui/button'
import { useApp } from '@/context/app-context'
import { cn } from '@/lib/utils'

interface SessionErrorBannerProps {
  className?: string
}

/**
 * SessionErrorBanner displays auth and data errors at the top of the page.
 * It shows:
 * - Session expired errors with retry/sign out options
 * - Data loading errors with retry option
 * - Partial data errors (some data loaded, some failed)
 */
export function SessionErrorBanner({ className }: SessionErrorBannerProps) {
  const {
    authError,
    dataError,
    hasError,
    signOut,
    retryAuth,
    refreshData,
    clearErrors,
    isLoading,
  } = useApp()

  // Don't show if no errors
  if (!hasError) {
    return null
  }

  // Determine error type and display
  const isSessionError = authError !== null
  const isDataError = dataError !== null && !isSessionError
  const error = authError || dataError

  // Error styling based on type
  const isWarning = isDataError || error?.toLowerCase().includes('some data')
  const bgColor = isWarning ? 'bg-amber-50 dark:bg-amber-950/30' : 'bg-red-50 dark:bg-red-950/30'
  const borderColor = isWarning ? 'border-amber-200 dark:border-amber-800' : 'border-red-200 dark:border-red-800'
  const textColor = isWarning ? 'text-amber-900 dark:text-amber-100' : 'text-red-900 dark:text-red-100'
  const subtextColor = isWarning ? 'text-amber-700 dark:text-amber-300' : 'text-red-700 dark:text-red-300'
  const iconColor = isWarning ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'
  const buttonBg = isWarning
    ? 'bg-amber-600 hover:bg-amber-700 dark:bg-amber-600 dark:hover:bg-amber-700'
    : 'bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700'

  const handleRetry = async () => {
    if (isSessionError) {
      await retryAuth()
    } else {
      await refreshData()
    }
  }

  const handleSignOut = async () => {
    clearErrors()
    await signOut()
  }

  const handleDismiss = () => {
    // Only allow dismissing data errors (not session errors)
    if (!isSessionError) {
      clearErrors()
    }
  }

  return (
    <div
      className={cn(
        'sticky top-0 left-0 right-0 z-50 border-b px-4 py-3',
        bgColor,
        borderColor,
        className
      )}
      role="alert"
      aria-live="assertive"
    >
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        {/* Error message */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <Warning className={cn('h-5 w-5 flex-shrink-0', iconColor)} weight="bold" />
          <div className="min-w-0">
            <p className={cn('text-sm font-medium', textColor)}>
              {error}
            </p>
            {isSessionError && (
              <p className={cn('text-xs mt-0.5', subtextColor)}>
                Please sign in again to continue
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0 ml-4">
          {/* Retry button */}
          <Button
            size="sm"
            onClick={handleRetry}
            disabled={isLoading}
            className={cn(
              'text-white',
              buttonBg,
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            <ArrowsClockwise
              className={cn('h-4 w-4 mr-1.5', isLoading && 'animate-spin')}
              weight="bold"
            />
            {isLoading ? 'Retrying...' : 'Retry'}
          </Button>

          {/* Sign out button (only for session errors) */}
          {isSessionError && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleSignOut}
              className={cn(
                borderColor,
                textColor,
                'hover:bg-red-100 dark:hover:bg-red-900/30'
              )}
            >
              <SignOut className="h-4 w-4 mr-1.5" weight="bold" />
              Sign In
            </Button>
          )}

          {/* Dismiss button (only for data errors) */}
          {!isSessionError && (
            <button
              onClick={handleDismiss}
              className={cn(
                'p-1.5 rounded-md hover:bg-black/5 dark:hover:bg-white/10 transition-colors',
                subtextColor
              )}
              aria-label="Dismiss error"
            >
              <X className="h-4 w-4" weight="bold" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
