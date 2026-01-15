'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { RealtimeChannel } from '@supabase/supabase-js'

export type CoverageStatus = 'not_discussed' | 'mentioned' | 'covered'

export interface LiveGraphNode {
  id: string
  label: string
  type: 'core' | 'topic' | 'concept' | 'system' | 'process'
  description: string | null
  coverageStatus: CoverageStatus
  sessionId: string | null
  metadata: Record<string, unknown> | null
}

export interface UseLiveGraphOptions {
  campaignId: string
  /** Called when a node is updated */
  onNodeUpdate?: (node: LiveGraphNode) => void
  /** Called when a new node is created */
  onNodeCreated?: (node: LiveGraphNode) => void
}

export interface UseLiveGraphReturn {
  nodes: LiveGraphNode[]
  isLoading: boolean
  error: string | null
  // Stats
  coveredCount: number
  mentionedCount: number
  notDiscussedCount: number
  coveragePercentage: number
  // Actions
  refresh: () => Promise<void>
}

export function useLiveGraph(options: UseLiveGraphOptions): UseLiveGraphReturn {
  const { campaignId, onNodeUpdate, onNodeCreated } = options

  const [nodes, setNodes] = useState<LiveGraphNode[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = useMemo(() => createClient(), [])

  // Transform database row to LiveGraphNode
  const transformNode = useCallback((row: Record<string, unknown>): LiveGraphNode => ({
    id: row.id as string,
    label: row.label as string,
    type: (row.type as LiveGraphNode['type']) || 'concept',
    description: row.description as string | null,
    coverageStatus: (row.coverage_status as CoverageStatus) || 'not_discussed',
    sessionId: row.session_id as string | null,
    metadata: row.metadata as Record<string, unknown> | null,
  }), [])

  // Fetch all nodes for the campaign
  const fetchNodes = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const { data, error: fetchError } = await supabase
        .from('graph_nodes')
        .select('*')
        .eq('campaign_id', campaignId)
        .is('deleted_at', null)
        .order('created_at', { ascending: true })

      if (fetchError) throw fetchError

      setNodes((data || []).map(transformNode))
    } catch (err) {
      console.error('Error fetching graph nodes:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch nodes')
    } finally {
      setIsLoading(false)
    }
  }, [supabase, campaignId, transformNode])

  // Set up Supabase Realtime subscription
  useEffect(() => {
    if (!campaignId) return

    // Initial fetch
    fetchNodes()

    // Subscribe to changes
    const channel: RealtimeChannel = supabase
      .channel(`graph-nodes-${campaignId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'graph_nodes',
          filter: `campaign_id=eq.${campaignId}`,
        },
        (payload) => {
          const newNode = transformNode(payload.new)
          setNodes(prev => [...prev, newNode])
          onNodeCreated?.(newNode)
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'graph_nodes',
          filter: `campaign_id=eq.${campaignId}`,
        },
        (payload) => {
          const updatedNode = transformNode(payload.new)
          setNodes(prev =>
            prev.map(n => n.id === updatedNode.id ? updatedNode : n)
          )
          onNodeUpdate?.(updatedNode)
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'graph_nodes',
          filter: `campaign_id=eq.${campaignId}`,
        },
        (payload) => {
          const deletedId = (payload.old as { id: string }).id
          setNodes(prev => prev.filter(n => n.id !== deletedId))
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, campaignId, fetchNodes, transformNode, onNodeUpdate, onNodeCreated])

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
      coveragePercentage: total > 0 ? Math.round((covered / total) * 100) : 0,
    }
  }, [nodes])

  return {
    nodes,
    isLoading,
    error,
    ...stats,
    refresh: fetchNodes,
  }
}
