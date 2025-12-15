'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import type {
  Campaign as DBCampaign,
  Task as DBTask,
  User as DBUser,
  Organization,
  Skill as DBSkill,
  Session as DBSession,
} from '@/lib/supabase/database.types'

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

// Helper to map database campaign to app campaign
function mapDBCampaignToApp(dbCampaign: DBCampaign, skillsCount: number): Campaign {
  return {
    id: dbCampaign.id,
    name: dbCampaign.expert_name,
    role: dbCampaign.expert_role,
    department: dbCampaign.department ?? undefined,
    yearsExperience: dbCampaign.years_experience ?? undefined,
    goal: dbCampaign.goal ?? undefined,
    status: (dbCampaign.status as Campaign['status']) ?? 'on-track',
    progress: dbCampaign.progress ?? 0,
    totalSessions: dbCampaign.total_sessions ?? 14,
    completedSessions: dbCampaign.completed_sessions ?? 0,
    skillsCaptured: skillsCount,
    captureMode: dbCampaign.capture_mode ?? undefined,
    expertEmail: dbCampaign.expert_email ?? undefined,
    createdAt: dbCampaign.created_at ?? undefined,
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

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [appUser, setAppUser] = useState<AppUser | null>(null)
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const supabase = createClient()

  // Fetch user profile and organization
  const fetchUserData = useCallback(async (authUser: User) => {
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .single()

    if (userError || !userData) {
      console.error('Error fetching user:', userError)
      return
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
      return
    }

    setOrganization(orgData)
  }, [supabase])

  // Fetch campaigns with skills count
  const fetchCampaigns = useCallback(async () => {
    const { data: campaignsData, error: campaignsError } = await supabase
      .from('campaigns')
      .select('*')
      .order('created_at', { ascending: false })

    if (campaignsError) {
      console.error('Error fetching campaigns:', campaignsError)
      return
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
  }, [supabase])

  // Fetch tasks
  const fetchTasks = useCallback(async () => {
    const { data: tasksData, error: tasksError } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false })

    if (tasksError) {
      console.error('Error fetching tasks:', tasksError)
      return
    }

    setTasks((tasksData || []).map(mapDBTaskToApp))
  }, [supabase])

  // Refresh all data
  const refreshData = useCallback(async () => {
    await Promise.all([fetchCampaigns(), fetchTasks()])
  }, [fetchCampaigns, fetchTasks])

  // Initialize auth and data
  useEffect(() => {
    const initAuth = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser()

      if (authUser) {
        setUser(authUser)
        await fetchUserData(authUser)
        await refreshData()
      }

      setIsLoading(false)
    }

    initAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          setUser(session.user)
          await fetchUserData(session.user)
          await refreshData()
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
          setAppUser(null)
          setOrganization(null)
          setCampaigns([])
          setTasks([])
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase, fetchUserData, refreshData])

  // Sign out
  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
  }, [supabase])

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
        status: campaign.status,
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
        status: campaign.status,
        progress: campaign.progress,
        total_sessions: campaign.totalSessions,
        completed_sessions: campaign.completedSessions,
        capture_mode: campaign.captureMode,
        expert_email: campaign.expertEmail,
        created_by: user?.id,
      })
      .select()
      .single()

    if (error) {
      console.error('Error adding campaign:', error)
      throw error
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
