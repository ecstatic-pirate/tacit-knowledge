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
import { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from './auth-context'
import { isAbortError, isFatalAuthError, isAuthError } from '@/lib/auth/error-utils'
import type {
  Campaign as DBCampaign,
  Task as DBTask,
  Organization,
  SelfAssessment,
  Json,
} from '@/lib/supabase/database.types'

// =============================================================================
// APP DATA TYPES (re-exported from original app-context)
// =============================================================================

export interface Collaborator {
  name: string
  email: string
  role: 'successor' | 'teammate' | 'partner' | 'manager' | 'report'
}

export type CampaignSubjectType = 'person' | 'project'
export type ProjectType = 'system_tool' | 'process_workflow' | 'client_relationship' | 'regulatory_compliance' | 'product_service'
export type CaptureSchedule = 'cadence' | 'event_driven'
export type CaptureCadence = 'weekly' | 'biweekly' | 'monthly'
export type InterviewFormat = 'human_led' | 'ai_live' | 'ai_async'

export interface SuggestedDomain {
  name: string
  confidence: number
  description: string
}

export interface FocusArea {
  area: string
  description: string
  priority: 'high' | 'medium' | 'low'
}

export interface Campaign {
  id: string
  name: string
  role: string
  goal?: string
  status: 'on-track' | 'keep-track' | 'danger'
  progress: number
  totalSessions: number
  completedSessions: number
  topicsCaptured: number
  captureMode?: string
  expertEmail?: string
  departureDate?: string
  createdAt?: string
  selfAssessment?: SelfAssessment
  collaborators?: Collaborator[]
  subjectType: CampaignSubjectType
  projectId?: string
  teamId?: string
  projectType?: ProjectType
  captureSchedule?: CaptureSchedule
  captureCadence?: CaptureCadence
  interviewFormat?: InterviewFormat
  focusAreas?: FocusArea[]
  suggestedDomains?: SuggestedDomain[]
  initiativeType?: 'tool' | 'platform' | 'process' | 'integration'
  initiativeStatus?: 'planned' | 'active' | 'scaling' | 'retired'
  teamSize?: number
  techStack?: string[]
  businessUnit?: string
  lastCheckIn?: string
  region?: string
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
  roleType?: 'management' | 'builder' | 'both'
  region?: string
  department?: string
  expertiseAreas?: string[]
}

interface AppData {
  appUser: AppUser | null
  organization: Organization | null
  campaigns: Campaign[]
  tasks: Task[]
}

// =============================================================================
// DATA STATE TYPES
// =============================================================================

export type DataStatus = 'idle' | 'loading' | 'success' | 'partial-error' | 'error'

export interface DataError {
  message: string
  failedResources?: string[]
  canRetry: boolean
}

export interface DataState {
  status: DataStatus
  data: AppData
  error: DataError | null
  retryCount: number
  lastFetchedAt: number | null
}

// =============================================================================
// DATA ACTIONS
// =============================================================================

type DataAction =
  | { type: 'DATA_FETCH_START'; isRetry?: boolean }
  | { type: 'DATA_FETCH_SUCCESS'; data: AppData }
  | { type: 'DATA_FETCH_PARTIAL_SUCCESS'; data: AppData; error: DataError }
  | { type: 'DATA_FETCH_ERROR'; error: DataError }
  | { type: 'DATA_RESET' }
  | { type: 'DATA_UPDATE_CAMPAIGN'; campaign: Campaign }
  | { type: 'DATA_ADD_CAMPAIGN'; campaign: Campaign }
  | { type: 'DATA_DELETE_CAMPAIGN'; campaignId: string }
  | { type: 'DATA_TOGGLE_TASK'; taskId: string }
  | { type: 'DATA_CLEAR_ERROR' }

// =============================================================================
// DATA REDUCER
// =============================================================================

const initialDataState: DataState = {
  status: 'idle',
  data: {
    appUser: null,
    organization: null,
    campaigns: [],
    tasks: [],
  },
  error: null,
  retryCount: 0,
  lastFetchedAt: null,
}

function dataReducer(state: DataState, action: DataAction): DataState {
  switch (action.type) {
    case 'DATA_FETCH_START':
      return {
        ...state,
        status: 'loading',
        error: action.isRetry ? state.error : null,
      }

    case 'DATA_FETCH_SUCCESS':
      return {
        status: 'success',
        data: action.data,
        error: null,
        retryCount: 0,
        lastFetchedAt: Date.now(),
      }

    case 'DATA_FETCH_PARTIAL_SUCCESS':
      return {
        status: 'partial-error',
        data: action.data,
        error: action.error,
        retryCount: state.retryCount + 1,
        lastFetchedAt: Date.now(),
      }

    case 'DATA_FETCH_ERROR':
      return {
        ...state,
        status: 'error',
        error: action.error,
        retryCount: state.retryCount + 1,
      }

    case 'DATA_RESET':
      return initialDataState

    case 'DATA_UPDATE_CAMPAIGN':
      return {
        ...state,
        data: {
          ...state.data,
          campaigns: state.data.campaigns.map(c =>
            c.id === action.campaign.id ? action.campaign : c
          ),
        },
      }

    case 'DATA_ADD_CAMPAIGN':
      return {
        ...state,
        data: {
          ...state.data,
          campaigns: [action.campaign, ...state.data.campaigns],
        },
      }

    case 'DATA_DELETE_CAMPAIGN':
      return {
        ...state,
        data: {
          ...state.data,
          campaigns: state.data.campaigns.filter(c => c.id !== action.campaignId),
        },
      }

    case 'DATA_TOGGLE_TASK':
      return {
        ...state,
        data: {
          ...state.data,
          tasks: state.data.tasks.map(t =>
            t.id === action.taskId ? { ...t, completed: !t.completed } : t
          ),
        },
      }

    case 'DATA_CLEAR_ERROR':
      return {
        ...state,
        error: null,
      }

    default:
      return state
  }
}

// =============================================================================
// HELPERS
// =============================================================================

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

function mapDBCampaignToApp(dbCampaign: DBCampaign, topicsCount: number): Campaign {
  return {
    id: dbCampaign.id,
    name: dbCampaign.expert_name,
    role: dbCampaign.expert_role,
    goal: dbCampaign.goal ?? undefined,
    status: dbStatusToUi(dbCampaign.status),
    progress: dbCampaign.progress ?? 0,
    totalSessions: dbCampaign.total_sessions ?? 14,
    completedSessions: dbCampaign.completed_sessions ?? 0,
    topicsCaptured: topicsCount,
    captureMode: dbCampaign.capture_mode ?? undefined,
    expertEmail: dbCampaign.expert_email ?? undefined,
    departureDate: (dbCampaign as Record<string, unknown>).departure_date as string | undefined,
    createdAt: dbCampaign.created_at ?? undefined,
    selfAssessment: dbCampaign.self_assessment as SelfAssessment | undefined,
    subjectType: (dbCampaign.subject_type as CampaignSubjectType) ?? 'person',
    projectId: dbCampaign.project_id ?? undefined,
    teamId: dbCampaign.team_id ?? undefined,
    projectType: (dbCampaign as Record<string, unknown>).project_type as ProjectType | undefined,
    captureSchedule: (dbCampaign as Record<string, unknown>).capture_schedule as CaptureSchedule | undefined,
    captureCadence: (dbCampaign as Record<string, unknown>).capture_cadence as CaptureCadence | undefined,
    interviewFormat: (dbCampaign as Record<string, unknown>).interview_format as InterviewFormat | undefined,
    focusAreas: (dbCampaign as Record<string, unknown>).focus_areas as FocusArea[] | undefined,
    suggestedDomains: (dbCampaign as Record<string, unknown>).ai_suggested_domains as SuggestedDomain[] | undefined,
    initiativeType: (dbCampaign as Record<string, unknown>).initiative_type as Campaign['initiativeType'],
    initiativeStatus: (dbCampaign as Record<string, unknown>).initiative_status as Campaign['initiativeStatus'],
    teamSize: (dbCampaign as Record<string, unknown>).team_size as number | undefined,
    techStack: (dbCampaign as Record<string, unknown>).tech_stack as string[] | undefined,
    businessUnit: (dbCampaign as Record<string, unknown>).business_unit as string | undefined,
    lastCheckIn: (dbCampaign as Record<string, unknown>).last_check_in as string | undefined,
    region: (dbCampaign as Record<string, unknown>).region as string | undefined,
  }
}

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

// =============================================================================
// DATA CONTEXT
// =============================================================================

interface DataContextType {
  dataState: DataState
  fetchAllData: (isRetry?: boolean) => Promise<void>
  toggleTask: (taskId: string) => Promise<void>
  updateCampaign: (campaign: Campaign) => Promise<void>
  addCampaign: (campaign: Omit<Campaign, 'id' | 'topicsCaptured'>) => Promise<Campaign>
  deleteCampaign: (campaignId: string) => Promise<void>
  clearDataError: () => void
}

const DataContext = createContext<DataContextType | undefined>(undefined)

// =============================================================================
// DATA PROVIDER
// =============================================================================

export function DataProvider({ children }: { children: ReactNode }) {
  const { authState, signOut } = useAuth()
  const [dataState, dispatch] = useReducer(dataReducer, initialDataState)
  const supabase = useMemo(() => createClient(), [])
  const isFetchingRef = useRef(false)

  // Fetch user profile and organization
  const fetchUserData = useCallback(async (authUser: User): Promise<{
    appUser: AppUser | null
    organization: Organization | null
    error?: string
  }> => {
    const TIMEOUT_MS = 15000

    try {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .abortSignal(AbortSignal.timeout(TIMEOUT_MS))
        .single()

      if (userError) {
        console.error('[DataProvider] User fetch error:', userError)
        if (isFatalAuthError(userError) || isAuthError(userError)) {
          return { appUser: null, organization: null, error: 'auth' }
        }
        return { appUser: null, organization: null, error: userError.message }
      }

      if (!userData) {
        return { appUser: null, organization: null, error: 'User not found' }
      }

      // Load user profile
      const { data: profileData } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', authUser.id)
        .single()

      const appUser: AppUser = {
        id: userData.id,
        email: userData.email,
        fullName: userData.full_name ?? undefined,
        avatarUrl: userData.avatar_url ?? undefined,
        role: userData.role,
        orgId: userData.org_id,
        roleType: profileData?.role_type as AppUser['roleType'],
        region: profileData?.region ?? undefined,
        department: profileData?.department ?? undefined,
        expertiseAreas: profileData?.expertise_areas ?? undefined,
      }

      // Fetch organization
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', userData.org_id)
        .abortSignal(AbortSignal.timeout(10000))
        .single()

      if (orgError) {
        console.error('[DataProvider] Org fetch error:', orgError)
        if (isFatalAuthError(orgError) || isAuthError(orgError)) {
          return { appUser: null, organization: null, error: 'auth' }
        }
        // Still return appUser even if org fails
        return { appUser, organization: null, error: orgError.message }
      }

      return { appUser, organization: orgData }
    } catch (err) {
      if (isAbortError(err)) {
        console.log('[DataProvider] User fetch timed out')
        return { appUser: null, organization: null, error: 'timeout' }
      }
      console.error('[DataProvider] User fetch exception:', err)
      return { appUser: null, organization: null, error: 'Network error' }
    }
  }, [supabase])

  // Fetch campaigns
  const fetchCampaigns = useCallback(async (): Promise<{
    campaigns: Campaign[]
    error?: string
  }> => {
    try {
      const { data: campaignsData, error: campaignsError } = await supabase
        .from('campaigns')
        .select('*')
        .is('deleted_at', null)
        .is('completed_at', null)
        .order('created_at', { ascending: false })
        .abortSignal(AbortSignal.timeout(15000))

      if (campaignsError) {
        console.error('[DataProvider] Campaigns fetch error:', campaignsError)
        if (isFatalAuthError(campaignsError) || isAuthError(campaignsError)) {
          return { campaigns: [], error: 'auth' }
        }
        return { campaigns: [], error: campaignsError.message }
      }

      // Fetch topics count for each campaign
      const campaignsWithTopics = await Promise.all(
        (campaignsData || []).map(async (campaign) => {
          const { count } = await supabase
            .from('topics')
            .select('*', { count: 'exact', head: true })
            .eq('campaign_id', campaign.id)
            .eq('captured', true)

          return mapDBCampaignToApp(campaign, count ?? 0)
        })
      )

      return { campaigns: campaignsWithTopics }
    } catch (err) {
      if (isAbortError(err)) {
        return { campaigns: [], error: 'timeout' }
      }
      console.error('[DataProvider] Campaigns fetch exception:', err)
      return { campaigns: [], error: 'Network error' }
    }
  }, [supabase])

  // Fetch tasks
  const fetchTasks = useCallback(async (): Promise<{
    tasks: Task[]
    error?: string
  }> => {
    try {
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .is('deleted_at', null)
        .eq('completed', false)
        .order('due_at', { ascending: true })
        .abortSignal(AbortSignal.timeout(10000))

      if (tasksError) {
        console.error('[DataProvider] Tasks fetch error:', tasksError)
        if (isFatalAuthError(tasksError) || isAuthError(tasksError)) {
          return { tasks: [], error: 'auth' }
        }
        return { tasks: [], error: tasksError.message }
      }

      return { tasks: (tasksData || []).map(mapDBTaskToApp) }
    } catch (err) {
      if (isAbortError(err)) {
        return { tasks: [], error: 'timeout' }
      }
      console.error('[DataProvider] Tasks fetch exception:', err)
      return { tasks: [], error: 'Network error' }
    }
  }, [supabase])

  // Fetch all data
  const fetchAllData = useCallback(async (isRetry = false) => {
    if (!authState.user) {
      console.log('[DataProvider] No user, skipping fetch')
      return
    }

    if (isFetchingRef.current) {
      console.log('[DataProvider] Already fetching, skipping')
      return
    }

    isFetchingRef.current = true
    dispatch({ type: 'DATA_FETCH_START', isRetry })

    try {
      // Fetch all data in parallel
      const [userResult, campaignsResult, tasksResult] = await Promise.all([
        fetchUserData(authState.user),
        fetchCampaigns(),
        fetchTasks(),
      ])

      // Check for auth errors - if any, trigger logout
      const hasAuthError = userResult.error === 'auth' ||
                          campaignsResult.error === 'auth' ||
                          tasksResult.error === 'auth'

      if (hasAuthError) {
        console.log('[DataProvider] Auth error detected, signing out')
        await signOut()
        return
      }

      // Check what succeeded
      const hasUserData = userResult.appUser !== null
      const hasCampaigns = !campaignsResult.error
      const hasTasks = !tasksResult.error

      if (hasUserData && hasCampaigns && hasTasks) {
        // Full success
        dispatch({
          type: 'DATA_FETCH_SUCCESS',
          data: {
            appUser: userResult.appUser,
            organization: userResult.organization,
            campaigns: campaignsResult.campaigns,
            tasks: tasksResult.tasks,
          },
        })
      } else if (hasUserData) {
        // Partial success - have user but missing some data
        const failedResources: string[] = []
        if (!hasCampaigns) failedResources.push('campaigns')
        if (!hasTasks) failedResources.push('tasks')

        dispatch({
          type: 'DATA_FETCH_PARTIAL_SUCCESS',
          data: {
            appUser: userResult.appUser,
            organization: userResult.organization,
            campaigns: campaignsResult.campaigns,
            tasks: tasksResult.tasks,
          },
          error: {
            message: 'Some data failed to load. You may see incomplete information.',
            failedResources,
            canRetry: true,
          },
        })
      } else {
        // Complete failure
        const errorMessage = userResult.error === 'timeout'
          ? 'Request timed out. Please check your connection and try again.'
          : 'Failed to load your data. Please try again.'

        dispatch({
          type: 'DATA_FETCH_ERROR',
          error: {
            message: errorMessage,
            canRetry: true,
          },
        })
      }
    } catch (err) {
      console.error('[DataProvider] fetchAllData exception:', err)
      dispatch({
        type: 'DATA_FETCH_ERROR',
        error: {
          message: 'An unexpected error occurred. Please try again.',
          canRetry: true,
        },
      })
    } finally {
      isFetchingRef.current = false
    }
  }, [authState.user, fetchUserData, fetchCampaigns, fetchTasks, signOut])

  // Auto-fetch when authenticated
  useEffect(() => {
    if (authState.status === 'authenticated' && dataState.status === 'idle') {
      console.log('[DataProvider] User authenticated, fetching data...')
      fetchAllData()
    }

    if (authState.status === 'unauthenticated' || authState.status === 'session-expired') {
      dispatch({ type: 'DATA_RESET' })
    }
  }, [authState.status, dataState.status, fetchAllData])

  // Toggle task
  const toggleTask = useCallback(async (taskId: string) => {
    const task = dataState.data.tasks.find(t => t.id === taskId)
    if (!task) return

    // Optimistic update
    dispatch({ type: 'DATA_TOGGLE_TASK', taskId })

    const { error } = await supabase
      .from('tasks')
      .update({
        completed: !task.completed,
        completed_at: !task.completed ? new Date().toISOString() : null,
      })
      .eq('id', taskId)

    if (error) {
      console.error('[DataProvider] Toggle task error:', error)
      // Revert on error
      dispatch({ type: 'DATA_TOGGLE_TASK', taskId })
    }
  }, [dataState.data.tasks, supabase])

  // Update campaign
  const updateCampaign = useCallback(async (campaign: Campaign) => {
    const { error } = await supabase
      .from('campaigns')
      .update({
        expert_name: campaign.name,
        expert_role: campaign.role,
        goal: campaign.goal,
        status: uiStatusToDb(campaign.status),
        progress: campaign.progress,
        total_sessions: campaign.totalSessions,
        completed_sessions: campaign.completedSessions,
        capture_mode: campaign.captureMode,
        expert_email: campaign.expertEmail,
        departure_date: campaign.departureDate ?? null,
        initiative_type: campaign.initiativeType ?? null,
        initiative_status: campaign.initiativeStatus ?? null,
        team_size: campaign.teamSize ?? null,
        tech_stack: campaign.techStack ?? null,
        business_unit: campaign.businessUnit ?? null,
        region: campaign.region ?? null,
        last_check_in: campaign.lastCheckIn ?? null,
        updated_by: authState.user?.id,
      })
      .eq('id', campaign.id)

    if (error) {
      console.error('[DataProvider] Update campaign error:', error)
      throw error
    }

    dispatch({ type: 'DATA_UPDATE_CAMPAIGN', campaign })
  }, [supabase, authState.user])

  // Add campaign
  const addCampaign = useCallback(async (campaign: Omit<Campaign, 'id' | 'topicsCaptured'>): Promise<Campaign> => {
    if (!dataState.data.appUser) {
      throw new Error('User not authenticated')
    }

    // Generate guide token
    const tokenBytes = new Uint8Array(32)
    crypto.getRandomValues(tokenBytes)
    const guideToken = Array.from(tokenBytes).map(b => b.toString(16).padStart(2, '0')).join('')

    const { data, error } = await supabase
      .from('campaigns')
      .insert({
        org_id: dataState.data.appUser.orgId,
        expert_name: campaign.name,
        expert_role: campaign.role,
        goal: campaign.goal,
        status: uiStatusToDb(campaign.status),
        progress: campaign.progress,
        total_sessions: campaign.totalSessions,
        completed_sessions: campaign.completedSessions,
        capture_mode: campaign.captureMode,
        expert_email: campaign.expertEmail,
        departure_date: campaign.departureDate ?? null,
        self_assessment: campaign.selfAssessment as unknown as Json,
        collaborators: campaign.collaborators as unknown as Json,
        created_by: authState.user?.id,
        subject_type: campaign.subjectType ?? 'person',
        project_id: campaign.projectId ?? null,
        team_id: campaign.teamId ?? null,
        project_type: campaign.projectType ?? null,
        capture_schedule: campaign.captureSchedule ?? null,
        capture_cadence: campaign.captureCadence ?? null,
        interview_format: campaign.interviewFormat ?? null,
        focus_areas: campaign.focusAreas as unknown as Json ?? null,
        ai_suggested_domains: campaign.suggestedDomains as unknown as Json ?? null,
        interviewer_guide_token: guideToken,
        initiative_type: campaign.initiativeType ?? null,
        initiative_status: campaign.initiativeStatus ?? null,
        team_size: campaign.teamSize ?? null,
        tech_stack: campaign.techStack ?? null,
        business_unit: campaign.businessUnit ?? null,
        region: campaign.region ?? null,
      })
      .select()
      .single()

    if (error) {
      console.error('[DataProvider] Add campaign error:', error)
      throw error
    }

    const newCampaign: Campaign = {
      ...campaign,
      id: data.id,
      topicsCaptured: 0,
    }

    dispatch({ type: 'DATA_ADD_CAMPAIGN', campaign: newCampaign })
    return newCampaign
  }, [supabase, dataState.data.appUser, authState.user])

  // Delete campaign
  const deleteCampaign = useCallback(async (campaignId: string) => {
    const { error } = await supabase
      .from('campaigns')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', campaignId)

    if (error) {
      console.error('[DataProvider] Delete campaign error:', error)
      throw error
    }

    dispatch({ type: 'DATA_DELETE_CAMPAIGN', campaignId })
  }, [supabase])

  // Clear error
  const clearDataError = useCallback(() => {
    dispatch({ type: 'DATA_CLEAR_ERROR' })
  }, [])

  const contextValue = useMemo(
    () => ({
      dataState,
      fetchAllData,
      toggleTask,
      updateCampaign,
      addCampaign,
      deleteCampaign,
      clearDataError,
    }),
    [dataState, fetchAllData, toggleTask, updateCampaign, addCampaign, deleteCampaign, clearDataError]
  )

  return (
    <DataContext.Provider value={contextValue}>
      {children}
    </DataContext.Provider>
  )
}

// =============================================================================
// HOOK
// =============================================================================

export function useData() {
  const context = useContext(DataContext)
  if (!context) {
    throw new Error('useData must be used within a DataProvider')
  }
  return context
}
