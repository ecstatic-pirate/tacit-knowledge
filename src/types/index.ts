// Re-export app-level types from context for backward compatibility
export type {
  Campaign,
  Task,
  AppUser,
  CampaignSubjectType,
  ProjectType,
  CaptureSchedule,
  CaptureCadence,
  InterviewFormat,
  SuggestedDomain,
  FocusArea,
  Collaborator,
} from '@/context/app-context'

// Additional UI types
export type CampaignStatus = 'on-track' | 'keep-track' | 'danger'

export interface Topic {
  id: string
  name: string
  category: string
  captured: boolean
  confidence?: number
  source?: 'manual' | 'ai_detected'
  suggestedBy?: 'creator' | 'collaborator' | 'ai' | 'expert' | string
}

/** @deprecated Use Topic instead */
export type Skill = Topic

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
  type: 'summary' | 'topics' | 'transcript' | 'graph' | 'export'
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
  type: 'core' | 'topic' | 'concept' | 'system' | 'process'
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
  extractedTopics?: unknown[]
}

export type TabName = 'dashboard' | 'prepare' | 'capture' | 'planner' | 'reports'

// Campaign subject type is now re-exported from app-context
// Keeping the comment for documentation - valid values: 'person' | 'project'

// Concierge types for AI chat interface
export interface Conversation {
  id: string
  userId: string
  orgId: string
  title: string
  createdAt: string
  updatedAt: string
}

export interface Message {
  id: string
  conversationId: string
  role: 'user' | 'assistant'
  content: string
  sources?: MessageSource[]
  createdAt: string
}

export interface MessageSource {
  type: 'transcript' | 'insight' | 'graph_node' | 'document'
  id: string
  title: string
  excerpt: string
  relevanceScore: number
  metadata?: Record<string, unknown>
}

export interface SearchResult {
  id: string
  contentType: 'transcript' | 'insight' | 'graph_node' | 'document'
  contentId: string
  campaignId: string | null
  chunkText: string
  metadata: Record<string, unknown> | null
  similarity: number
}

// Re-export database types for direct database access
export type * from '@/lib/supabase/database.types'
