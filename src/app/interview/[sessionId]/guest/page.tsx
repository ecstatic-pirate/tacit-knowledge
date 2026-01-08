'use client'

import { useEffect, useState, use } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { InterviewRoom } from '@/components/capture/interview-room'
import { CircleNotch, Warning, VideoCamera, User } from 'phosphor-react'
import { Button } from '@/components/ui/button'

interface SessionData {
  id: string
  campaign_id: string
  session_number: number
  room_url: string | null
  campaigns: {
    id: string
    expert_name: string
    goal: string | null
  }
}

export default function GuestPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const resolvedParams = use(params)
  const sessionId = resolvedParams.sessionId
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  // Get token from URL query params
  const guestToken = searchParams.get('token')

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [session, setSession] = useState<SessionData | null>(null)
  const [roomUrl, setRoomUrl] = useState<string | null>(null)
  const [isJoining, setIsJoining] = useState(false)
  const [hasJoined, setHasJoined] = useState(false)

  // Fetch session data
  useEffect(() => {
    async function fetchSession() {
      const { data, error } = await supabase
        .from('sessions')
        .select(`
          id,
          campaign_id,
          session_number,
          room_url,
          campaigns (
            id,
            expert_name,
            goal
          )
        `)
        .eq('id', sessionId)
        .single()

      if (error || !data) {
        setError('Session not found')
        setLoading(false)
        return
      }

      setSession(data as unknown as SessionData)
      setRoomUrl(data.room_url)
      setLoading(false)

      // If no room URL, the interviewer hasn't started yet
      if (!data.room_url) {
        setError('The interview has not started yet. Please wait for the interviewer to begin.')
      }
    }

    fetchSession()
  }, [sessionId, supabase])

  // Handle joining the call
  const handleJoin = () => {
    if (!roomUrl || !guestToken) return
    setIsJoining(true)
    setHasJoined(true)
  }

  const handleLeave = () => {
    setHasJoined(false)
    // Show thank you page or redirect
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

  if (!guestToken) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-950 p-4">
        <Warning className="w-12 h-12 text-red-400 mb-4" weight="bold" />
        <p className="text-white font-medium mb-2">Invalid Link</p>
        <p className="text-zinc-400 text-sm text-center">
          This link is missing required parameters. Please use the link provided by your interviewer.
        </p>
      </div>
    )
  }

  // Show joined room
  if (hasJoined && roomUrl) {
    return (
      <InterviewRoom
        sessionId={sessionId}
        campaignId={session.campaign_id}
        roomUrl={roomUrl}
        token={guestToken}
        role="guest"
        expertName={session.campaigns.expert_name}
        sessionNumber={session.session_number}
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
          Welcome, {session.campaigns.expert_name}
        </h1>
        <p className="text-zinc-400 mb-6">
          You&apos;re about to join a knowledge capture session.
        </p>

        {session.campaigns.goal && (
          <div className="bg-zinc-800 rounded-lg p-4 mb-6 text-left">
            <p className="text-xs text-zinc-500 uppercase font-medium mb-1">Session Topic</p>
            <p className="text-zinc-300 text-sm">{session.campaigns.goal}</p>
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
          disabled={isJoining || !roomUrl}
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
      </div>
    </div>
  )
}
