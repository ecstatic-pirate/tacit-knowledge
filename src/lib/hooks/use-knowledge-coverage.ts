'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

export type CoverageStatus = 'covered' | 'mentioned' | 'not_discussed'

interface TopicNode {
  id: string
  label: string
  description: string | null
  coverageStatus: CoverageStatus
  type: string
}

interface UseKnowledgeCoverageOptions {
  campaignId: string
  /** Include related data from self-assessment and collaborator responses */
  includeRelatedTopics?: boolean
}

interface UseKnowledgeCoverageReturn {
  // Data
  nodes: TopicNode[]
  isLoading: boolean
  error: string | null

  // Coverage stats
  coveredCount: number
  mentionedCount: number
  notDiscussedCount: number
  totalCount: number
  coveragePercentage: number

  // Actions
  refresh: () => Promise<void>
}

/**
 * Hook to calculate knowledge coverage for a campaign.
 * Coverage is calculated from graph_nodes with coverage_status field.
 *
 * Formula: (covered nodes / total nodes) * 100
 *
 * Coverage statuses:
 * - 'covered': Topic has been fully discussed in interviews
 * - 'mentioned': Topic was touched upon but not fully covered
 * - 'not_discussed': Topic has not been discussed yet
 */
export function useKnowledgeCoverage({
  campaignId,
  includeRelatedTopics = false,
}: UseKnowledgeCoverageOptions): UseKnowledgeCoverageReturn {
  const [nodes, setNodes] = useState<TopicNode[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = useMemo(() => createClient(), [])

  const fetchCoverageData = useCallback(async () => {
    if (!campaignId) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Fetch graph nodes for this campaign
      const { data: graphNodes, error: graphError } = await supabase
        .from('graph_nodes')
        .select('id, label, description, coverage_status, type')
        .eq('campaign_id', campaignId)
        .is('deleted_at', null)
        .order('label', { ascending: true })

      if (graphError) {
        throw graphError
      }

      // Transform to our internal format
      const topicNodes: TopicNode[] = (graphNodes || []).map(node => ({
        id: node.id,
        label: node.label,
        description: node.description,
        coverageStatus: (node.coverage_status as CoverageStatus) || 'not_discussed',
        type: node.type,
      }))

      setNodes(topicNodes)
    } catch (err) {
      console.error('Error fetching coverage data:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch coverage data')
    } finally {
      setIsLoading(false)
    }
  }, [supabase, campaignId])

  // Initial fetch
  useEffect(() => {
    fetchCoverageData()
  }, [fetchCoverageData])

  // Calculate stats
  const stats = useMemo(() => {
    const covered = nodes.filter(n => n.coverageStatus === 'covered').length
    const mentioned = nodes.filter(n => n.coverageStatus === 'mentioned').length
    const notDiscussed = nodes.filter(n => n.coverageStatus === 'not_discussed').length
    const total = nodes.length

    return {
      coveredCount: covered,
      mentionedCount: mentioned,
      notDiscussedCount: notDiscussed,
      totalCount: total,
      // Coverage percentage is based only on fully covered topics
      coveragePercentage: total > 0 ? Math.round((covered / total) * 100) : 0,
    }
  }, [nodes])

  return {
    nodes,
    isLoading,
    error,
    ...stats,
    refresh: fetchCoverageData,
  }
}

/**
 * Simplified hook that just returns coverage stats without full node data.
 * More efficient for display-only use cases.
 */
export function useKnowledgeCoverageStats(campaignId: string) {
  const [stats, setStats] = useState({
    coveredCount: 0,
    mentionedCount: 0,
    notDiscussedCount: 0,
    totalCount: 0,
    coveragePercentage: 0,
  })
  const [isLoading, setIsLoading] = useState(true)

  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    if (!campaignId) {
      setIsLoading(false)
      return
    }

    const fetchStats = async () => {
      setIsLoading(true)

      try {
        const { data, error } = await supabase
          .from('graph_nodes')
          .select('coverage_status')
          .eq('campaign_id', campaignId)
          .is('deleted_at', null)

        if (error) throw error

        const nodes = data || []
        const covered = nodes.filter(n => n.coverage_status === 'covered').length
        const mentioned = nodes.filter(n => n.coverage_status === 'mentioned').length
        const notDiscussed = nodes.filter(n => n.coverage_status === 'not_discussed' || !n.coverage_status).length
        const total = nodes.length

        setStats({
          coveredCount: covered,
          mentionedCount: mentioned,
          notDiscussedCount: notDiscussed,
          totalCount: total,
          coveragePercentage: total > 0 ? Math.round((covered / total) * 100) : 0,
        })
      } catch (err) {
        console.error('Error fetching coverage stats:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchStats()
  }, [supabase, campaignId])

  return { ...stats, isLoading }
}
