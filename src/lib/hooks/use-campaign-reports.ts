'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface CampaignReportData {
  id: string
  name: string
  role: string
  subjectType: 'person' | 'project'
  status: string
  createdAt: string
  completedAt: string | null

  // Session metrics
  totalSessions: number
  completedSessions: number
  scheduledSessions: number
  inProgressSessions: number
  cancelledSessions: number
  averageDurationMinutes: number

  // Topic coverage
  totalTopics: number
  coveredTopics: number
  mentionedTopics: number
  notDiscussedTopics: number
  coveragePercentage: number

  // For project campaigns
  participantCount: number
  interviewedParticipants: number

  // Session history with dates
  sessions: {
    id: string
    sessionNumber: number
    status: string
    scheduledAt: string | null
    startedAt: string | null
    endedAt: string | null
    durationMinutes: number | null
    topicsCovered: string[]
  }[]
}

export interface ProgressTimelineEntry {
  date: string
  sessionsCompleted: number
  topicsCovered: number
  cumulativeSessions: number
  cumulativeTopics: number
}

export interface UseCampaignReportsOptions {
  timeRange?: 'week' | 'month' | 'all'
}

export interface UseCampaignReportsReturn {
  campaigns: CampaignReportData[]
  isLoading: boolean
  error: string | null

  // Aggregated stats
  totalCampaigns: number
  activeCampaigns: number
  completedCampaigns: number
  totalSessionsCompleted: number
  averageCoveragePercentage: number

  // Timeline data for progress charts
  progressTimeline: ProgressTimelineEntry[]

  refresh: () => Promise<void>
}

