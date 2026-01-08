'use client'

import { useState, useCallback, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'

interface CalendarConnection {
  id: string
  provider: 'microsoft' | 'google'
  calendarEmail: string
  connectedAt: string
}

interface CalendarEvent {
  title: string
  startTime: string
  endTime: string
  description?: string
  attendeeEmail?: string
  isOnlineMeeting?: boolean
}

interface CreatedEvent {
  eventId: string
  webLink?: string
  onlineMeetingUrl?: string
}

export function useCalendar() {
  const [connection, setConnection] = useState<CalendarConnection | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = useMemo(() => createClient(), [])

  // Check for existing connection
  const checkConnection = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    const { data, error: fetchError } = await supabase
      .from('calendar_connections')
      .select('*')
      .eq('provider', 'microsoft')
      .maybeSingle()

    if (fetchError) {
      // Log the error for debugging but don't show to user for non-critical failures
      console.error('[useCalendar] Error checking connection:', fetchError.code, fetchError.message)
      // Only show error for unexpected failures
      if (fetchError.code !== 'PGRST116') {
        setError(fetchError.message)
      }
    }

    if (data) {
      setConnection({
        id: data.id,
        provider: data.provider as 'microsoft' | 'google',
        calendarEmail: data.calendar_email || '',
        connectedAt: data.created_at || '',
      })
    } else {
      setConnection(null)
    }

    setIsLoading(false)
  }, [supabase])

  useEffect(() => {
    checkConnection()
  }, [checkConnection])

  // Start OAuth flow
  const connectMicrosoft = useCallback(async () => {
    setIsConnecting(true)
    setError(null)

    try {
      const redirectUri = `${window.location.origin}/auth/calendar/callback`

      const { data, error: fnError } = await supabase.functions.invoke('calendar-sync', {
        body: {
          action: 'get_auth_url',
          redirectUri,
        },
      })

      if (fnError || !data?.success) {
        throw new Error(data?.error || fnError?.message || 'Failed to get auth URL')
      }

      // Store redirect URI for callback
      sessionStorage.setItem('calendar_redirect_uri', redirectUri)

      // Redirect to Microsoft OAuth
      window.location.href = data.authUrl
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connection failed')
      setIsConnecting(false)
    }
  }, [supabase])

  // Complete OAuth flow (called from callback page)
  const completeConnection = useCallback(async (code: string) => {
    setIsConnecting(true)
    setError(null)

    try {
      const redirectUri = sessionStorage.getItem('calendar_redirect_uri')
      if (!redirectUri) {
        throw new Error('Missing redirect URI')
      }

      const { data, error: fnError } = await supabase.functions.invoke('calendar-sync', {
        body: {
          action: 'exchange_code',
          code,
          redirectUri,
        },
      })

      if (fnError || !data?.success) {
        throw new Error(data?.error || fnError?.message || 'Failed to exchange code')
      }

      sessionStorage.removeItem('calendar_redirect_uri')
      await checkConnection()

      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connection failed')
      return false
    } finally {
      setIsConnecting(false)
    }
  }, [supabase, checkConnection])

  // Disconnect calendar
  const disconnect = useCallback(async () => {
    if (!connection) return

    const { error: deleteError } = await supabase
      .from('calendar_connections')
      .delete()
      .eq('id', connection.id)

    if (deleteError) {
      setError(deleteError.message)
      return
    }

    setConnection(null)
  }, [supabase, connection])

  // Create calendar event
  const createEvent = useCallback(async (
    event: CalendarEvent,
    sessionId?: string
  ): Promise<CreatedEvent | null> => {
    if (!connection) {
      setError('No calendar connected')
      return null
    }

    try {
      const { data, error: fnError } = await supabase.functions.invoke('calendar-sync', {
        body: {
          action: 'create',
          sessionId,
          eventData: event,
        },
      })

      if (fnError || !data?.success) {
        throw new Error(data?.error || fnError?.message || 'Failed to create event')
      }

      return {
        eventId: data.eventId,
        webLink: data.webLink,
        onlineMeetingUrl: data.onlineMeetingUrl,
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create event')
      return null
    }
  }, [supabase, connection])

  // Delete calendar event
  const deleteEvent = useCallback(async (sessionId: string): Promise<boolean> => {
    if (!connection) {
      setError('No calendar connected')
      return false
    }

    try {
      const { data, error: fnError } = await supabase.functions.invoke('calendar-sync', {
        body: {
          action: 'delete',
          sessionId,
        },
      })

      if (fnError || !data?.success) {
        throw new Error(data?.error || fnError?.message || 'Failed to delete event')
      }

      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete event')
      return false
    }
  }, [supabase, connection])

  return {
    connection,
    isLoading,
    isConnecting,
    error,
    isConnected: Boolean(connection),
    connectMicrosoft,
    completeConnection,
    disconnect,
    createEvent,
    deleteEvent,
    refresh: checkConnection,
  }
}
