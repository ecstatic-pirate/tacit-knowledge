'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface DashboardMetrics {
  activeCampaigns: number
  totalSkillsCaptured: number
  upcomingSessions: number
  graphNodesCount: number
}

export interface UseDashboardMetricsReturn {
  metrics: DashboardMetrics
  isLoading: boolean
  error: string | null
  refresh: () => Promise<void>
}

export function useDashboardMetrics(): UseDashboardMetricsReturn {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    activeCampaigns: 0,
    totalSkillsCaptured: 0,
    upcomingSessions: 0,
    graphNodesCount: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const hasFetched = useRef(false)

  const supabase = useMemo(() => createClient(), [])

  const fetchMetrics = useCallback(async () => {
    // Prevent double fetch
    if (hasFetched.current) return
    hasFetched.current = true

    setIsLoading(true)
    setError(null)

    try {
      // Simplified: fetch counts in parallel with minimal queries
      const [campaignsResult, skillsResult, sessionsResult, nodesResult] = await Promise.all([
        supabase
          .from('campaigns')
          .select('id', { count: 'exact', head: true })
          .is('deleted_at', null)
          .is('completed_at', null),
        supabase
          .from('skills')
          .select('id', { count: 'exact', head: true })
          .eq('captured', true)
          .is('deleted_at', null),
        supabase
          .from('sessions')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'scheduled')
          .is('deleted_at', null),
        supabase
          .from('graph_nodes')
          .select('id', { count: 'exact', head: true })
          .is('deleted_at', null),
      ])

      setMetrics({
        activeCampaigns: campaignsResult.count ?? 0,
        totalSkillsCaptured: skillsResult.count ?? 0,
        upcomingSessions: sessionsResult.count ?? 0,
        graphNodesCount: nodesResult.count ?? 0,
      })
    } catch (err) {
      console.error('Error fetching dashboard metrics:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch metrics')
    } finally {
      setIsLoading(false)
    }
  }, [supabase])

  const refresh = useCallback(async () => {
    hasFetched.current = false
    await fetchMetrics()
  }, [fetchMetrics])

  useEffect(() => {
    fetchMetrics()
  }, [fetchMetrics])

  return {
    metrics,
    isLoading,
    error,
    refresh,
  }
}
