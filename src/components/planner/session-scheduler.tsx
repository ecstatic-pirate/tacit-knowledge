'use client'

import { useState, useCallback, useEffect, useMemo } from 'react'
import {
  Calendar,
  Clock,
  VideoCamera,
  Plus,
  Trash,
  ArrowClockwise,
  CheckCircle,
  WarningCircle,
  CircleNotch,
  LinkSimple,
  Play,
} from 'phosphor-react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useCalendar } from '@/lib/hooks/use-calendar'
import { createClient } from '@/lib/supabase/client'

interface Participant {
  id: string
  name: string
  email: string | null
  role: string | null
}

interface SessionSchedulerProps {
  campaignId: string
  campaignType: 'person' | 'project'
  expertName: string
  expertEmail?: string
  participants?: Participant[]
  onSessionCreated?: () => void
}

interface ScheduledSession {
  id: string
  sessionNumber: number
  scheduledAt: string
  durationMinutes: number
  status: string
  topics: string[]
  calendarEventId?: string
  calendarProvider?: string
  participantId?: string
  participantName?: string
}

export function SessionScheduler({
  campaignId,
  campaignType,
  expertName,
  expertEmail,
  participants = [],
  onSessionCreated,
}: SessionSchedulerProps) {
  const router = useRouter()
  const [sessions, setSessions] = useState<ScheduledSession[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [newSession, setNewSession] = useState({
    date: '',
    time: '09:00',
    duration: 60,
    topics: '',
    createCalendarEvent: true,
    participantId: '',
  })
  const [error, setError] = useState<string | null>(null)

  const {
    connection,
    isConnected,
    isConnecting,
    connectMicrosoft,
    createEvent,
    deleteEvent,
    error: calendarError,
  } = useCalendar()

  const supabase = useMemo(() => createClient(), [])

  // Fetch existing sessions
  const fetchSessions = useCallback(async () => {
    setIsLoading(true)
    const { data, error: fetchError } = await supabase
      .from('sessions')
      .select('*')
      .eq('campaign_id', campaignId)
      .is('deleted_at', null)
      .order('session_number', { ascending: true })

    if (fetchError) {
      setError(fetchError.message)
    } else {
      setSessions(
        (data || []).map((s) => {
          // Look up participant name from props
          const participant = s.participant_id
            ? participants.find(p => p.id === s.participant_id)
            : undefined
          return {
            id: s.id,
            sessionNumber: s.session_number,
            scheduledAt: s.scheduled_at || '',
            durationMinutes: s.duration_minutes || 60,
            status: s.status || 'scheduled',
            topics: s.topics || [],
            calendarEventId: s.calendar_event_id || undefined,
            calendarProvider: s.calendar_provider || undefined,
            participantId: s.participant_id || undefined,
            participantName: participant?.name,
          }
        })
      )
    }
    setIsLoading(false)
  }, [supabase, campaignId, participants])

  useEffect(() => {
    fetchSessions()
  }, [fetchSessions])

  // Get next session number
  const nextSessionNumber = sessions.length > 0
    ? Math.max(...sessions.map((s) => s.sessionNumber)) + 1
    : 1

  // Create a new session
  const handleCreateSession = async () => {
    if (!newSession.date || !newSession.time) {
      setError('Please select a date and time')
      return
    }

    setIsCreating(true)
    setError(null)

    try {
      const startDateTime = new Date(`${newSession.date}T${newSession.time}:00`)
      const endDateTime = new Date(startDateTime.getTime() + newSession.duration * 60000)

      // Get user ID
      const { data: { user } } = await supabase.auth.getUser()

      // Create session in database
      const { data: sessionData, error: createError } = await supabase
        .from('sessions')
        .insert({
          campaign_id: campaignId,
          session_number: nextSessionNumber,
          scheduled_at: startDateTime.toISOString(),
          duration_minutes: newSession.duration,
          status: 'scheduled',
          topics: newSession.topics ? newSession.topics.split(',').map((t) => t.trim()) : [],
          created_by: user?.id,
          participant_id: newSession.participantId || null,
        })
        .select()
        .single()

      if (createError) {
        throw new Error(createError.message)
      }

      // Get participant info for calendar event
      const selectedParticipant = participants.find(p => p.id === newSession.participantId)
      const sessionWithName = campaignType === 'project' && selectedParticipant
        ? selectedParticipant.name
        : expertName

      // Create calendar event if connected and requested
      if (isConnected && newSession.createCalendarEvent) {
        const eventResult = await createEvent(
          {
            title: `Knowledge Capture: ${sessionWithName} - Session ${nextSessionNumber}`,
            startTime: startDateTime.toISOString(),
            endTime: endDateTime.toISOString(),
            description: `<p>Knowledge capture session with <strong>${expertName}</strong></p>
              ${newSession.topics ? `<p>Topics: ${newSession.topics}</p>` : ''}
              <p>Part of the Tacit Knowledge capture campaign.</p>`,
            attendeeEmail: expertEmail,
            isOnlineMeeting: true,
          },
          sessionData.id
        )

        if (eventResult) {
          // Update session with meeting URL if available
          if (eventResult.onlineMeetingUrl) {
            await supabase
              .from('sessions')
              .update({ recording_url: eventResult.onlineMeetingUrl })
              .eq('id', sessionData.id)
          }
        }
      }

      // Reset form
      setNewSession({
        date: '',
        time: '09:00',
        duration: 60,
        topics: '',
        createCalendarEvent: true,
        participantId: '',
      })

      // Refresh sessions
      await fetchSessions()
      onSessionCreated?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create session')
    } finally {
      setIsCreating(false)
    }
  }

  // Delete a session
  const handleDeleteSession = async (session: ScheduledSession) => {
    if (!confirm('Are you sure you want to delete this session?')) return

    try {
      // Delete calendar event if exists
      if (session.calendarEventId && isConnected) {
        await deleteEvent(session.id)
      }

      // Soft delete the session
      await supabase
        .from('sessions')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', session.id)

      await fetchSessions()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete session')
    }
  }

  // Format date for display
  const formatDateTime = (isoString: string) => {
    const date = new Date(isoString)
    return {
      date: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
      time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-neutral-200/80 shadow-sm">
      {/* Header */}
      <div className="p-6 border-b border-neutral-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary">
              <Calendar className="w-5 h-5 text-primary-foreground" weight="bold" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-neutral-900">Session Scheduler</h3>
              <p className="text-xs text-neutral-500">
                Schedule knowledge capture sessions
              </p>
            </div>
          </div>

          {/* Calendar connection status */}
          {isConnected ? (
            <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 px-3 py-1.5 rounded-full">
              <CheckCircle className="w-4 h-4" weight="bold" />
              <span>Outlook connected</span>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={connectMicrosoft}
              disabled={isConnecting}
            >
              {isConnecting ? (
                <CircleNotch className="w-4 h-4 mr-2 animate-spin" weight="bold" />
              ) : (
                <LinkSimple className="w-4 h-4 mr-2" weight="bold" />
              )}
              Connect Outlook
            </Button>
          )}
        </div>
      </div>

      {/* Error display */}
      {(error || calendarError) && (
        <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
          <WarningCircle className="w-4 h-4" weight="bold" />
          {error || calendarError}
        </div>
      )}

      {/* New session form */}
      <div className="p-6 border-b border-neutral-100 bg-neutral-50/50">
        <h4 className="font-semibold text-neutral-800 mb-4 flex items-center gap-2">
          <Plus className="w-4 h-4" weight="bold" />
          Schedule Session {nextSessionNumber}
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {campaignType === 'project' && participants.length > 0 && (
            <div className="lg:col-span-4 md:col-span-2">
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Participant
              </label>
              <select
                value={newSession.participantId}
                onChange={(e) => setNewSession({ ...newSession, participantId: e.target.value })}
                className="w-full h-10 px-3 rounded-lg border border-neutral-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                <option value="">Select a participant...</option>
                {participants.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}{p.role ? ` (${p.role})` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Date
            </label>
            <Input
              type="date"
              value={newSession.date}
              onChange={(e) => setNewSession({ ...newSession, date: e.target.value })}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Time
            </label>
            <Input
              type="time"
              value={newSession.time}
              onChange={(e) => setNewSession({ ...newSession, time: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Duration (mins)
            </label>
            <select
              value={newSession.duration}
              onChange={(e) => setNewSession({ ...newSession, duration: parseInt(e.target.value) })}
              className="w-full h-10 px-3 rounded-lg border border-neutral-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
              <option value={30}>30 minutes</option>
              <option value={45}>45 minutes</option>
              <option value={60}>60 minutes</option>
              <option value={90}>90 minutes</option>
              <option value={120}>2 hours</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Topics (comma-separated)
            </label>
            <Input
              type="text"
              placeholder="e.g., Billing, Reconciliation"
              value={newSession.topics}
              onChange={(e) => setNewSession({ ...newSession, topics: e.target.value })}
            />
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          {isConnected && (
            <label className="flex items-center gap-2 text-sm text-neutral-600">
              <input
                type="checkbox"
                checked={newSession.createCalendarEvent}
                onChange={(e) =>
                  setNewSession({ ...newSession, createCalendarEvent: e.target.checked })
                }
                className="rounded border-neutral-300"
              />
              <VideoCamera className="w-4 h-4" weight="bold" />
              Create Teams meeting
            </label>
          )}

          <Button onClick={handleCreateSession} disabled={isCreating}>
            {isCreating ? (
              <>
                <CircleNotch className="w-4 h-4 mr-2 animate-spin" weight="bold" />
                Creating...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" weight="bold" />
                Schedule Session
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Sessions list */}
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-semibold text-neutral-800">
            Scheduled Sessions ({sessions.length})
          </h4>
          <button
            onClick={fetchSessions}
            className="text-neutral-500 hover:text-neutral-700 p-1"
          >
            <ArrowClockwise className="w-4 h-4" weight="bold" />
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8 text-neutral-500">
            <CircleNotch className="w-5 h-5 animate-spin mr-2" weight="bold" />
            Loading sessions...
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-8 text-neutral-500">
            No sessions scheduled yet. Create your first session above.
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map((session) => {
              const { date, time } = session.scheduledAt
                ? formatDateTime(session.scheduledAt)
                : { date: 'Not scheduled', time: '' }

              return (
                <div
                  key={session.id}
                  className={cn(
                    'flex items-center gap-4 p-4 rounded-xl border transition-all',
                    session.status === 'completed'
                      ? 'bg-green-50 border-green-200'
                      : 'bg-white border-neutral-200 hover:border-neutral-300'
                  )}
                >
                  <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-bold">
                    {session.sessionNumber}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-neutral-900">
                      Session {session.sessionNumber}
                      {session.participantName && (
                        <span className="font-normal text-neutral-600"> with {session.participantName}</span>
                      )}
                    </div>
                    <div className="text-sm text-neutral-500 flex items-center gap-3 mt-0.5">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" weight="bold" />
                        {date}
                      </span>
                      {time && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" weight="bold" />
                          {time}
                        </span>
                      )}
                      {session.calendarEventId && (
                        <span className="flex items-center gap-1 text-blue-600">
                          <VideoCamera className="w-3.5 h-3.5" weight="bold" />
                          Teams
                        </span>
                      )}
                    </div>
                  </div>

                  {session.topics.length > 0 && (
                    <div className="hidden md:flex gap-1">
                      {session.topics.slice(0, 2).map((topic) => (
                        <span
                          key={topic}
                          className="px-2 py-0.5 bg-neutral-100 rounded text-xs text-neutral-600"
                        >
                          {topic}
                        </span>
                      ))}
                      {session.topics.length > 2 && (
                        <span className="px-2 py-0.5 bg-neutral-100 rounded text-xs text-neutral-500">
                          +{session.topics.length - 2}
                        </span>
                      )}
                    </div>
                  )}

                  <div
                    className={cn(
                      'px-2.5 py-1 rounded-full text-xs font-medium',
                      session.status === 'completed'
                        ? 'bg-green-100 text-green-700'
                        : session.status === 'in_progress'
                        ? 'bg-amber-100 text-amber-700'
                        : session.status === 'paused'
                        ? 'bg-orange-100 text-orange-700'
                        : 'bg-blue-100 text-blue-700'
                    )}
                  >
                    {session.status === 'in_progress' ? 'In Progress' : session.status === 'paused' ? 'Paused' : session.status}
                  </div>

                  {/* Start/Continue Capture Button */}
                  {(session.status === 'scheduled' || session.status === 'in_progress' || session.status === 'paused') && (
                    <Button
                      size="sm"
                      variant={session.status === 'in_progress' || session.status === 'paused' ? 'default' : 'outline'}
                      onClick={() => router.push(`/capture/${session.id}`)}
                      className="gap-1"
                    >
                      <Play className="w-3.5 h-3.5" weight="bold" />
                      {session.status === 'in_progress' ? 'Continue' : session.status === 'paused' ? 'Resume' : 'Start'}
                    </Button>
                  )}

                  {session.status === 'scheduled' && (
                    <button
                      onClick={() => handleDeleteSession(session)}
                      className="p-2 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash className="w-4 h-4" weight="bold" />
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
