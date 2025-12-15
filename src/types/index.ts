// Re-export app-level types from context for backward compatibility
export type { Campaign, Task, AppUser } from '@/context/app-context'

// Additional UI types
export type CampaignStatus = 'on-track' | 'keep-track' | 'danger'

export interface Skill {
  id: string
  name: string
  category: string
  captured: boolean
  confidence?: number
  source?: 'manual' | 'ai_detected'
}

export interface Session {
  id: string
  campaignId: string
  sessionNumber: number
  scheduledAt?: string
  startedAt?: string
  endedAt?: string
  durationMinutes?: number
  topics: string[]
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
  notes?: string
}

export interface Report {
  id: string
  title: string
  type: 'summary' | 'skills' | 'transcript' | 'graph' | 'export'
  status: 'processing' | 'ready' | 'failed'
  campaignId?: string
  sessionId?: string
  preview?: string
  fileUrl?: string
  createdAt?: string
}

export interface GraphNode {
  id: string
  campaignId: string
  label: string
  type: 'core' | 'skill' | 'concept' | 'system' | 'process'
  description?: string
  positionX?: number
  positionY?: number
}

export interface GraphEdge {
  id: string
  campaignId: string
  sourceNodeId: string
  targetNodeId: string
  relationship: 'requires' | 'enables' | 'related_to' | 'part_of'
  weight?: number
}

export interface Document {
  id: string
  campaignId?: string
  filename: string
  fileType?: string
  fileSize?: number
  storagePath: string
  aiProcessed: boolean
  extractedSkills?: unknown[]
}

export type TabName = 'dashboard' | 'prepare' | 'capture' | 'planner' | 'reports'

// Re-export database types for direct database access
export type * from '@/lib/supabase/database.types'
