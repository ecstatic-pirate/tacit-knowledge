/**
 * Authentication error classification utilities.
 * These functions help determine how to handle different types of auth errors.
 */

export interface AuthErrorLike {
  message?: string
  code?: string
  status?: number
}

/**
 * Check if an error is an abort/timeout error (from AbortSignal.timeout())
 */
export function isAbortError(err: unknown): boolean {
  return err instanceof Error && (err.name === 'AbortError' || err.message.includes('aborted'))
}

/**
 * Classify fatal auth errors that should immediately logout (no retry).
 * NOTE: 'JWT expired' is NOT fatal - let the auto-refresh mechanism handle it.
 */
export function isFatalAuthError(error: AuthErrorLike | null): boolean {
  if (!error) return false

  const fatalPatterns = [
    'invalid claim',
    'invalid JWT',           // Malformed JWT - can't be fixed by refresh
    'refresh_token_not_found', // Refresh token is gone - session is dead
    'Invalid Refresh Token',   // Refresh token invalid - session is dead
  ]

  const errorStr = `${error.message || ''} ${error.code || ''}`
  const statusCode = error.status || (error.code ? parseInt(error.code, 10) : 0)

  // Only 403 is truly fatal (forbidden) - 401 might just need a refresh
  // PGRST301 (JWT error) is also retryable - refresh might fix it
  if (statusCode === 403) {
    return true
  }

  return fatalPatterns.some(pattern => errorStr.includes(pattern))
}

/**
 * Check if error might be auth-related but could be transient (network issue).
 * These errors should trigger retry logic before giving up.
 */
export function isAuthError(error: AuthErrorLike | null): boolean {
  if (!error) return false

  const authErrorPatterns = [
    'JWT',
    'token',
    'session',
    'auth',
    'expired',
    'invalid',
    'PGRST301',
    '401',
    '403',
  ]

  const errorStr = `${error.message || ''} ${error.code || ''} ${error.status || ''}`.toLowerCase()
  return authErrorPatterns.some(pattern => errorStr.includes(pattern.toLowerCase()))
}

/**
 * Get a user-friendly error message for display
 */
export function getUserFriendlyAuthError(error: AuthErrorLike | null): string {
  if (!error) return 'An unexpected error occurred. Please try again.'

  if (isFatalAuthError(error)) {
    return 'Your session has expired. Please sign in again.'
  }

  if (isAuthError(error)) {
    return 'There was an issue with your session. Please try again or sign in again.'
  }

  return 'Unable to connect. Please check your internet connection and try again.'
}
