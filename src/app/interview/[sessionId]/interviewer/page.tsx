'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { InterviewRoom } from '@/components/capture/interview-room'
import { CircleNotch, Warning } from 'phosphor-react'
import { Button } from '@/components/ui/button'

interface SessionData {
  id: string
  campaignId: string
  sessionNumber: number
  roomUrl: string | null
  expertName: string
  goal: string | null
}

interface RoomData {
  roomUrl: string
  interviewerToken: string
}

export default function InterviewerPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const resolvedParams = use(params)
  const sessionId = resolvedParams.sessionId
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [session, setSession] = useState<SessionData | null>(null)
  const [roomData, setRoomData] = useState<RoomData | null>(null)

  // Fetch session and room data from public API (no auth required)
  useEffect(() => {
    async function fetchData() {
      try {
        // Get session from public API
        const sessionResponse = await fetch(`/api/public/interview/${sessionId}`)

        if (!sessionResponse.ok) {
          setError('Session not found')
          setLoading(false)
          return
        }

        const sessionData: SessionData = await sessionResponse.json()
        setSession(sessionData)

        // If no room URL, redirect to entry page
        if (!sessionData.roomUrl) {
          router.push(`/interview/${sessionId}`)
          return
        }

        // Get interviewer token from public API (no auth required)
        const response = await fetch(`/api/public/interview/${sessionId}/token?role=interviewer`)

        if (!response.ok) {
          const errorData = await response.json()
          setError(errorData.error || 'Failed to get room access')
          setLoading(false)
          return
        }

        const data = await response.json()
        setRoomData({
          roomUrl: data.roomUrl,
          interviewerToken: data.token,
        })
        setLoading(false)
      } catch (err) {
        setError('Failed to load session')
        setLoading(false)
      }
    }

    fetchData()
  }, [sessionId, router])

  const handleLeave = () => {
    router.push(`/campaigns/${session?.campaignId}`)
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
      campaignId={session.campaignId}
      roomUrl={roomData.roomUrl}
      token={roomData.interviewerToken}
      role="interviewer"
      expertName={session.expertName}
      goal={session.goal || undefined}
      sessionNumber={session.sessionNumber}
      onLeave={handleLeave}
    />
  )
}
