'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { X, ChatCircle, Robot } from 'phosphor-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface QuestionSuggestionProps {
  question: string
  onDismiss: () => void
  delay: number
}

function QuestionSuggestion({ question, onDismiss, delay }: QuestionSuggestionProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isExiting, setIsExiting] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay)
    return () => clearTimeout(timer)
  }, [delay])

  const handleDismiss = useCallback(() => {
    setIsExiting(true)
    setTimeout(() => onDismiss(), 200)
  }, [onDismiss])

  if (!isVisible) return null

  return (
    <div
      className={cn(
        'bg-card border border-border rounded-lg p-3 shadow-lg',
        'transform transition-all duration-300 ease-out',
        isExiting
          ? 'opacity-0 translate-x-4'
          : 'opacity-100 translate-x-0 animate-in slide-in-from-right-5'
      )}
    >
      <div className="flex items-start gap-2">
        <ChatCircle className="w-4 h-4 text-primary mt-0.5 shrink-0" weight="fill" />
        <p className="text-sm leading-relaxed text-foreground flex-1 pr-1">
          {question}
        </p>
        <Button
          variant="ghost"
          size="icon"
          className="h-5 w-5 -mt-0.5 -mr-1 shrink-0 hover:bg-destructive/10 hover:text-destructive"
          onClick={handleDismiss}
        >
          <X className="h-3 w-3" weight="bold" />
        </Button>
      </div>
    </div>
  )
}

interface QuestionSuggestionsOverlayProps {
  sessionId: string
  recentTranscript?: string
  maxVisible?: number
  autoRefreshInterval?: number
  className?: string
}

export function QuestionSuggestionsOverlay({
  sessionId,
  recentTranscript,
  maxVisible = 3,
  autoRefreshInterval = 180000, // 3 minutes
  className,
}: QuestionSuggestionsOverlayProps) {
  const [questions, setQuestions] = useState<string[]>([])
  const [dismissedQuestions, setDismissedQuestions] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(false)
  const [showHeader, setShowHeader] = useState(true)

  const lastFetchedRef = useRef<string>('')
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Fetch questions from API
  const fetchQuestions = useCallback(async () => {
    if (!sessionId) return

    setIsLoading(true)
    try {
      const response = await fetch('/api/ai/session-guidance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          recentTranscript,
        }),
      })

      if (!response.ok) return

      const data = await response.json()

      if (data.success && data.guidance?.suggestedQuestions) {
        setQuestions(data.guidance.suggestedQuestions)
        lastFetchedRef.current = recentTranscript || ''
      }
    } catch (err) {
      console.error('Error fetching question suggestions:', err)
    } finally {
      setIsLoading(false)
    }
  }, [sessionId, recentTranscript])

  // Initial fetch
  useEffect(() => {
    if (sessionId) {
      fetchQuestions()
    }
  }, [sessionId, fetchQuestions])

  // Auto-refresh timer
  useEffect(() => {
    if (!sessionId) return

    refreshTimerRef.current = setInterval(() => {
      fetchQuestions()
    }, autoRefreshInterval)

    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current)
      }
    }
  }, [sessionId, autoRefreshInterval, fetchQuestions])

  // Refresh on significant transcript change
  useEffect(() => {
    if (!recentTranscript) return

    const lengthDiff = Math.abs((recentTranscript?.length || 0) - lastFetchedRef.current.length)
    if (lengthDiff > 300) {
      const debounce = setTimeout(() => {
        fetchQuestions()
      }, 5000)
      return () => clearTimeout(debounce)
    }
  }, [recentTranscript, fetchQuestions])

  // Filter out dismissed questions and limit visible
  const visibleQuestions = questions
    .filter(q => !dismissedQuestions.has(q))
    .slice(0, maxVisible)

  // Dismiss a question
  const handleDismiss = useCallback((question: string) => {
    setDismissedQuestions(prev => new Set(prev).add(question))
  }, [])

  // Dismiss all
  const handleDismissAll = useCallback(() => {
    setDismissedQuestions(prev => {
      const next = new Set(prev)
      visibleQuestions.forEach(q => next.add(q))
      return next
    })
  }, [visibleQuestions])

  // Clear dismissed set periodically (every 5 minutes) to allow questions to reappear
  useEffect(() => {
    const timer = setInterval(() => {
      setDismissedQuestions(new Set())
    }, 300000) // 5 minutes

    return () => clearInterval(timer)
  }, [])

  // Don't render if no visible questions
  if (visibleQuestions.length === 0) {
    return null
  }

  return (
    <div className={cn('absolute top-3 right-3 z-50 max-w-sm w-full pointer-events-none', className)}>
      <div className="pointer-events-auto space-y-2">
        {/* Header with dismiss all */}
        {showHeader && visibleQuestions.length > 1 && (
          <div className="flex items-center justify-between px-1 animate-in fade-in duration-300">
            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
              <Robot className="w-3 h-3" weight="bold" />
              AI Suggestions
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-[10px] text-muted-foreground hover:text-foreground"
              onClick={handleDismissAll}
            >
              <X className="w-3 h-3 mr-1" weight="bold" />
              Dismiss All
            </Button>
          </div>
        )}

        {/* Question cards */}
        {visibleQuestions.map((question, i) => (
          <QuestionSuggestion
            key={question}
            question={question}
            onDismiss={() => handleDismiss(question)}
            delay={i * 100}
          />
        ))}
      </div>
    </div>
  )
}
