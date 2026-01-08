'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import type {
  Campaign as DBCampaign,
  Task as DBTask,
  User as DBUser,
  Organization,
  Skill as DBSkill,
  Session as DBSession,
  SelfAssessment,
  Json,
} from '@/lib/supabase/database.types'

// Collaborator type for campaign creation
export interface Collaborator {
  name: string
  email: string
  role: 'successor' | 'teammate' | 'partner' | 'manager' | 'report'
}

// App-level types that map database types to UI-friendly format
export interface Campaign {
  id: string
  name: string
  role: string
  department?: string
  yearsExperience?: number
  goal?: string
  status: 'on-track' | 'keep-track' | 'danger'
  progress: number
  totalSessions: number
  completedSessions: number
  skillsCaptured: number
  captureMode?: string
  expertEmail?: string
  createdAt?: string
  selfAssessment?: SelfAssessment
  collaborators?: Collaborator[]
  skills?: string // Raw skills text from form
}

export interface Task {
  id: string
  title: string
  priority: 'urgent' | 'this-week' | 'on-track'
  completed: boolean
  campaignId?: string
  dueAt?: string
}

export interface AppUser {
  id: string
  email: string
  fullName?: string
  avatarUrl?: string
  role: string
  orgId: string
}

interface AppContextType {
  // Auth state
  user: User | null
  appUser: AppUser | null
  organization: Organization | null
  isLoading: boolean

  // Data
  campaigns: Campaign[]
  tasks: Task[]

  // Actions
  signOut: () => Promise<void>
  toggleTask: (taskId: string) => Promise<void>
  updateCampaign: (campaign: Campaign) => Promise<void>
  addCampaign: (campaign: Omit<Campaign, 'id' | 'skillsCaptured'>) => Promise<Campaign>
  deleteCampaign: (campaignId: string) => Promise<void>
  refreshData: () => Promise<void>
}

const AppContext = createContext<AppContextType | undefined>(undefined)

// Status conversion helpers (DB uses underscores, UI uses hyphens)
function dbStatusToUi(dbStatus: string | null): Campaign['status'] {
  const map: Record<string, Campaign['status']> = {
    'on_track': 'on-track',
    'keep_track': 'keep-track',
    'danger': 'danger',
  }
  return map[dbStatus ?? 'on_track'] ?? 'on-track'
}

function uiStatusToDb(uiStatus: Campaign['status']): string {
  const map: Record<Campaign['status'], string> = {
    'on-track': 'on_track',
    'keep-track': 'keep_track',
    'danger': 'danger',
  }
  return map[uiStatus] ?? 'on_track'
}

// Helper to map database campaign to app campaign
function mapDBCampaignToApp(dbCampaign: DBCampaign, skillsCount: number): Campaign {
  return {
    id: dbCampaign.id,
    name: dbCampaign.expert_name,
    role: dbCampaign.expert_role,
    department: dbCampaign.department ?? undefined,
    yearsExperience: dbCampaign.years_experience ?? undefined,
    goal: dbCampaign.goal ?? undefined,
    status: dbStatusToUi(dbCampaign.status),
    progress: dbCampaign.progress ?? 0,
    totalSessions: dbCampaign.total_sessions ?? 14,
    completedSessions: dbCampaign.completed_sessions ?? 0,
    skillsCaptured: skillsCount,
    captureMode: dbCampaign.capture_mode ?? undefined,
    expertEmail: dbCampaign.expert_email ?? undefined,
    createdAt: dbCampaign.created_at ?? undefined,
    selfAssessment: dbCampaign.self_assessment as SelfAssessment | undefined,
  }
}

// Helper to map database task to app task
function mapDBTaskToApp(dbTask: DBTask): Task {
  return {
    id: dbTask.id,
    title: dbTask.title,
    priority: (dbTask.priority as Task['priority']) ?? 'on-track',
    completed: dbTask.completed ?? false,
    campaignId: dbTask.campaign_id ?? undefined,
    dueAt: dbTask.due_at ?? undefined,
  }
}

