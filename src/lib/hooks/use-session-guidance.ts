'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

// Auto-refresh interval in milliseconds (2.5 minutes)
const DEFAULT_AUTO_REFRESH_INTERVAL = 150000

export interface GuidanceData {
  suggestedQuestions: string[]
  contextualTip: string
  capturedInsights: string[]
}

export interface GuidanceContext {
  expertName: string
  sessionNumber: number
  capturedTopicsCount: number
  remainingTopicsCount: number
}

export interface UseSessionGuidanceOptions {
  sessionId: string
  recentTranscript?: string
  focusTopic?: string
  autoRefreshInterval?: number
  enabled?: boolean
}

export interface UseSessionGuidanceReturn {
  guidance: GuidanceData | null
  context: GuidanceContext | null
  isLoading: boolean
  error: string | null
  lastRefreshTime: Date | null
  autoRefreshEnabled: boolean
  toggleAutoRefresh: () => void
  refresh: () => Promise<void>
}

export function useSessionGuidance(options: UseSessionGuidanceOptions): UseSessionGuidanceReturn {
  const {
    sessionId,
    recentTranscript,
    focusTopic,
    autoRefreshInterval = DEFAULT_AUTO_REFRESH_INTERVAL,
    enabled = true,
  } = options

  const [guidance, setGuidance] = useState<GuidanceData | null>(null)
  const [context, setContext] = useState<GuidanceContext | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null)
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true)

  const autoRefreshTimerRef = useRef<NodeJS.Timeout | null>(null)
  const lastFetchedTranscriptRef = useRef<string>('')

  // Fetch AI guidance from the API
  const fetchGuidance = useCallback(async () => {
    if (!sessionId || !enabled) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/ai/session-guidance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          recentTranscript,
          focusTopic,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to get guidance')
      }

      const data = await response.json()

      if (data.success) {
        setGuidance({
          suggestedQuestions: data.guidance.suggestedQuestions || [],
          contextualTip: data.guidance.contextualTip || '',
          capturedInsights: data.guidance.capturedInsights || [],
        })
        setContext(data.context)
        lastFetchedTranscriptRef.current = recentTranscript || ''
        setLastRefreshTime(new Date())
      } else {
        throw new Error(data.error || 'Failed to get guidance')
      }
    } catch (err) {
      console.error('Error fetching AI guidance:', err)
      setError(err instanceof Error ? err.message : 'Failed to get AI guidance')
    } finally {
      setIsLoading(false)
    }
  }, [sessionId, recentTranscript, focusTopic, enabled])

  // Auto-refresh timer management
  useEffect(() => {
    if (!sessionId || !autoRefreshEnabled || !enabled) {
      if (autoRefreshTimerRef.current) {
        clearInterval(autoRefreshTimerRef.current)
        autoRefreshTimerRef.current = null
      }
      return
    }

    // Start auto-refresh timer
    autoRefreshTimerRef.current = setInterval(() => {
      fetchGuidance()
    }, autoRefreshInterval)

    return () => {
      if (autoRefreshTimerRef.current) {
        clearInterval(autoRefreshTimerRef.current)
        autoRefreshTimerRef.current = null
      }
    }
  }, [sessionId, autoRefreshEnabled, autoRefreshInterval, fetchGuidance, enabled])

  // Initial fetch
  useEffect(() => {
    if (!sessionId || !enabled) return

    if (!guidance && !isLoading) {
      fetchGuidance()
    }
  }, [sessionId, guidance, isLoading, fetchGuidance, enabled])

  // Refresh when transcript changes significantly (200+ characters)
  useEffect(() => {
    if (!sessionId || !enabled || !recentTranscript) return

    const lengthDiff = Math.abs((recentTranscript?.length || 0) - lastFetchedTranscriptRef.current.length)

    if (lengthDiff > 200) {
      const debounce = setTimeout(() => {
        fetchGuidance()
      }, 3000) // Wait 3 seconds after changes
      return () => clearTimeout(debounce)
    }
  }, [sessionId, recentTranscript, fetchGuidance, enabled])

  // Refresh immediately when focus topic changes
  const lastFocusTopicRef = useRef<string | undefined>(undefined)
  useEffect(() => {
    if (!sessionId || !enabled) return

    // Only fetch if focusTopic actually changed (not on initial mount)
    if (lastFocusTopicRef.current !== undefined && lastFocusTopicRef.current !== focusTopic) {
      fetchGuidance()
    }
    lastFocusTopicRef.current = focusTopic
  }, [sessionId, focusTopic, fetchGuidance, enabled])

  // Toggle auto-refresh
  const toggleAutoRefresh = useCallback(() => {
    setAutoRefreshEnabled(prev => !prev)
  }, [])

  return {
    guidance,
    context,
    isLoading,
    error,
    lastRefreshTime,
    autoRefreshEnabled,
    toggleAutoRefresh,
    refresh: fetchGuidance,
  }
}