export function useCampaignReports(
  options: UseCampaignReportsOptions = {}
): UseCampaignReportsReturn {
  const { timeRange = 'all' } = options

  const [campaigns, setCampaigns] = useState<CampaignReportData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = useMemo(() => createClient(), [])

  const fetchReportData = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Calculate date filter based on time range
      let dateFilter: string | null = null
      if (timeRange === 'week') {
        const weekAgo = new Date()
        weekAgo.setDate(weekAgo.getDate() - 7)
        dateFilter = weekAgo.toISOString()
      } else if (timeRange === 'month') {
        const monthAgo = new Date()
        monthAgo.setMonth(monthAgo.getMonth() - 1)
        dateFilter = monthAgo.toISOString()
      }

      // Fetch all campaigns with their sessions
      const campaignsQuery = supabase
        .from('campaigns')
        .select(`
          id,
          expert_name,
          expert_role,
          subject_type,
          status,
          created_at,
          completed_at,
          total_sessions,
          completed_sessions
        `)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })

      const { data: campaignsData, error: campaignsError } = await campaignsQuery

      if (campaignsError) {
        throw campaignsError
      }

      // Process each campaign to get detailed metrics
      const campaignReports: CampaignReportData[] = await Promise.all(
        (campaignsData || []).map(async (campaign) => {
          // Fetch sessions for this campaign
          let sessionsQuery = supabase
            .from('sessions')
            .select('id, session_number, status, scheduled_at, started_at, ended_at, duration_minutes, topics')
            .eq('campaign_id', campaign.id)
            .is('deleted_at', null)
            .order('session_number', { ascending: true })

          if (dateFilter) {
            sessionsQuery = sessionsQuery.gte('created_at', dateFilter)
          }

          const { data: sessions } = await sessionsQuery

          // Fetch graph nodes for topic coverage
          const { data: graphNodes } = await supabase
            .from('graph_nodes')
            .select('coverage_status')
            .eq('campaign_id', campaign.id)
            .is('deleted_at', null)

          // Fetch participants for project campaigns
          const { data: participants } = await supabase
            .from('participants')
            .select('id, status')
            .eq('campaign_id', campaign.id)
            .is('deleted_at', null)

          // Calculate session metrics
          const sessionList = sessions || []
          const completedSessions = sessionList.filter(s => s.status === 'completed')
          const scheduledSessions = sessionList.filter(s => s.status === 'scheduled')
          const inProgressSessions = sessionList.filter(s => s.status === 'in_progress')
          const cancelledSessions = sessionList.filter(s => s.status === 'cancelled')

          const durationsWithValue = completedSessions
            .map(s => s.duration_minutes)
            .filter((d): d is number => d !== null && d > 0)
          const averageDuration = durationsWithValue.length > 0
            ? Math.round(durationsWithValue.reduce((a, b) => a + b, 0) / durationsWithValue.length)
            : 0

          // Calculate topic coverage from graph nodes
          const nodes = graphNodes || []
          const coveredCount = nodes.filter(n => n.coverage_status === 'covered').length
          const mentionedCount = nodes.filter(n => n.coverage_status === 'mentioned').length
          const notDiscussedCount = nodes.filter(n => n.coverage_status === 'not_discussed' || !n.coverage_status).length
          const totalTopics = nodes.length
          const coveragePercentage = totalTopics > 0 ? Math.round((coveredCount / totalTopics) * 100) : 0

          // Calculate participant metrics
          const participantList = participants || []
          const interviewedCount = participantList.filter(p => p.status === 'complete').length

          return {
            id: campaign.id,
            name: campaign.expert_name,
            role: campaign.expert_role,
            subjectType: (campaign.subject_type as 'person' | 'project') || 'person',
            status: campaign.status || 'active',
            createdAt: campaign.created_at || '',
            completedAt: campaign.completed_at,

            totalSessions: campaign.total_sessions || sessionList.length,
            completedSessions: completedSessions.length,
            scheduledSessions: scheduledSessions.length,
            inProgressSessions: inProgressSessions.length,
            cancelledSessions: cancelledSessions.length,
            averageDurationMinutes: averageDuration,

            totalTopics,
            coveredTopics: coveredCount,
            mentionedTopics: mentionedCount,
            notDiscussedTopics: notDiscussedCount,
            coveragePercentage,

            participantCount: participantList.length,
            interviewedParticipants: interviewedCount,

            sessions: sessionList.map(s => ({
              id: s.id,
              sessionNumber: s.session_number,
              status: s.status || 'scheduled',
              scheduledAt: s.scheduled_at,
              startedAt: s.started_at,
              endedAt: s.ended_at,
              durationMinutes: s.duration_minutes,
              topicsCovered: s.topics || [],
            })),
          }
        })
      )

      setCampaigns(campaignReports)
    } catch (err) {
      console.error('Error fetching campaign reports:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch report data')
    } finally {
      setIsLoading(false)
    }
  }, [supabase, timeRange])

  useEffect(() => {
    fetchReportData()
  }, [fetchReportData])

  // Compute aggregated stats
  const stats = useMemo(() => {
    const totalCampaigns = campaigns.length
    const activeCampaigns = campaigns.filter(c => !c.completedAt && c.status !== 'completed').length
    const completedCampaigns = campaigns.filter(c => c.completedAt || c.status === 'completed').length
    const totalSessionsCompleted = campaigns.reduce((sum, c) => sum + c.completedSessions, 0)

    const campaignsWithCoverage = campaigns.filter(c => c.totalTopics > 0)
    const averageCoveragePercentage = campaignsWithCoverage.length > 0
      ? Math.round(
          campaignsWithCoverage.reduce((sum, c) => sum + c.coveragePercentage, 0) /
          campaignsWithCoverage.length
        )
      : 0

    return {
      totalCampaigns,
      activeCampaigns,
      completedCampaigns,
      totalSessionsCompleted,
      averageCoveragePercentage,
    }
  }, [campaigns])

  // Compute progress timeline
  const progressTimeline = useMemo(() => {
    // Collect all completed sessions with dates
    const sessionsByDate = new Map<string, { sessions: number; topics: number }>()

    campaigns.forEach(campaign => {
      campaign.sessions
        .filter(s => s.status === 'completed' && s.endedAt)
        .forEach(session => {
          const date = new Date(session.endedAt!).toISOString().split('T')[0]
          const existing = sessionsByDate.get(date) || { sessions: 0, topics: 0 }
          sessionsByDate.set(date, {
            sessions: existing.sessions + 1,
            topics: existing.topics + session.topicsCovered.length,
          })
        })
    })

    // Sort dates and compute cumulative values
    const sortedDates = Array.from(sessionsByDate.keys()).sort()
    let cumulativeSessions = 0
    let cumulativeTopics = 0

    return sortedDates.map(date => {
      const dayData = sessionsByDate.get(date)!
      cumulativeSessions += dayData.sessions
      cumulativeTopics += dayData.topics

      return {
        date,
        sessionsCompleted: dayData.sessions,
        topicsCovered: dayData.topics,
        cumulativeSessions,
        cumulativeTopics,
      }
    })
  }, [campaigns])

  return {
    campaigns,
    isLoading,
    error,
    ...stats,
    progressTimeline,
    refresh: fetchReportData,
  }
}