// Classify fatal auth errors that should immediately logout (no retry)
function isFatalAuthError(error: { message?: string; code?: string; status?: number } | null): boolean {
  if (!error) return false

  const fatalPatterns = [
    'JWT expired',
    'invalid claim',
    'invalid JWT',
    'refresh_token_not_found',
    'PGRST301', // PostgREST JWT error
  ]

  const errorStr = `${error.message || ''} ${error.code || ''}`
  const statusCode = error.status || (error.code ? parseInt(error.code, 10) : 0)

  // 401/403 are fatal - session is definitely invalid
  if (statusCode === 401 || statusCode === 403) {
    return true
  }

  return fatalPatterns.some(pattern => errorStr.includes(pattern))
}

// Check if error might be auth-related but could be transient (network issue)
function isAuthError(error: { message?: string; code?: string; status?: number } | null): boolean {
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

export function AppProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [appUser, setAppUser] = useState<AppUser | null>(null)
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const supabase = useMemo(() => createClient(), [])

  // Auth resilience state
  const authRetryCountRef = useRef(0)
  const isAuthCheckingRef = useRef(false)
  const initializedRef = useRef(false)
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null)

  // Handle auth errors by clearing state and redirecting to login
  const handleAuthError = useCallback(async (source: string = 'unknown') => {
    console.log(`[AppProvider] Handling auth error from ${source}, clearing session`)

    // Prevent duplicate logout calls
    if (!user && !appUser) {
      console.log('[AppProvider] Already logged out, skipping')
      return
    }

    try {
      await supabase.auth.signOut()
    } catch (e) {
      console.error('[AppProvider] Error during signOut:', e)
    }

    // Broadcast logout to other tabs
    if (broadcastChannelRef.current) {
      try {
        broadcastChannelRef.current.postMessage({ type: 'LOGOUT', source })
      } catch (e) {
        console.error('[AppProvider] Error broadcasting logout:', e)
      }
    }

    setUser(null)
    setAppUser(null)
    setOrganization(null)
    setCampaigns([])
    setTasks([])
    setIsLoading(false)
    authRetryCountRef.current = 0
    initializedRef.current = false

    router.push('/login')
  }, [supabase, router, user, appUser])

  // Validate session with retry logic and exponential backoff
  const validateSessionWithRetry = useCallback(async (): Promise<{ user: User | null; shouldLogout: boolean }> => {
    const maxRetries = 3
    const baseDelay = 1000 // Start with 1 second

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const { data: { user: validatedUser }, error } = await supabase.auth.getUser()

        if (!error && validatedUser) {
          // Success - reset retry count
          authRetryCountRef.current = 0
          return { user: validatedUser, shouldLogout: false }
        }

        // Check if this is a fatal auth error (no point retrying)
        if (error && isFatalAuthError(error)) {
          console.log('[AppProvider] Fatal auth error, no retry:', error.message)
          return { user: null, shouldLogout: true }
        }

        // For other errors, retry with backoff
        if (attempt < maxRetries - 1) {
          const delay = baseDelay * Math.pow(2, attempt)
          console.log(`[AppProvider] Auth check failed (attempt ${attempt + 1}/${maxRetries}), retrying in ${delay}ms:`, error?.message)
          await new Promise(resolve => setTimeout(resolve, delay))
        } else {
          // Max retries reached for this cycle
          console.log('[AppProvider] Max retries reached for this validation cycle')
          authRetryCountRef.current++

          // Only logout after multiple consecutive validation cycles fail
          if (authRetryCountRef.current >= 3) {
            console.log('[AppProvider] Too many consecutive auth failures, logging out')
            return { user: null, shouldLogout: true }
          }

          return { user: null, shouldLogout: false }
        }
      } catch (err) {
        console.error(`[AppProvider] Exception in auth validation (attempt ${attempt + 1}):`, err)
        if (attempt === maxRetries - 1) {
          authRetryCountRef.current++
          if (authRetryCountRef.current >= 3) {
            return { user: null, shouldLogout: true }
          }
          return { user: null, shouldLogout: false }
        }
        await new Promise(resolve => setTimeout(resolve, baseDelay * Math.pow(2, attempt)))
      }
    }

    return { user: null, shouldLogout: false }
  }, [supabase])

  // Fetch user profile and organization
  const fetchUserData = useCallback(async (authUser: User): Promise<boolean> => {
    console.log('[AppProvider] fetchUserData called for user:', authUser.id, authUser.email)

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .single()

    console.log('[AppProvider] fetchUserData result:', { userData: userData ? 'found' : 'null', error: userError?.message })

    if (userError) {
      console.error('Error fetching user:', userError)
      if (isFatalAuthError(userError)) {
        await handleAuthError('fetchUserData:fatal')
        return false
      } else if (isAuthError(userError)) {
        await handleAuthError('fetchUserData:auth')
        return false
      }
      return false
    }

    if (!userData) {
      console.error('No user data found')
      return false
    }

    setAppUser({
      id: userData.id,
      email: userData.email,
      fullName: userData.full_name ?? undefined,
      avatarUrl: userData.avatar_url ?? undefined,
      role: userData.role,
      orgId: userData.org_id,
    })

    // Fetch organization
    const { data: orgData, error: orgError } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', userData.org_id)
      .single()

    if (orgError) {
      console.error('Error fetching organization:', orgError)
      if (isFatalAuthError(orgError)) {
        await handleAuthError('fetchUserData:org:fatal')
        return false
      } else if (isAuthError(orgError)) {
        await handleAuthError('fetchUserData:org:auth')
        return false
      }
      return false
    }

    setOrganization(orgData)
    return true
  }, [supabase, handleAuthError])

  // Fetch campaigns with skills count
  const fetchCampaigns = useCallback(async (): Promise<boolean> => {
    console.log('[AppProvider] fetchCampaigns called')

    const { data: campaignsData, error: campaignsError } = await supabase
      .from('campaigns')
      .select('*')
      .is('deleted_at', null)
      .is('completed_at', null)
      .order('created_at', { ascending: false })

    console.log('[AppProvider] fetchCampaigns result:', { count: campaignsData?.length, error: campaignsError?.message })

    if (campaignsError) {
      console.error('Error fetching campaigns:', campaignsError)
      if (isFatalAuthError(campaignsError)) {
        await handleAuthError('fetchCampaigns:fatal')
        return false
      } else if (isAuthError(campaignsError)) {
        await handleAuthError('fetchCampaigns:auth')
        return false
      }
      return false
    }

    // Fetch skills count for each campaign
    const campaignsWithSkills = await Promise.all(
      (campaignsData || []).map(async (campaign) => {
        const { count } = await supabase
          .from('skills')
          .select('*', { count: 'exact', head: true })
          .eq('campaign_id', campaign.id)
          .eq('captured', true)

        return mapDBCampaignToApp(campaign, count ?? 0)
      })
    )

    setCampaigns(campaignsWithSkills)
    return true
  }, [supabase, handleAuthError])

  // Fetch tasks
  const fetchTasks = useCallback(async (): Promise<boolean> => {
    const { data: tasksData, error: tasksError } = await supabase
      .from('tasks')
      .select('*')
      .is('deleted_at', null)
      .eq('completed', false)
      .order('due_at', { ascending: true })

    if (tasksError) {
      console.error('Error fetching tasks:', tasksError)
      if (isFatalAuthError(tasksError)) {
        await handleAuthError('fetchTasks:fatal')
        return false
      } else if (isAuthError(tasksError)) {
        await handleAuthError('fetchTasks:auth')
        return false
      }
      return false
    }

    setTasks((tasksData || []).map(mapDBTaskToApp))
    return true
  }, [supabase, handleAuthError])

  // Refresh all data
  const refreshData = useCallback(async () => {
    await Promise.all([fetchCampaigns(), fetchTasks()])
  }, [fetchCampaigns, fetchTasks])

  // Initialize auth and data
  useEffect(() => {
    let isMounted = true

    const initializeUser = async (authUser: User) => {
      if (!isMounted) return

      // Skip if already initializing or initialized in this mount cycle
      if (initializedRef.current) {
        console.log('[AppProvider] Already initialized, skipping')
        return
      }

      // Mark as initializing (will be set to false on cleanup)
      initializedRef.current = true
      console.log('[AppProvider] Initializing user...', authUser.id)
      setUser(authUser)

      try {
        const userDataSuccess = await fetchUserData(authUser)
        if (!isMounted) return

        if (userDataSuccess) {
          await refreshData()
          console.log('[AppProvider] User initialized successfully')
        } else {
          console.log('[AppProvider] Failed to fetch user data')
        }
      } catch (err) {
        console.error('[AppProvider] Exception during initialization:', err)
      }

      if (isMounted) {
        setIsLoading(false)
      }
    }

    const clearUser = () => {
      if (!isMounted) return
      setUser(null)
      setAppUser(null)
      setOrganization(null)
      setCampaigns([])
      setTasks([])
      setIsLoading(false)
    }

    // Set up auth listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return

        console.log('[AppProvider] Auth state change:', event, 'session:', session ? 'exists' : 'null', 'user:', session?.user?.email)

        if (event === 'SIGNED_IN' && session?.user) {
          await initializeUser(session.user)
        } else if (event === 'SIGNED_OUT') {
          initializedRef.current = false
          authRetryCountRef.current = 0
          clearUser()
        } else if (event === 'INITIAL_SESSION') {
          if (session?.user) {
            await initializeUser(session.user)
          } else {
            // No session - just stop loading, don't treat as error
            setIsLoading(false)
          }
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          // Token was refreshed successfully - reset retry count
          setUser(session.user)
          authRetryCountRef.current = 0
          console.log('[AppProvider] Token refreshed successfully')
        } else if (event === 'USER_UPDATED' && session?.user) {
          // User was updated, refresh user data
          setUser(session.user)
        }
      }
    )

    // Immediately check current session (handles React Strict Mode double-mount)
    // This ensures we always check the session, even if onAuthStateChange doesn't re-fire
    const checkSession = async () => {
      // Small delay to let onAuthStateChange fire first if it will
      await new Promise(resolve => setTimeout(resolve, 100))

      if (!isMounted) return
      if (initializedRef.current) {
        console.log('[AppProvider] Already initialized, skipping session check')
        return
      }

      console.log('[AppProvider] Checking current session...')

      try {
        const { data: { session } } = await supabase.auth.getSession()

        if (!isMounted) return

        if (session?.user) {
          console.log('[AppProvider] Session found, initializing user:', session.user.email)
          await initializeUser(session.user)
        } else {
          console.log('[AppProvider] No session found, setting loading to false')
          setIsLoading(false)
        }
      } catch (err) {
        console.error('[AppProvider] Exception checking session:', err)
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    checkSession()

    return () => {
      isMounted = false
      subscription.unsubscribe()
      // Reset initialized ref on unmount so HMR/Strict Mode can re-initialize
      initializedRef.current = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Periodic session validation with retry logic
  useEffect(() => {
    if (!user) return
    let isMounted = true

    const validateSession = async () => {
      // Prevent concurrent validation checks or after unmount
      if (isAuthCheckingRef.current || !isMounted) {
        console.log('[AppProvider] Auth check already in progress or unmounted, skipping')
        return
      }

      isAuthCheckingRef.current = true

      try {
        const { user: validatedUser, shouldLogout } = await validateSessionWithRetry()

        if (!isMounted) return

        if (shouldLogout) {
          console.log('[AppProvider] Session validation failed after retries, redirecting to login')
          await handleAuthError('periodic:validation')
        } else if (!validatedUser) {
          console.log('[AppProvider] Transient validation failure, will retry later')
        } else {
          console.log('[AppProvider] Session validated successfully')
        }
      } catch (err) {
        console.error('[AppProvider] Session validation error:', err)
      } finally {
        isAuthCheckingRef.current = false
      }
    }

    // Validate every 5 minutes
    const intervalId = setInterval(validateSession, 5 * 60 * 1000)

    // Also validate on window focus (user returns to tab)
    const handleFocus = () => {
      validateSession()
    }
    window.addEventListener('focus', handleFocus)

    return () => {
      isMounted = false
      clearInterval(intervalId)
      window.removeEventListener('focus', handleFocus)
    }
  }, [user, validateSessionWithRetry, handleAuthError])

  // Cross-tab logout synchronization via BroadcastChannel
  useEffect(() => {
    // BroadcastChannel is not available in all environments (e.g., SSR, older browsers)
    if (typeof window === 'undefined' || !('BroadcastChannel' in window)) {
      console.log('[AppProvider] BroadcastChannel not available, cross-tab sync disabled')
      return
    }

    // Clean up existing channel if effect re-runs
    if (broadcastChannelRef.current) {
      broadcastChannelRef.current.close()
      broadcastChannelRef.current = null
    }

    let isBroadcastLoggingOut = false

    try {
      const channel = new BroadcastChannel('tacit_auth')
      broadcastChannelRef.current = channel

      channel.onmessage = async (event) => {
        console.log('[AppProvider] Received broadcast message:', event.data)

        if (event.data.type === 'LOGOUT') {
          // Prevent concurrent broadcast-triggered logouts
          if (isBroadcastLoggingOut) {
            console.log('[AppProvider] Broadcast logout already in progress, skipping')
            return
          }
          isBroadcastLoggingOut = true

          console.log('[AppProvider] Logout broadcast received from another tab, logging out')

          try {
            // Clear local state without broadcasting again (prevent loop)
            setUser(null)
            setAppUser(null)
            setOrganization(null)
            setCampaigns([])
            setTasks([])
            authRetryCountRef.current = 0
            initializedRef.current = false

            // Sign out from Supabase
            await supabase.auth.signOut()
            router.push('/login')
          } catch (e) {
            console.error('[AppProvider] Error during broadcast logout:', e)
          } finally {
            isBroadcastLoggingOut = false
          }
        }
      }

      console.log('[AppProvider] BroadcastChannel initialized for cross-tab sync')

      return () => {
        channel.close()
        broadcastChannelRef.current = null
      }
    } catch (err) {
      console.error('[AppProvider] Error setting up BroadcastChannel:', err)
    }
  }, [supabase, router])

  // Sign out
  const signOut = useCallback(async () => {
    console.log('[AppProvider] Manual signOut called')

    // Prevent duplicate logout
    if (!user && !appUser) {
      console.log('[AppProvider] Already logged out')
      router.push('/login')
      return
    }

    try {
      // Broadcast logout to other tabs before signing out
      if (broadcastChannelRef.current) {
        try {
          broadcastChannelRef.current.postMessage({ type: 'LOGOUT', source: 'manual' })
        } catch (e) {
          console.error('[AppProvider] Error broadcasting logout:', e)
        }
      }

      await supabase.auth.signOut()

      // Clear state immediately (onAuthStateChange will also fire, but this is faster)
      setUser(null)
      setAppUser(null)
      setOrganization(null)
      setCampaigns([])
      setTasks([])
      authRetryCountRef.current = 0
      initializedRef.current = false

      router.push('/login')
      router.refresh()
    } catch (error) {
      console.error('Sign out error:', error)
      // Even if signOut fails, clear local state
      setUser(null)
      setAppUser(null)
      router.push('/login')
    }
  }, [supabase, router, user, appUser])

  // Toggle task completion
  const toggleTask = useCallback(async (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId)
    if (!task) return

    const newCompleted = !task.completed

    // Optimistic update
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId ? { ...t, completed: newCompleted } : t
      )
    )

    const { error } = await supabase
      .from('tasks')
      .update({
        completed: newCompleted,
        completed_at: newCompleted ? new Date().toISOString() : null
      })
      .eq('id', taskId)

    if (error) {
      console.error('Error toggling task:', error)
      // Revert on error
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId ? { ...t, completed: !newCompleted } : t
        )
      )
    }
  }, [tasks, supabase])

  // Update campaign
  const updateCampaign = useCallback(async (campaign: Campaign) => {
    const { error } = await supabase
      .from('campaigns')
      .update({
        expert_name: campaign.name,
        expert_role: campaign.role,
        department: campaign.department,
        years_experience: campaign.yearsExperience,
        goal: campaign.goal,
        status: uiStatusToDb(campaign.status),
        progress: campaign.progress,
        total_sessions: campaign.totalSessions,
        completed_sessions: campaign.completedSessions,
        capture_mode: campaign.captureMode,
        expert_email: campaign.expertEmail,
        updated_by: user?.id,
      })
      .eq('id', campaign.id)

    if (error) {
      console.error('Error updating campaign:', error)
      throw error
    }

    setCampaigns((prev) =>
      prev.map((c) => (c.id === campaign.id ? campaign : c))
    )
  }, [supabase, user])

  // Add campaign
  const addCampaign = useCallback(async (campaign: Omit<Campaign, 'id' | 'skillsCaptured'>) => {
    if (!appUser) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('campaigns')
      .insert({
        org_id: appUser.orgId,
        expert_name: campaign.name,
        expert_role: campaign.role,
        department: campaign.department,
        years_experience: campaign.yearsExperience,
        goal: campaign.goal,
        status: uiStatusToDb(campaign.status),
        progress: campaign.progress,
        total_sessions: campaign.totalSessions,
        completed_sessions: campaign.completedSessions,
        capture_mode: campaign.captureMode,
        expert_email: campaign.expertEmail,
        self_assessment: campaign.selfAssessment as unknown as Json,
        collaborators: campaign.collaborators as unknown as Json,
        created_by: user?.id,
      })
      .select()
      .single()

    if (error) {
      console.error('Error adding campaign:', error)
      throw error
    }

    // Parse and insert skills into the skills table
    if (campaign.skills) {
      const skillNames = campaign.skills
        .split('\n')
        .map(s => s.trim())
        .filter(s => s.length > 0)

      if (skillNames.length > 0) {
        const skillsToInsert = skillNames.map(name => ({
          campaign_id: data.id,
          name,
          captured: false,
          created_by: user?.id,
        }))

        const { error: skillsError } = await supabase
          .from('skills')
          .insert(skillsToInsert)

        if (skillsError) {
          console.error('Error inserting skills:', skillsError)
          // Don't throw - campaign was created successfully
        }
      }
    }

    const newCampaign: Campaign = {
      ...campaign,
      id: data.id,
      skillsCaptured: 0,
    }

    setCampaigns((prev) => [newCampaign, ...prev])
    return newCampaign
  }, [supabase, appUser, user])

  // Delete campaign (soft delete)
  const deleteCampaign = useCallback(async (campaignId: string) => {
    const { error } = await supabase
      .from('campaigns')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', campaignId)

    if (error) {
      console.error('Error deleting campaign:', error)
      throw error
    }

    setCampaigns((prev) => prev.filter((c) => c.id !== campaignId))
  }, [supabase])

  return (
    <AppContext.Provider
      value={{
        user,
        appUser,
        organization,
        isLoading,
        campaigns,
        tasks,
        signOut,
        toggleTask,
        updateCampaign,
        addCampaign,
        deleteCampaign,
        refreshData,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useApp must be used within an AppProvider')
  }
  return context
}
