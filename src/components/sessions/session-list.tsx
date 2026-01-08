'use client'

import { useState, useCallback, useEffect, useMemo } from 'react'
import {
  Calendar,
  Trash,
  CircleNotch,
  Play,
  Copy,
  User,
  Users,
  CaretDown,
  CaretUp,
  Sparkle,
  ListBullets,
} from 'phosphor-react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useCalendar } from '@/lib/hooks/use-calendar'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/toast'

interface Session {
  id: string
  sessionNumber: number
  title?: string
  scheduledAt: string
  durationMinutes: number
  status: string
  topics: string[]
  aiSuggestedTopics?: Array<{
    topic: string
    description?: string
    questions?: string[]
  }>
  calendarEventId?: string
  calendarProvider?: string
  campaignId?: string
  campaignName?: string
  expertName?: string
}

interface SessionListProps {
  campaignId?: string
  sessions?: Session[]
  showCampaignInfo?: boolean
  showLinks?: boolean
  onSessionDeleted?: () => void
  emptyMessage?: string
}

export function SessionList({
  campaignId,
  sessions: propSessions,
  showCampaignInfo = false,
  showLinks = false,
  onSessionDeleted,
  emptyMessage = 'No sessions scheduled yet.',
}: SessionListProps) {
  const router = useRouter()
  const { showToast } = useToast()
  const [sessions, setSessions] = useState<Session[]>(propSessions || [])
  const [isLoading, setIsLoading] = useState(!propSessions)
  const [expandedSessions, setExpandedSessions] = useState<Set<string>>(new Set())

  const { isConnected, deleteEvent } = useCalendar()
  const supabase = useMemo(() => createClient(), [])

  const toggleSession = (sessionId: string) => {
    setExpandedSessions(prev => {
      const next = new Set(prev)
      if (next.has(sessionId)) {
        next.delete(sessionId)
      } else {
        next.add(sessionId)
      }
      return next
    })
  }

  // Fetch sessions if not provided via props
  const fetchSessions = useCallback(async () => {
    if (propSessions) {
      setSessions(propSessions)
      return
    }

    setIsLoading(true)

    let query = supabase
      .from('sessions')
      .select(`
        *,
        campaigns!inner (
          id,
          expert_name,
          expert_role
        )
      `)
      .is('deleted_at', null)
      .order('scheduled_at', { ascending: true })

    if (campaignId) {
      query = query.eq('campaign_id', campaignId)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching sessions:', error)
    } else {
      setSessions(
        (data || []).map((s) => ({
          id: s.id,
          sessionNumber: s.session_number,
          title: s.title || undefined,
          scheduledAt: s.scheduled_at || '',
          durationMinutes: s.duration_minutes || 60,
          status: s.status || 'scheduled',
          topics: s.topics || [],
          aiSuggestedTopics: (s.ai_suggested_topics as Session['aiSuggestedTopics']) || [],
          calendarEventId: s.calendar_event_id || undefined,
          calendarProvider: s.calendar_provider || undefined,
          campaignId: s.campaign_id,
          campaignName: s.campaigns?.expert_name,
          expertName: s.campaigns?.expert_name,
        }))
      )
    }
    setIsLoading(false)
  }, [supabase, campaignId, propSessions])

  useEffect(() => {
    fetchSessions()
  }, [fetchSessions])

  // Update sessions when props change
  useEffect(() => {
    if (propSessions) {
      setSessions(propSessions)
    }
  }, [propSessions])

  const handleDeleteSession = async (session: Session) => {
    if (!confirm('Are you sure you want to delete this session?')) return

    try {
      if (session.calendarEventId && isConnected) {
        await deleteEvent(session.id)
      }

      await supabase
        .from('sessions')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', session.id)

      await fetchSessions()
      onSessionDeleted?.()
    } catch (err) {
      console.error('Error deleting session:', err)
    }
  }

  const copyLink = (sessionId: string, role: 'interviewer' | 'guest') => {
    const baseUrl = window.location.origin
    const url = `${baseUrl}/interview/${sessionId}/${role}`
    navigator.clipboard.writeText(url)
    showToast(`${role === 'interviewer' ? 'Interviewer' : 'Guest'} link copied! (Video room coming soon)`)
  }

  const formatDate = (isoString: string) => {
    if (!isoString) return 'Not scheduled'
    const date = new Date(isoString)
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  }

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-700'
      case 'in_progress':
        return 'bg-amber-100 text-amber-700'
      case 'paused':
        return 'bg-orange-100 text-orange-700'
      case 'cancelled':
        return 'bg-red-100 text-red-700'
      default:
        return 'bg-blue-100 text-blue-700'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'in_progress':
        return 'In Progress'
      case 'paused':
        return 'Paused'
      default:
        return status.charAt(0).toUpperCase() + status.slice(1)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8 text-neutral-500">
        <CircleNotch className="w-5 h-5 animate-spin mr-2" weight="bold" />
        Loading sessions...
      </div>
    )
  }

  if (sessions.length === 0) {
    return (
      <div className="text-center py-8 text-neutral-500">
        {emptyMessage}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {sessions.map((session) => {
        const isExpanded = expandedSessions.has(session.id)
        const hasAiTopics = session.aiSuggestedTopics && session.aiSuggestedTopics.length > 0

        return (
          <div
            key={session.id}
            className={cn(
              'rounded-xl border transition-all',
              session.status === 'completed'
                ? 'bg-green-50 border-green-200'
                : 'bg-white border-neutral-200 hover:border-neutral-300'
            )}
          >
            {/* Session header - clickable to expand */}
            <button
              onClick={() => toggleSession(session.id)}
              className="w-full p-4 flex items-center gap-4 text-left"
            >
              {/* Session number badge */}
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-bold flex-shrink-0">
                {session.sessionNumber}
              </div>

              {/* Session info */}
              <div className="flex-1 min-w-0">
                <div className="font-medium text-neutral-900">
                  {session.title || `Session ${session.sessionNumber}`}
                  {showCampaignInfo && session.expertName && (
                    <span className="text-neutral-500 font-normal"> · {session.expertName}</span>
                  )}
                </div>
                <div className="text-sm text-neutral-500 flex items-center gap-2 mt-0.5">
                  <Calendar className="w-3.5 h-3.5" weight="bold" />
                  {formatDate(session.scheduledAt)}
                </div>
              </div>

              {/* Status badge */}
              <div
                className={cn(
                  'px-2.5 py-1 rounded-full text-xs font-medium flex-shrink-0',
                  getStatusStyle(session.status)
                )}
              >
                {getStatusLabel(session.status)}
              </div>

              {/* Expand indicator */}
              <div className="text-neutral-400">
                {isExpanded ? (
                  <CaretUp className="w-5 h-5" weight="bold" />
                ) : (
                  <CaretDown className="w-5 h-5" weight="bold" />
                )}
              </div>
            </button>

            {/* Expanded content */}
            {isExpanded && (
              <div className="px-4 pb-4 border-t border-neutral-100">
                {/* AI Suggested Topics */}
                {hasAiTopics ? (
                  <div className="mt-4">
                    <div className="flex items-center gap-2 text-sm font-medium text-neutral-700 mb-3">
                      <Sparkle className="w-4 h-4 text-amber-500" weight="fill" />
                      Topics to Cover
                    </div>
                    <div className="space-y-3">
                      {session.aiSuggestedTopics!.map((topic, idx) => (
                        <div key={idx} className="p-3 bg-neutral-50 rounded-lg">
                          <div className="font-medium text-neutral-800">{topic.topic}</div>
                          {topic.description && (
                            <p className="text-sm text-neutral-600 mt-1">{topic.description}</p>
                          )}
                          {topic.questions && topic.questions.length > 0 && (
                            <div className="mt-2">
                              <div className="text-xs font-medium text-neutral-500 mb-1">Suggested questions:</div>
                              <ul className="text-sm text-neutral-600 space-y-1">
                                {topic.questions.map((q, qIdx) => (
                                  <li key={qIdx} className="flex items-start gap-2">
                                    <span className="text-neutral-400">•</span>
                                    {q}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 p-4 bg-neutral-50 rounded-lg text-center">
                    <ListBullets className="w-8 h-8 text-neutral-300 mx-auto mb-2" weight="bold" />
                    <p className="text-sm text-neutral-500">
                      Topics to cover will be auto-generated by AI based on campaign context.
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="mt-4 pt-4 border-t border-neutral-100 flex flex-wrap items-center gap-2">
                  {/* Start/Continue button */}
                  {(session.status === 'scheduled' || session.status === 'in_progress' || session.status === 'paused') && (
                    <Button
                      size="sm"
                      variant={session.status === 'in_progress' || session.status === 'paused' ? 'default' : 'outline'}
                      onClick={(e) => {
                        e.stopPropagation()
                        router.push(`/capture/${session.id}`)
                      }}
                      className="gap-1"
                    >
                      <Play className="w-3.5 h-3.5" weight="bold" />
                      {session.status === 'in_progress' ? 'Continue' : session.status === 'paused' ? 'Resume' : 'Start Capture'}
                    </Button>
                  )}

                  {/* Link copy buttons */}
                  {showLinks && session.status !== 'completed' && session.status !== 'cancelled' && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation()
                          copyLink(session.id, 'interviewer')
                        }}
                        className="gap-1"
                      >
                        <User className="w-3.5 h-3.5" weight="bold" />
                        <Copy className="w-3 h-3" weight="bold" />
                        Interviewer Link
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation()
                          copyLink(session.id, 'guest')
                        }}
                        className="gap-1"
                      >
                        <Users className="w-3.5 h-3.5" weight="bold" />
                        <Copy className="w-3 h-3" weight="bold" />
                        Guest Link
                      </Button>
                    </>
                  )}

                  {/* Delete button */}
                  {session.status === 'scheduled' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteSession(session)
                      }}
                      className="p-2 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors ml-auto"
                    >
                      <Trash className="w-4 h-4" weight="bold" />
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
