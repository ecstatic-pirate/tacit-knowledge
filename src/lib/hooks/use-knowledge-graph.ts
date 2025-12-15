'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { GraphNode, GraphEdge } from '@/lib/supabase/database.types'

export interface KnowledgeNode {
  id: string
  x: number
  y: number
  label: string
  type: 'core' | 'skill' | 'concept' | 'system' | 'process'
  description?: string
  connections: string[]
  skillId?: string
  sessionId?: string
  campaignId: string
}

export interface KnowledgeEdge {
  id: string
  source: string
  target: string
  relationship: string
  weight: number
}

export interface UseKnowledgeGraphReturn {
  nodes: KnowledgeNode[]
  edges: KnowledgeEdge[]
  isLoading: boolean
  error: string | null
  updateNodePosition: (nodeId: string, x: number, y: number) => Promise<void>
  refresh: () => Promise<void>
}

// Generate initial position for nodes without saved positions
function generatePosition(index: number, total: number, centerX: number, centerY: number): { x: number; y: number } {
  const radius = Math.min(250, 50 + total * 20)
  const angle = (2 * Math.PI * index) / total
  return {
    x: centerX + radius * Math.cos(angle) + (Math.random() - 0.5) * 50,
    y: centerY + radius * Math.sin(angle) + (Math.random() - 0.5) * 50,
  }
}

export function useKnowledgeGraph(campaignId?: string): UseKnowledgeGraphReturn {
  const [nodes, setNodes] = useState<KnowledgeNode[]>([])
  const [edges, setEdges] = useState<KnowledgeEdge[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  const fetchGraph = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Build query for nodes
      let nodesQuery = supabase
        .from('graph_nodes')
        .select('*')
        .is('deleted_at', null)
        .order('created_at', { ascending: true })

      // Filter by campaign if specified
      if (campaignId) {
        nodesQuery = nodesQuery.eq('campaign_id', campaignId)
      }

      const { data: nodesData, error: nodesError } = await nodesQuery

      if (nodesError) throw nodesError

      // Build query for edges
      let edgesQuery = supabase
        .from('graph_edges')
        .select('*')
        .is('deleted_at', null)

      if (campaignId) {
        edgesQuery = edgesQuery.eq('campaign_id', campaignId)
      }

      const { data: edgesData, error: edgesError } = await edgesQuery

      if (edgesError) throw edgesError

      // Transform DB nodes to app nodes
      const centerX = 400
      const centerY = 300
      const totalNodes = nodesData?.length || 0

      const transformedNodes: KnowledgeNode[] = (nodesData || []).map((node: GraphNode, index: number) => {
        // Use saved position or generate one
        const position = (node.position_x !== null && node.position_y !== null)
          ? { x: node.position_x, y: node.position_y }
          : generatePosition(index, totalNodes, centerX, centerY)

        // Find connections from edges
        const connections = (edgesData || [])
          .filter((edge: GraphEdge) => edge.source_node_id === node.id || edge.target_node_id === node.id)
          .map((edge: GraphEdge) => edge.source_node_id === node.id ? edge.target_node_id : edge.source_node_id)

        return {
          id: node.id,
          x: position.x,
          y: position.y,
          label: node.label,
          type: (node.type as KnowledgeNode['type']) || 'concept',
          description: node.description || undefined,
          connections,
          skillId: node.skill_id || undefined,
          sessionId: node.session_id || undefined,
          campaignId: node.campaign_id,
        }
      })

      // Transform DB edges to app edges
      const transformedEdges: KnowledgeEdge[] = (edgesData || []).map((edge: GraphEdge) => ({
        id: edge.id,
        source: edge.source_node_id,
        target: edge.target_node_id,
        relationship: edge.relationship,
        weight: edge.weight || 1,
      }))

      setNodes(transformedNodes)
      setEdges(transformedEdges)
    } catch (err) {
      console.error('Error fetching knowledge graph:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch graph')
    } finally {
      setIsLoading(false)
    }
  }, [supabase, campaignId])

  // Update node position in database
  const updateNodePosition = useCallback(async (nodeId: string, x: number, y: number) => {
    // Optimistic update
    setNodes((prev) =>
      prev.map((n) => (n.id === nodeId ? { ...n, x, y } : n))
    )

    const { error } = await supabase
      .from('graph_nodes')
      .update({
        position_x: x,
        position_y: y,
        updated_at: new Date().toISOString(),
      })
      .eq('id', nodeId)

    if (error) {
      console.error('Error saving node position:', error)
      // Don't revert - the position is still valid locally
    }
  }, [supabase])

  const refresh = useCallback(async () => {
    await fetchGraph()
  }, [fetchGraph])

  useEffect(() => {
    fetchGraph()
  }, [fetchGraph])

  return {
    nodes,
    edges,
    isLoading,
    error,
    updateNodePosition,
    refresh,
  }
}
