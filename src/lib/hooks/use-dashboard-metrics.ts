'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface DashboardMetrics {
  activeCampaigns: number
  campaignsOnTrack: number
  totalSkillsCaptured: number
  skillsThisWeek: number
  upcomingSessions: number
  nextSessionDate: string | null
  pendingTasks: number
  graphNodesCount: number
  graphNodesThisWeek: number
}

export interface ActivityItem {
  id: string
  type: 'session_completed' | 'skill_captured' | 'report_generated' | 'campaign_created'
  title: string
  description: string
  timestamp: string
  campaignName?: string
  metadata?: Record<string, unknown>
}

export interface UseDashboardMetricsReturn {
  metrics: DashboardMetrics
  activities: ActivityItem[]
  isLoading: boolean
  error: string | null
  refresh: () => Promise<void>
}

export function useDashboardMetrics(): UseDashboardMetricsReturn {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    activeCampaigns: 0,
    campaignsOnTrack: 0,
    totalSkillsCaptured: 0,
    skillsThisWeek: 0,
    upcomingSessions: 0,
    nextSessionDate: null,
    pendingTasks: 0,
    graphNodesCount: 0,
    graphNodesThisWeek: 0,
  })
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  const fetchMetrics = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const now = new Date()
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      const oneWeekAgoISO = oneWeekAgo.toISOString()

      // Fetch all metrics in parallel for performance
      const [
        campaignsResult,
        skillsResult,
        skillsThisWeekResult,
        upcomingSessionsResult,
        nextSessionResult,
        pendingTasksResult,
        graphNodesResult,
        graphNodesThisWeekResult,
      ] = await Promise.all([
        // Active campaigns (not deleted, not completed)
        supabase
          .from('campaigns')
          .select('id, status')
          .is('deleted_at', null)
          .is('completed_at', null),

        // Total skills captured
        supabase
          .from('skills')
          .select('*', { count: 'exact', head: true })
          .eq('captured', true)
          .is('deleted_at', null),

        // Skills captured this week
        supabase
          .from('skills')
          .select('*', { count: 'exact', head: true })
          .eq('captured', true)
          .gte('captured_at', oneWeekAgoISO)
          .is('deleted_at', null),

        // Upcoming sessions (scheduled, in the future)
        supabase
          .from('sessions')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'scheduled')
          .gte('scheduled_at', now.toISOString())
          .is('deleted_at', null),

        // Next session date
        supabase
          .from('sessions')
          .select('scheduled_at')
          .eq('status', 'scheduled')
          .gte('scheduled_at', now.toISOString())
          .is('deleted_at', null)
          .order('scheduled_at', { ascending: true })
          .limit(1)
          .maybeSingle(),

        // Pending tasks
        supabase
          .from('tasks')
          .select('*', { count: 'exact', head: true })
          .eq('completed', false)
          .is('deleted_at', null),

        // Total graph nodes
        supabase
          .from('graph_nodes')
          .select('*', { count: 'exact', head: true })
          .is('deleted_at', null),

        // Graph nodes this week
        supabase
          .from('graph_nodes')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', oneWeekAgoISO)
          .is('deleted_at', null),
      ])

      // Calculate campaigns on track
      const campaigns = campaignsResult.data || []
      const onTrackCount = campaigns.filter(c => c.status === 'on-track').length

      // Format next session date
      let nextSessionFormatted: string | null = null
      if (nextSessionResult.data?.scheduled_at) {
        const nextDate = new Date(nextSessionResult.data.scheduled_at)
        nextSessionFormatted = nextDate.toLocaleDateString('en-US', {
          weekday: 'short',
          hour: 'numeric',
          minute: '2-digit',
        })
      }

      setMetrics({
        activeCampaigns: campaigns.length,
        campaignsOnTrack: onTrackCount,
        totalSkillsCaptured: skillsResult.count ?? 0,
        skillsThisWeek: skillsThisWeekResult.count ?? 0,
        upcomingSessions: upcomingSessionsResult.count ?? 0,
        nextSessionDate: nextSessionFormatted,
        pendingTasks: pendingTasksResult.count ?? 0,
        graphNodesCount: graphNodesResult.count ?? 0,
        graphNodesThisWeek: graphNodesThisWeekResult.count ?? 0,
      })
    } catch (err) {
      console.error('Error fetching dashboard metrics:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch metrics')
    } finally {
      setIsLoading(false)
    }
  }, [supabase])

  const fetchActivities = useCallback(async () => {
    try {
      const activities: ActivityItem[] = []

      // Fetch recent completed sessions with campaign info
      const { data: sessions } = await supabase
        .from('sessions')
        .select(`
          id,
          session_number,
          ended_at,
          campaign_id,
          campaigns (
            expert_name
          )
        `)
        .eq('status', 'completed')
        .is('deleted_at', null)
        .order('ended_at', { ascending: false })
        .limit(5)

      if (sessions) {
        sessions.forEach((session) => {
          const campaign = session.campaigns as { expert_name: string } | null
          activities.push({
            id: `session-${session.id}`,
            type: 'session_completed',
            title: campaign?.expert_name || 'Unknown Expert',
            description: `completed Session ${session.session_number}`,
            timestamp: session.ended_at || new Date().toISOString(),
            campaignName: campaign?.expert_name,
          })
        })
      }

      // Fetch recent skills captured
      const { data: skills } = await supabase
        .from('skills')
        .select(`
          id,
          name,
          captured_at,
          campaigns (
            expert_name
          )
        `)
        .eq('captured', true)
        .is('deleted_at', null)
        .order('captured_at', { ascending: false })
        .limit(5)

      if (skills) {
        skills.forEach((skill) => {
          const campaign = skill.campaigns as { expert_name: string } | null
          activities.push({
            id: `skill-${skill.id}`,
            type: 'skill_captured',
            title: skill.name,
            description: `skill captured from ${campaign?.expert_name || 'Unknown'}`,
            timestamp: skill.captured_at || new Date().toISOString(),
            campaignName: campaign?.expert_name,
          })
        })
      }

      // Fetch recent reports
      const { data: reports } = await supabase
        .from('reports')
        .select(`
          id,
          title,
          type,
          created_at,
          campaigns (
            expert_name
          )
        `)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(3)

      if (reports) {
        reports.forEach((report) => {
          const campaign = report.campaigns as { expert_name: string } | null
          activities.push({
            id: `report-${report.id}`,
            type: 'report_generated',
            title: report.title,
            description: `${report.type} report generated`,
            timestamp: report.created_at || new Date().toISOString(),
            campaignName: campaign?.expert_name,
          })
        })
      }

      // Sort all activities by timestamp
      activities.sort((a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )

      setActivities(activities.slice(0, 10))
    } catch (err) {
      console.error('Error fetching activities:', err)
    }
  }, [supabase])

  const refresh = useCallback(async () => {
    await Promise.all([fetchMetrics(), fetchActivities()])
  }, [fetchMetrics, fetchActivities])

  useEffect(() => {
    refresh()
  }, [refresh])

  return {
    metrics,
    activities,
    isLoading,
    error,
    refresh,
  }
}
