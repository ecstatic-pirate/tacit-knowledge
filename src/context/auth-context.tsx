'use client'

import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  ReactNode,
} from 'react'
import { useRouter } from 'next/navigation'
import { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { isFatalAuthError } from '@/lib/auth/error-utils'

// =============================================================================
// AUTH STATE TYPES
// =============================================================================

export type AuthStatus =
  | 'initializing'
  | 'authenticated'
  | 'unauthenticated'
  | 'session-expired'
  | 'error'

export interface AuthState {
  status: AuthStatus
  user: User | null
  error: string | null
  retryCount: number
  sessionValidatedAt: number | null
}

// =============================================================================
// AUTH ACTIONS
// =============================================================================

type AuthAction =
  | { type: 'AUTH_INITIALIZED'; user: User }
  | { type: 'AUTH_NO_SESSION' }
  | { type: 'AUTH_SIGNED_IN'; user: User }
  | { type: 'AUTH_SIGNED_OUT' }
  | { type: 'AUTH_TOKEN_REFRESHED'; user: User }
  | { type: 'AUTH_VALIDATION_SUCCESS'; user: User }
  | { type: 'AUTH_SESSION_EXPIRED' }
  | { type: 'AUTH_ERROR'; error: string; fatal: boolean }
  | { type: 'AUTH_RETRY' }
  | { type: 'AUTH_CLEAR_ERROR' }

// =============================================================================
// AUTH REDUCER
// =============================================================================

const initialAuthState: AuthState = {
  status: 'initializing',
  user: null,
  error: null,
  retryCount: 0,
  sessionValidatedAt: null,
}

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'AUTH_INITIALIZED':
      return {
        status: 'authenticated',
        user: action.user,
        error: null,
        retryCount: 0,
        sessionValidatedAt: Date.now(),
      }

    case 'AUTH_NO_SESSION':
      return {
        status: 'unauthenticated',
        user: null,
        error: null,
        retryCount: 0,
        sessionValidatedAt: null,
      }

    case 'AUTH_SIGNED_IN':
      return {
        status: 'authenticated',
        user: action.user,
        error: null,
        retryCount: 0,
        sessionValidatedAt: Date.now(),
      }

    case 'AUTH_SIGNED_OUT':
      return {
        status: 'unauthenticated',
        user: null,
        error: null,
        retryCount: 0,
        sessionValidatedAt: null,
      }

    case 'AUTH_TOKEN_REFRESHED':
      return {
        ...state,
        user: action.user,
        retryCount: 0,
        sessionValidatedAt: Date.now(),
      }

    case 'AUTH_VALIDATION_SUCCESS':
      return {
        ...state,
        status: 'authenticated',
        user: action.user,
        error: null,
        retryCount: 0,
        sessionValidatedAt: Date.now(),
      }

    case 'AUTH_SESSION_EXPIRED': {
      const newRetryCount = state.retryCount + 1
      // If too many retries, transition to unauthenticated (will trigger redirect)
      if (newRetryCount >= 4) {
        return {
          status: 'unauthenticated',
          user: null,
          error: 'Your session has expired. Please sign in again.',
          retryCount: 0,
          sessionValidatedAt: null,
        }
      }
      return {
        status: 'session-expired',
        user: state.user, // Keep user for display purposes
        error: 'Your session has expired. Please sign in again.',
        retryCount: newRetryCount,
        sessionValidatedAt: null,
      }
    }

    case 'AUTH_ERROR':
      if (action.fatal) {
        return {
          status: 'unauthenticated',
          user: null,
          error: action.error,
          retryCount: 0,
          sessionValidatedAt: null,
        }
      }
      return {
        ...state,
        status: 'error',
        error: action.error,
        retryCount: state.retryCount + 1,
      }

    case 'AUTH_RETRY':
      return {
        ...state,
        error: null,
      }

    case 'AUTH_CLEAR_ERROR':
      return {
        ...state,
        error: null,
      }

    default:
      return state
  }
}

