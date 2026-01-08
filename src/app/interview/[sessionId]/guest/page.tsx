'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { InterviewRoom } from '@/components/capture/interview-room'
import { CircleNotch, Warning, VideoCamera, User } from 'phosphor-react'
import { Button } from '@/components/ui/button'

interface SessionData {
  id: string
  campaignId: string
  sessionNumber: number
  roomUrl: string | null
  expertName: string
  goal: string | null
}

export default function GuestPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const resolvedParams = use(params)
  const sessionId = resolvedParams.sessionId
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [session, setSession] = useState<SessionData | null>(null)
  const [guestToken, setGuestToken] = useState<string | null>(null)
  const [isJoining, setIsJoining] = useState(false)
  const [hasJoined, setHasJoined] = useState(false)

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

        // If no room URL, the interviewer hasn't started yet
        if (!data.roomUrl) {
          setError('The interview has not started yet. Please wait for the interviewer to begin.')
        }
      } catch (err) {
        setError('Failed to load session')
        setLoading(false)
      }
    }

    fetchSession()
  }, [sessionId])

  // Handle joining the call - fetch guest token first
  const handleJoin = async () => {
    if (!session?.roomUrl) return

    setIsJoining(true)
    setError(null)

    try {
      // Get guest token from public API (no auth required)
      const response = await fetch(`/api/public/interview/${sessionId}/token?role=guest`)

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to get room access')
      }

      const data = await response.json()
      setGuestToken(data.token)
      setHasJoined(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join session')
      setIsJoining(false)
    }
  }

  const handleLeave = () => {
    setHasJoined(false)
    // Show thank you page
    router.push('/interview/thank-you')
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
        <Warning className="w-12 h-12 text-amber-400 mb-4" weight="bold" />
        <p className="text-white font-medium mb-2">Cannot Join Yet</p>
        <p className="text-zinc-400 text-sm text-center max-w-md">
          {error || 'Session not found'}
        </p>
        {error?.includes('not started') && (
          <Button
            variant="outline"
            className="mt-6"
            onClick={() => window.location.reload()}
          >
            Refresh Page
          </Button>
        )}
      </div>
    )
  }

  // Show joined room
  if (hasJoined && session.roomUrl && guestToken) {
    return (
      <InterviewRoom
        sessionId={sessionId}
        campaignId={session.campaignId}
        roomUrl={session.roomUrl}
        token={guestToken}
        role="guest"
        expertName={session.expertName}
        sessionNumber={session.sessionNumber}
        onLeave={handleLeave}
      />
    )
  }

  // Show pre-join screen
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-950 p-4">
      <div className="max-w-md w-full bg-zinc-900 rounded-xl p-8 text-center">
        <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <User className="w-8 h-8 text-emerald-500" weight="bold" />
        </div>

        <h1 className="text-2xl font-bold text-white mb-2">
          Welcome, {session.expertName}
        </h1>
        <p className="text-zinc-400 mb-6">
          You&apos;re about to join a knowledge capture session.
        </p>

        {session.goal && (
          <div className="bg-zinc-800 rounded-lg p-4 mb-6 text-left">
            <p className="text-xs text-zinc-500 uppercase font-medium mb-1">Session Topic</p>
            <p className="text-zinc-300 text-sm">{session.goal}</p>
          </div>
        )}

        <div className="bg-zinc-800/50 rounded-lg p-4 mb-6 text-left text-sm">
          <p className="text-zinc-400 mb-3">Before joining, please ensure:</p>
          <ul className="space-y-2 text-zinc-300">
            <li className="flex items-start gap-2">
              <span className="text-emerald-500 mt-0.5">1</span>
              Your camera and microphone are working
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-500 mt-0.5">2</span>
              You&apos;re in a quiet environment
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-500 mt-0.5">3</span>
              You have ~60 minutes available
            </li>
          </ul>
        </div>

        <Button
          onClick={handleJoin}
          disabled={isJoining || !session.roomUrl}
          className="w-full"
          size="lg"
        >
          {isJoining ? (
            <>
              <CircleNotch className="w-5 h-5 mr-2 animate-spin" weight="bold" />
              Joining...
            </>
          ) : (
            <>
              <VideoCamera className="w-5 h-5 mr-2" weight="bold" />
              Join Session
            </>
          )}
        </Button>

        {error && (
          <p className="text-red-400 text-sm mt-4">{error}</p>
        )}
      </div>
    </div>
  )
}
