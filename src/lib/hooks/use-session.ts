'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Session as DBSession, Campaign, Skill } from '@/lib/supabase/database.types'

export type SessionStatus = 'scheduled' | 'in_progress' | 'paused' | 'completed' | 'cancelled'

export interface SessionData {
  id: string
  campaignId: string
  sessionNumber: number
  status: SessionStatus
  scheduledAt: string | null
  startedAt: string | null
  endedAt: string | null
  durationMinutes: number
  notes: string
  topics: string[]
  recordingUrl: string | null
  transcriptUrl: string | null
  // Related data
  campaign: {
    expertName: string
    expertRole: string
    goal: string | null
  } | null
  skills: {
    id: string
    name: string
    captured: boolean
    confidence: number
  }[]
}

export interface UseSessionReturn {
  session: SessionData | null
  isLoading: boolean
  error: string | null
  // Session actions
  startSession: () => Promise<void>
  pauseSession: () => Promise<void>
  resumeSession: () => Promise<void>
  endSession: () => Promise<void>
  // Data actions
  updateNotes: (notes: string) => Promise<void>
  addTopic: (topic: string) => Promise<void>
  markSkillCaptured: (skillId: string) => Promise<void>
  refresh: () => Promise<void>
}

export function useSession(sessionId: string | null): UseSessionReturn {
  const [session, setSession] = useState<SessionData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const notesDebounceRef = useRef<NodeJS.Timeout | null>(null)

  const supabase = createClient()

  // Fetch session data with related campaign and skills
  const fetchSession = useCallback(async () => {
    if (!sessionId) {
      setSession(null)
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Fetch session with campaign
      const { data: sessionData, error: sessionError } = await supabase
        .from('sessions')
        .select(`
          *,
          campaigns (
            expert_name,
            expert_role,
            goal
          )
        `)
        .eq('id', sessionId)
        .single()

      if (sessionError) throw sessionError

      // Fetch skills for this campaign
      const { data: skillsData } = await supabase
        .from('skills')
        .select('id, name, captured, confidence')
        .eq('campaign_id', sessionData.campaign_id)
        .is('deleted_at', null)
        .order('name')

      const campaign = sessionData.campaigns as { expert_name: string; expert_role: string; goal: string | null } | null

      setSession({
        id: sessionData.id,
        campaignId: sessionData.campaign_id,
        sessionNumber: sessionData.session_number,
        status: (sessionData.status as SessionStatus) || 'scheduled',
        scheduledAt: sessionData.scheduled_at,
        startedAt: sessionData.started_at,
        endedAt: sessionData.ended_at,
        durationMinutes: sessionData.duration_minutes || 0,
        notes: sessionData.notes || '',
        topics: sessionData.topics || [],
        recordingUrl: sessionData.recording_url,
        transcriptUrl: sessionData.transcript_url,
        campaign: campaign ? {
          expertName: campaign.expert_name,
          expertRole: campaign.expert_role,
          goal: campaign.goal,
        } : null,
        skills: (skillsData || []).map(s => ({
          id: s.id,
          name: s.name,
          captured: s.captured || false,
          confidence: s.confidence || 0,
        })),
      })
    } catch (err) {
      console.error('Error fetching session:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch session')
    } finally {
      setIsLoading(false)
    }
  }, [sessionId, supabase])

  // Start session
  const startSession = useCallback(async () => {
    if (!sessionId || !session) return

    const now = new Date().toISOString()

    // Optimistic update
    setSession(prev => prev ? { ...prev, status: 'in_progress', startedAt: now } : null)

    const { error } = await supabase
      .from('sessions')
      .update({
        status: 'in_progress',
        started_at: now,
        updated_at: now,
      })
      .eq('id', sessionId)

    if (error) {
      console.error('Error starting session:', error)
      fetchSession() // Revert on error
    }
  }, [sessionId, session, supabase, fetchSession])

  // Pause session
  const pauseSession = useCallback(async () => {
    if (!sessionId || !session) return

    setSession(prev => prev ? { ...prev, status: 'paused' } : null)

    const { error } = await supabase
      .from('sessions')
      .update({
        status: 'paused',
        updated_at: new Date().toISOString(),
      })
      .eq('id', sessionId)

    if (error) {
      console.error('Error pausing session:', error)
      fetchSession()
    }
  }, [sessionId, session, supabase, fetchSession])

  // Resume session
  const resumeSession = useCallback(async () => {
    if (!sessionId || !session) return

    setSession(prev => prev ? { ...prev, status: 'in_progress' } : null)

    const { error } = await supabase
      .from('sessions')
      .update({
        status: 'in_progress',
        updated_at: new Date().toISOString(),
      })
      .eq('id', sessionId)

    if (error) {
      console.error('Error resuming session:', error)
      fetchSession()
    }
  }, [sessionId, session, supabase, fetchSession])

  // End session
  const endSession = useCallback(async () => {
    if (!sessionId || !session) return

    const now = new Date()
    const startTime = session.startedAt ? new Date(session.startedAt) : now
    const durationMinutes = Math.round((now.getTime() - startTime.getTime()) / 60000)

    setSession(prev => prev ? {
      ...prev,
      status: 'completed',
      endedAt: now.toISOString(),
      durationMinutes,
    } : null)

    const { error } = await supabase
      .from('sessions')
      .update({
        status: 'completed',
        ended_at: now.toISOString(),
        duration_minutes: durationMinutes,
        updated_at: now.toISOString(),
      })
      .eq('id', sessionId)

    if (error) {
      console.error('Error ending session:', error)
      fetchSession()
    }

    // Update campaign completed sessions count
    if (session.campaignId) {
      const { data: campaignData } = await supabase
        .from('campaigns')
        .select('completed_sessions')
        .eq('id', session.campaignId)
        .single()

      if (campaignData) {
        await supabase
          .from('campaigns')
          .update({
            completed_sessions: (campaignData.completed_sessions || 0) + 1,
            updated_at: now.toISOString(),
          })
          .eq('id', session.campaignId)
      }
    }
  }, [sessionId, session, supabase, fetchSession])

  // Update notes (debounced)
  const updateNotes = useCallback(async (notes: string) => {
    if (!sessionId) return

    // Optimistic update
    setSession(prev => prev ? { ...prev, notes } : null)

    // Debounce the save
    if (notesDebounceRef.current) {
      clearTimeout(notesDebounceRef.current)
    }

    notesDebounceRef.current = setTimeout(async () => {
      const { error } = await supabase
        .from('sessions')
        .update({
          notes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', sessionId)

      if (error) {
        console.error('Error saving notes:', error)
      }
    }, 1000) // Save after 1 second of no typing
  }, [sessionId, supabase])

  // Add topic
  const addTopic = useCallback(async (topic: string) => {
    if (!sessionId || !session) return

    const newTopics = [...session.topics, topic]
    setSession(prev => prev ? { ...prev, topics: newTopics } : null)

    const { error } = await supabase
      .from('sessions')
      .update({
        topics: newTopics,
        updated_at: new Date().toISOString(),
      })
      .eq('id', sessionId)

    if (error) {
      console.error('Error adding topic:', error)
      fetchSession()
    }
  }, [sessionId, session, supabase, fetchSession])

  // Mark skill as captured
  const markSkillCaptured = useCallback(async (skillId: string) => {
    if (!session) return

    // Optimistic update
    setSession(prev => prev ? {
      ...prev,
      skills: prev.skills.map(s =>
        s.id === skillId ? { ...s, captured: true } : s
      ),
    } : null)

    const { error } = await supabase
      .from('skills')
      .update({
        captured: true,
        captured_at: new Date().toISOString(),
        session_id: sessionId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', skillId)

    if (error) {
      console.error('Error marking skill captured:', error)
      fetchSession()
    }
  }, [session, sessionId, supabase, fetchSession])

  // Initial fetch
  useEffect(() => {
    fetchSession()
  }, [fetchSession])

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (notesDebounceRef.current) {
        clearTimeout(notesDebounceRef.current)
      }
    }
  }, [])

  return {
    session,
    isLoading,
    error,
    startSession,
    pauseSession,
    resumeSession,
    endSession,
    updateNotes,
    addTopic,
    markSkillCaptured,
    refresh: fetchSession,
  }
}
