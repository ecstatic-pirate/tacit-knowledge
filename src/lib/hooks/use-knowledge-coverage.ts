'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { CoverageLevel } from '@/lib/supabase/database.types'

export type CoverageStatus = 'covered' | 'mentioned' | 'not_discussed'

interface TopicNode {
  id: string
  label: string
  description: string | null
  coverageStatus: CoverageStatus
  type: string
}

// Enhanced topic type with knowledge links
export interface TopicWithCoverage {
  id: string
  name: string
  category: string | null
  captured: boolean
  capturedAt: string | null
  sessionId: string | null
  suggestedBy: string | null
  // Knowledge nodes that cover this topic
  coveringKnowledgeNodes: Array<{
    nodeId: string
    nodeLabel: string
    coverageLevel: CoverageLevel
    sessionId: string | null
  }>
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

// Extended interface for topic coverage with knowledge node links
export interface UseTopicCoverageReturn {
  topics: TopicWithCoverage[]
  isLoading: boolean
  error: string | null

  // Coverage stats
  capturedCount: number
  partialCount: number
  notCapturedCount: number
  totalCount: number
  coveragePercentage: number

  // Actions
  refresh: () => Promise<void>
  updateTopicCaptured: (topicId: string, captured: boolean) => Promise<void>
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

/**
 * Hook to manage topic coverage with knowledge node links.
 * Uses the topics table and knowledge_topic_coverage junction table.
 */
export function useTopicCoverage(campaignId: string): UseTopicCoverageReturn {
  const [topics, setTopics] = useState<TopicWithCoverage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = useMemo(() => createClient(), [])

  const fetchTopics = useCallback(async () => {
    if (!campaignId) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Fetch topics with their coverage links
      const { data: topicsData, error: topicsError } = await supabase
        .from('topics')
        .select(`
          id,
          name,
          category,
          captured,
          captured_at,
          session_id,
          suggested_by
        `)
        .eq('campaign_id', campaignId)
        .is('deleted_at', null)
        .order('name', { ascending: true })

      if (topicsError) throw topicsError

      // Fetch coverage links for these topics
      const topicIds = (topicsData || []).map(t => t.id)

      let coverageData: Array<{
        topic_id: string
        coverage_level: string | null
        session_id: string | null
        graph_nodes: { id: string; label: string } | null
      }> = []

      if (topicIds.length > 0) {
        const { data: coverage, error: coverageError } = await supabase
          .from('knowledge_topic_coverage')
          .select(`
            topic_id,
            coverage_level,
            session_id,
            graph_nodes:knowledge_node_id (
              id,
              label
            )
          `)
          .in('topic_id', topicIds)

        if (coverageError) {
          console.warn('Could not fetch coverage links:', coverageError)
        } else {
          coverageData = coverage || []
        }
      }

      // Map topics with their coverage info
      const topicsWithCoverage: TopicWithCoverage[] = (topicsData || []).map(topic => {
        const coverageLinks = coverageData.filter(c => c.topic_id === topic.id)

        return {
          id: topic.id,
          name: topic.name,
          category: topic.category,
          captured: topic.captured || false,
          capturedAt: topic.captured_at,
          sessionId: topic.session_id,
          suggestedBy: topic.suggested_by,
          coveringKnowledgeNodes: coverageLinks
            .filter(c => c.graph_nodes)
            .map(c => ({
              nodeId: c.graph_nodes!.id,
              nodeLabel: c.graph_nodes!.label,
              coverageLevel: (c.coverage_level || 'mentioned') as CoverageLevel,
              sessionId: c.session_id,
            })),
        }
      })

      setTopics(topicsWithCoverage)
    } catch (err) {
      console.error('Error fetching topic coverage:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch topics')
    } finally {
      setIsLoading(false)
    }
  }, [supabase, campaignId])

  // Update topic captured status
  const updateTopicCaptured = useCallback(async (topicId: string, captured: boolean) => {
    // Optimistic update
    setTopics(prev => prev.map(t =>
      t.id === topicId
        ? { ...t, captured, capturedAt: captured ? new Date().toISOString() : null }
        : t
    ))

    const { error } = await supabase
      .from('topics')
      .update({
        captured,
        captured_at: captured ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', topicId)

    if (error) {
      console.error('Error updating topic:', error)
      // Revert on error
      await fetchTopics()
    }
  }, [supabase, fetchTopics])

  // Initial fetch
  useEffect(() => {
    fetchTopics()
  }, [fetchTopics])

  // Calculate stats
  const stats = useMemo(() => {
    const captured = topics.filter(t => t.captured).length
    const partial = topics.filter(t => !t.captured && t.coveringKnowledgeNodes.length > 0).length
    const notCaptured = topics.filter(t => !t.captured && t.coveringKnowledgeNodes.length === 0).length
    const total = topics.length

    return {
      capturedCount: captured,
      partialCount: partial,
      notCapturedCount: notCaptured,
      totalCount: total,
      coveragePercentage: total > 0 ? Math.round((captured / total) * 100) : 0,
    }
  }, [topics])

  return {
    topics,
    isLoading,
    error,
    ...stats,
    refresh: fetchTopics,
    updateTopicCaptured,
  }
}