// =============================================================================
// AUTH CONTEXT
// =============================================================================

interface AuthContextType {
  authState: AuthState
  signOut: () => Promise<void>
  retryAuth: () => Promise<void>
  clearError: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// =============================================================================
// AUTH PROVIDER
// =============================================================================

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const [authState, dispatch] = useReducer(authReducer, initialAuthState)
  const supabase = useMemo(() => createClient(), [])
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null)
  const isValidatingRef = useRef(false)

  // Validate session with Supabase server
  const validateSession = useCallback(async (): Promise<{ user: User | null; error: string | null }> => {
    if (isValidatingRef.current) {
      // Return null to indicate we're already validating, caller should wait
      return { user: null, error: null }
    }

    isValidatingRef.current = true

    try {
      const { data: { user }, error } = await supabase.auth.getUser()

      if (error) {
        console.log('[AuthProvider] Validation error:', error.message)
        if (isFatalAuthError(error)) {
          return { user: null, error: error.message }
        }
        return { user: null, error: 'Session validation failed' }
      }

      return { user, error: null }
    } catch (err) {
      console.error('[AuthProvider] Validation exception:', err)
      return { user: null, error: 'Network error during validation' }
    } finally {
      isValidatingRef.current = false
    }
  }, [supabase])

  // Sign out function
  const signOut = useCallback(async () => {
    console.log('[AuthProvider] Sign out initiated')

    // Broadcast logout to other tabs
    if (broadcastChannelRef.current) {
      try {
        broadcastChannelRef.current.postMessage({ type: 'LOGOUT', source: 'manual' })
      } catch (e) {
        console.error('[AuthProvider] Error broadcasting logout:', e)
      }
    }

    dispatch({ type: 'AUTH_SIGNED_OUT' })

    try {
      await supabase.auth.signOut()
    } catch (e) {
      console.error('[AuthProvider] Error during signOut:', e)
    }

    router.push('/login')
    router.refresh()
  }, [supabase, router])

  // Retry authentication
  const retryAuth = useCallback(async () => {
    console.log('[AuthProvider] Retrying auth...')
    dispatch({ type: 'AUTH_RETRY' })

    const { user, error } = await validateSession()

    if (user) {
      dispatch({ type: 'AUTH_VALIDATION_SUCCESS', user })
    } else if (error) {
      // AUTH_SESSION_EXPIRED will increment retryCount in reducer
      // and auto-transition to unauthenticated after 4 retries
      dispatch({ type: 'AUTH_SESSION_EXPIRED' })
    }
  }, [validateSession])

  // Clear error
  const clearError = useCallback(() => {
    dispatch({ type: 'AUTH_CLEAR_ERROR' })
  }, [])

  // Initialize auth state
  useEffect(() => {
    let isMounted = true

    console.log('[AuthProvider] Starting auto-refresh')
    supabase.auth.startAutoRefresh()

    // Auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return

        console.log('[AuthProvider] Auth event:', event, session?.user?.email)

        switch (event) {
          case 'SIGNED_IN':
            if (session?.user) {
              dispatch({ type: 'AUTH_SIGNED_IN', user: session.user })
            }
            break

          case 'SIGNED_OUT':
            dispatch({ type: 'AUTH_SIGNED_OUT' })
            break

          case 'TOKEN_REFRESHED':
            if (session?.user) {
              dispatch({ type: 'AUTH_TOKEN_REFRESHED', user: session.user })
            }
            break

          case 'INITIAL_SESSION':
            if (session?.user) {
              dispatch({ type: 'AUTH_INITIALIZED', user: session.user })
            }
            // Don't dispatch NO_SESSION here - let checkSession verify
            break

          case 'USER_UPDATED':
            if (session?.user) {
              dispatch({ type: 'AUTH_TOKEN_REFRESHED', user: session.user })
            }
            break
        }
      }
    )

    // Initial session check with getUser() - source of truth
    const checkSession = async () => {
      await new Promise(resolve => setTimeout(resolve, 50))
      if (!isMounted) return

      // Skip if already authenticated from onAuthStateChange
      if (authState.status === 'authenticated') {
        return
      }

      console.log('[AuthProvider] Checking session with getUser()...')

      const { user, error } = await validateSession()

      if (!isMounted) return

      if (user) {
        dispatch({ type: 'AUTH_INITIALIZED', user })
      } else {
        console.log('[AuthProvider] No valid session:', error)
        dispatch({ type: 'AUTH_NO_SESSION' })
      }
    }

    checkSession()

    return () => {
      isMounted = false
      subscription.unsubscribe()
      supabase.auth.stopAutoRefresh()
    }
  }, [supabase, validateSession]) // Note: authState.status intentionally not in deps

  // Periodic session validation
  useEffect(() => {
    if (authState.status !== 'authenticated') return

    let isMounted = true

    const validateAndRecover = async () => {
      if (!isMounted || isValidatingRef.current) return

      console.log('[AuthProvider] Periodic validation...')
      const { user, error } = await validateSession()

      if (!isMounted) return

      if (user) {
        dispatch({ type: 'AUTH_VALIDATION_SUCCESS', user })
      } else if (error) {
        console.log('[AuthProvider] Validation failed:', error)
        dispatch({ type: 'AUTH_SESSION_EXPIRED' })
      }
    }

    // Validate every 5 minutes
    const intervalId = setInterval(validateAndRecover, 5 * 60 * 1000)

    // Validate on window focus
    const handleFocus = () => {
      console.log('[AuthProvider] Window focused, validating...')
      validateAndRecover()
    }
    window.addEventListener('focus', handleFocus)

    // Handle visibility changes
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        console.log('[AuthProvider] Page visible, restarting auto-refresh...')
        supabase.auth.startAutoRefresh()

        // Re-sync session from cookies
        try {
          const { data: { session } } = await supabase.auth.getSession()
          if (session?.user) {
            dispatch({ type: 'AUTH_TOKEN_REFRESHED', user: session.user })
          } else {
            validateAndRecover()
          }
        } catch (err) {
          console.error('[AuthProvider] Error re-syncing:', err)
          validateAndRecover()
        }
      } else {
        console.log('[AuthProvider] Page hidden, stopping auto-refresh')
        supabase.auth.stopAutoRefresh()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      isMounted = false
      clearInterval(intervalId)
      window.removeEventListener('focus', handleFocus)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [authState.status, supabase, validateSession])

  // Cross-tab logout synchronization
  useEffect(() => {
    if (typeof window === 'undefined' || !('BroadcastChannel' in window)) {
      return
    }

    // Close any existing channel before creating new one
    if (broadcastChannelRef.current) {
      broadcastChannelRef.current.close()
      broadcastChannelRef.current = null
    }

    try {
      const channel = new BroadcastChannel('tacit_auth')
      broadcastChannelRef.current = channel

      channel.onmessage = async (event) => {
        console.log('[AuthProvider] Broadcast received:', event.data)

        if (event.data.type === 'LOGOUT') {
          dispatch({ type: 'AUTH_SIGNED_OUT' })
          try {
            await supabase.auth.signOut()
          } catch (e) {
            console.error('[AuthProvider] Error during broadcast logout:', e)
          }
          router.push('/login')
        }
      }

      return () => {
        // Use ref for cleanup to ensure we close the current channel
        if (broadcastChannelRef.current) {
          broadcastChannelRef.current.close()
          broadcastChannelRef.current = null
        }
      }
    } catch (err) {
      console.error('[AuthProvider] BroadcastChannel error:', err)
    }
  }, [supabase, router])

  const contextValue = useMemo(
    () => ({
      authState,
      signOut,
      retryAuth,
      clearError,
    }),
    [authState, signOut, retryAuth, clearError]
  )

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}

// =============================================================================
// HOOK
// =============================================================================

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
