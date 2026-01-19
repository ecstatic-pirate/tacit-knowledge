'use client'

import React, { createContext, useContext, ReactNode, useMemo, useCallback } from 'react'
import { User } from '@supabase/supabase-js'
import type { Organization } from '@/lib/supabase/database.types'
import { AuthProvider, useAuth } from './auth-context'
import {
  DataProvider,
  useData,
  type Campaign,
  type Task,
  type AppUser,
  type Collaborator,
  type CampaignSubjectType,
  type ProjectType,
  type CaptureSchedule,
  type CaptureCadence,
  type InterviewFormat,
  type SuggestedDomain,
  type FocusArea,
} from './data-context'

// Re-export types for backward compatibility
export type {
  Campaign,
  Task,
  AppUser,
  Collaborator,
  CampaignSubjectType,
  ProjectType,
  CaptureSchedule,
  CaptureCadence,
  InterviewFormat,
  SuggestedDomain,
  FocusArea,
}

// =============================================================================
// BACKWARD-COMPATIBLE APP CONTEXT INTERFACE
// =============================================================================

interface AppContextType {
  // Auth state
  user: User | null
  appUser: AppUser | null
  organization: Organization | null
  isLoading: boolean

  // Error state (new - for error banner)
  authError: string | null
  dataError: string | null
  hasError: boolean

  // Data
  campaigns: Campaign[]
  tasks: Task[]

  // Actions
  signOut: () => Promise<void>
  toggleTask: (taskId: string) => Promise<void>
  updateCampaign: (campaign: Campaign) => Promise<void>
  addCampaign: (campaign: Omit<Campaign, 'id' | 'topicsCaptured'>) => Promise<Campaign>
  deleteCampaign: (campaignId: string) => Promise<void>
  refreshData: () => Promise<void>
  clearErrors: () => void
  retryAuth: () => Promise<void>
}

const AppContext = createContext<AppContextType | undefined>(undefined)

// =============================================================================
// APP CONTEXT BRIDGE - Maps new contexts to old API
// =============================================================================

function AppContextBridge({ children }: { children: ReactNode }) {
  const { authState, signOut, retryAuth, clearError: clearAuthError } = useAuth()
  const {
    dataState,
    fetchAllData,
    toggleTask,
    updateCampaign,
    addCampaign,
    deleteCampaign,
    clearDataError,
  } = useData()

  // Compute isLoading from both states
  const isLoading = authState.status === 'initializing' ||
                    (authState.status === 'authenticated' && dataState.status === 'loading')

  // Map auth state to user
  const user = authState.status === 'authenticated' || authState.status === 'session-expired'
    ? authState.user
    : null

  // Map data state to app data
  const appUser = dataState.status === 'success' || dataState.status === 'partial-error'
    ? dataState.data.appUser
    : null

  const organization = dataState.status === 'success' || dataState.status === 'partial-error'
    ? dataState.data.organization
    : null

  const campaigns = dataState.status === 'success' || dataState.status === 'partial-error'
    ? dataState.data.campaigns
    : []

  const tasks = dataState.status === 'success' || dataState.status === 'partial-error'
    ? dataState.data.tasks
    : []

  // Error states
  const authError = authState.status === 'session-expired' || authState.status === 'error'
    ? authState.error
    : null

  const dataError = dataState.status === 'error' || dataState.status === 'partial-error'
    ? dataState.error?.message ?? null
    : null

  const hasError = authError !== null || dataError !== null

  // Clear all errors - memoized to avoid recreating on every render
  const clearErrors = useCallback(() => {
    clearAuthError()
    clearDataError()
  }, [clearAuthError, clearDataError])

  // Refresh data wrapper - memoized
  const refreshData = useCallback(async () => {
    await fetchAllData(true)
  }, [fetchAllData])

  const value: AppContextType = useMemo(
    () => ({
      user,
      appUser,
      organization,
      isLoading,
      authError,
      dataError,
      hasError,
      campaigns,
      tasks,
      signOut,
      toggleTask,
      updateCampaign,
      addCampaign,
      deleteCampaign,
      refreshData,
      clearErrors,
      retryAuth,
    }),
    [
      user,
      appUser,
      organization,
      isLoading,
      authError,
      dataError,
      hasError,
      campaigns,
      tasks,
      signOut,
      toggleTask,
      updateCampaign,
      addCampaign,
      deleteCampaign,
      refreshData,
      clearErrors,
      retryAuth,
    ]
  )

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  )
}

// =============================================================================
// APP PROVIDER - Composes Auth + Data providers
// =============================================================================

export function AppProvider({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <DataProvider>
        <AppContextBridge>
          {children}
        </AppContextBridge>
      </DataProvider>
    </AuthProvider>
  )
}

// =============================================================================
// HOOK - Backward compatible
// =============================================================================

export function useApp() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useApp must be used within an AppProvider')
  }
  return context
}
