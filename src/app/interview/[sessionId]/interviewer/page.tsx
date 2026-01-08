'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { InterviewRoom } from '@/components/capture/interview-room'
import { CircleNotch, Warning } from 'phosphor-react'
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

interface RoomData {
  roomUrl: string
  interviewerToken: string
}

export default function InterviewerPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const resolvedParams = use(params)
  const sessionId = resolvedParams.sessionId
  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [session, setSession] = useState<SessionData | null>(null)
  const [roomData, setRoomData] = useState<RoomData | null>(null)

  // Fetch session and room data
  useEffect(() => {
    async function fetchData() {
      // Get session
      const { data: sessionData, error: sessionError } = await supabase
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

      if (sessionError || !sessionData) {
        setError('Session not found')
        setLoading(false)
        return
      }

      setSession(sessionData as unknown as SessionData)

      // If no room URL, redirect to entry page
      if (!sessionData.room_url) {
        router.push(`/interview/${sessionId}`)
        return
      }

      // Get tokens for this session
      const response = await fetch(`/api/daily/create-room?sessionId=${sessionId}`)

      if (!response.ok) {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to get room access')
        setLoading(false)
        return
      }

      const data = await response.json()
      setRoomData({
        roomUrl: data.roomUrl,
        interviewerToken: data.interviewerToken,
      })
      setLoading(false)
    }

    fetchData()
  }, [sessionId, supabase, router])

  const handleLeave = () => {
    router.push(`/campaigns/${session?.campaign_id}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <CircleNotch className="w-8 h-8 animate-spin text-white" weight="bold" />
      </div>
    )
  }

  if (error || !session || !roomData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-950 p-4">
        <Warning className="w-12 h-12 text-red-400 mb-4" weight="bold" />
        <p className="text-white font-medium mb-2">Error</p>
        <p className="text-zinc-400 text-sm text-center mb-4">{error || 'Failed to load session'}</p>
        <Button variant="outline" onClick={() => router.back()}>
          Go Back
        </Button>
      </div>
    )
  }

  return (
    <InterviewRoom
      sessionId={sessionId}
      campaignId={session.campaign_id}
      roomUrl={roomData.roomUrl}
      token={roomData.interviewerToken}
      role="interviewer"
      expertName={session.campaigns.expert_name}
      goal={session.campaigns.goal || undefined}
      sessionNumber={session.session_number}
      onLeave={handleLeave}
    />
  )
}
