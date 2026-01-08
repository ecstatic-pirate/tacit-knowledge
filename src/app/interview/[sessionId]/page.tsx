'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { CircleNotch, Warning, VideoCamera } from 'phosphor-react'
import { Button } from '@/components/ui/button'

interface SessionData {
  id: string
  campaignId: string
  roomUrl: string | null
  expertName: string
  goal: string | null
}

export default function InterviewEntryPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const resolvedParams = use(params)
  const sessionId = resolvedParams.sessionId
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [creatingRoom, setCreatingRoom] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [session, setSession] = useState<SessionData | null>(null)

  // Fetch session data from public API (no auth required)
  useEffect(() => {
    async function fetchSession() {
      try {
        const response = await fetch(`/api/public/interview/${sessionId}`)

        if (!response.ok) {
          setError('Session not found')
          setLoading(false)
          return
        }

        const data: SessionData = await response.json()
        setSession(data)
        setLoading(false)

        // If room already exists, redirect to interviewer view
        if (data.roomUrl) {
          router.push(`/interview/${sessionId}/interviewer`)
        }
      } catch (err) {
        setError('Failed to load session')
        setLoading(false)
      }
    }

    fetchSession()
  }, [sessionId, router])

  // Create room and start interview
  const handleStartInterview = async () => {
    setCreatingRoom(true)
    setError(null)

    try {
      const response = await fetch('/api/daily/create-room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create room')
      }

      // Redirect to interviewer view
      router.push(`/interview/${sessionId}/interviewer`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start interview')
      setCreatingRoom(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <CircleNotch className="w-8 h-8 animate-spin text-white" weight="bold" />
      </div>
    )
  }

  if (error || !session) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-950 p-4">
        <Warning className="w-12 h-12 text-red-400 mb-4" weight="bold" />
        <p className="text-white font-medium mb-2">Error</p>
        <p className="text-zinc-400 text-sm text-center mb-4">{error || 'Session not found'}</p>
        <Button variant="outline" onClick={() => router.back()}>
          Go Back
        </Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-950 p-4">
      <div className="max-w-md w-full bg-zinc-900 rounded-xl p-8 text-center">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <VideoCamera className="w-8 h-8 text-primary" weight="bold" />
        </div>

        <h1 className="text-2xl font-bold text-white mb-2">Start Interview</h1>
        <p className="text-zinc-400 mb-6">
          You&apos;re about to start a knowledge capture session with{' '}
          <span className="text-white font-medium">{session.expertName}</span>
        </p>

        {session.goal && (
          <div className="bg-zinc-800 rounded-lg p-4 mb-6 text-left">
            <p className="text-xs text-zinc-500 uppercase font-medium mb-1">Session Goal</p>
            <p className="text-zinc-300 text-sm">{session.goal}</p>
          </div>
        )}

        <div className="space-y-3">
          <Button
            onClick={handleStartInterview}
            disabled={creatingRoom}
            className="w-full"
            size="lg"
          >
            {creatingRoom ? (
              <>
                <CircleNotch className="w-5 h-5 mr-2 animate-spin" weight="bold" />
                Setting up room...
              </>
            ) : (
              <>
                <VideoCamera className="w-5 h-5 mr-2" weight="bold" />
                Start Interview
              </>
            )}
          </Button>

          <Button
            variant="ghost"
            className="w-full text-zinc-400"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
        </div>

        {error && (
          <p className="text-red-400 text-sm mt-4">{error}</p>
        )}
      </div>
    </div>
  )
}
