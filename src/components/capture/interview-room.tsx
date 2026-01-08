'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { VideoCall } from './video-call'
import { TranscriptPanel } from './transcript-panel'
import { LiveKnowledgeGraph } from './live-knowledge-graph'
import { AICoachPanel } from './ai-coach-panel'
import { useRealtimeTranscription } from '@/lib/hooks/use-realtime-transcription'
import { useDailyCall } from '@/lib/hooks/use-daily-call'
import {
  CircleNotch,
  Warning,
  SignOut,
  ArrowRight,
  Check,
  Columns,
} from 'phosphor-react'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { cn } from '@/lib/utils'

interface InterviewRoomProps {
  sessionId: string
  campaignId: string
  roomUrl: string
  token: string
  role: 'interviewer' | 'guest'
  expertName?: string
  goal?: string
  sessionNumber?: number
  onLeave?: () => void
}

export function InterviewRoom({
  sessionId,
  campaignId,
  roomUrl,
  token,
  role,
  expertName,
  goal,
  sessionNumber,
  onLeave,
}: InterviewRoomProps) {
  const [isCallJoined, setIsCallJoined] = useState(false)
  const [showEndModal, setShowEndModal] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const lastProcessedTimeRef = useRef<number>(0)
  const pendingTranscriptRef = useRef<string>('')

  // Transcription hook
  const {
    isConnected: isTranscriptionConnected,
    isTranscribing,
    transcriptLines,
    currentInterim,
    startTranscription,
    stopTranscription,
  } = useRealtimeTranscription({
    apiKey: process.env.NEXT_PUBLIC_DEEPGRAM_API_KEY || '',
    onTranscriptLine: (line) => {
      // Accumulate transcript for processing
      pendingTranscriptRef.current += `${line.speaker}: ${line.text}\n`
    },
    onUtteranceEnd: () => {
      // Process at natural pauses if enough time has passed (30 seconds minimum)
      const now = Date.now()
      if (now - lastProcessedTimeRef.current > 30000 && pendingTranscriptRef.current.length > 100) {
        processTranscript()
      }
    },
  })

  // Daily.co call hook (for audio stream)
  const {
    getCombinedAudioStream,
  } = useDailyCall()

  // Process transcript through AI
  const processTranscript = useCallback(async () => {
    if (isProcessing || !pendingTranscriptRef.current) return

    setIsProcessing(true)
    lastProcessedTimeRef.current = Date.now()
    const transcriptToProcess = pendingTranscriptRef.current
    pendingTranscriptRef.current = ''

    try {
      await fetch('/api/transcription/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          transcriptLines: transcriptLines.slice(-20).map(l => ({
            speaker: l.speaker,
            text: l.text,
            timestampSeconds: l.timestampSeconds,
          })),
        }),
      })
    } catch (error) {
      console.error('Error processing transcript:', error)
    } finally {
      setIsProcessing(false)
    }
  }, [sessionId, transcriptLines, isProcessing])

  // Handle call joined
  const handleCallJoined = useCallback(() => {
    setIsCallJoined(true)

    // Start transcription when call is joined (interviewer only)
    if (role === 'interviewer') {
      // Small delay to ensure audio is ready
      setTimeout(() => {
        const audioStream = getCombinedAudioStream()
        if (audioStream) {
          startTranscription(audioStream)
        }
      }, 1000)
    }
  }, [role, getCombinedAudioStream, startTranscription])

  // Handle call left
  const handleCallLeft = useCallback(async () => {
    setIsCallJoined(false)
    stopTranscription()

    // Process any remaining transcript
    if (pendingTranscriptRef.current) {
      await processTranscript()
    }

    setShowEndModal(true)
  }, [stopTranscription, processTranscript])

  // Format recent transcript for AI coach
  const recentTranscript = transcriptLines
    .slice(-10)
    .map(l => `${l.speaker}: ${l.text}`)
    .join('\n')

  // End session and go back
  const handleEndSession = () => {
    setShowEndModal(false)
    onLeave?.()
  }

  return (
    <div className="h-screen flex flex-col bg-zinc-950">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 bg-zinc-900 border-b border-zinc-800">
        <div>
          <h1 className="text-white font-semibold">
            {role === 'interviewer' ? 'Interview Session' : 'Knowledge Capture Session'}
          </h1>
          <p className="text-zinc-400 text-sm">
            {expertName && `With ${expertName}`}
            {sessionNumber && ` · Session ${sessionNumber}`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isProcessing && (
            <span className="text-xs text-primary flex items-center gap-1">
              <CircleNotch className="w-3 h-3 animate-spin" weight="bold" />
              Processing...
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            className="bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700"
            onClick={() => setShowEndModal(true)}
          >
            <SignOut className="w-4 h-4 mr-2" weight="bold" />
            End Session
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {role === 'interviewer' ? (
          // Interviewer view: Video + Transcript + Knowledge Graph + AI Coach
          <>
            {/* Left: Video + Transcript */}
            <div className="w-1/2 flex flex-col p-4 gap-4">
              <div className="flex-1">
                <VideoCall
                  roomUrl={roomUrl}
                  token={token}
                  onJoined={handleCallJoined}
                  onLeft={handleCallLeft}
                  showRecordingControls
                  className="h-full"
                />
              </div>
              <div className="h-[300px]">
                <TranscriptPanel
                  lines={transcriptLines}
                  currentInterim={currentInterim}
                  isTranscribing={isTranscribing}
                  isConnecting={!isTranscriptionConnected && isCallJoined}
                  className="h-full"
                />
              </div>
            </div>

            {/* Right: Knowledge Graph + AI Coach */}
            <div className="w-1/2 flex flex-col p-4 pl-0 gap-4">
              <div className="flex-1 bg-card rounded-xl border overflow-hidden">
                <LiveKnowledgeGraph
                  campaignId={campaignId}
                  className="h-full"
                />
              </div>
              <div className="h-[300px]">
                <AICoachPanel
                  sessionId={sessionId}
                  recentTranscript={recentTranscript}
                  expertName={expertName}
                  sessionNumber={sessionNumber}
                  goal={goal}
                />
              </div>
            </div>
          </>
        ) : (
          // Guest view: Just video + transcript
          <div className="flex-1 flex flex-col p-4 gap-4 max-w-4xl mx-auto">
            <div className="flex-1">
              <VideoCall
                roomUrl={roomUrl}
                token={token}
                onJoined={handleCallJoined}
                onLeft={handleCallLeft}
                className="h-full"
              />
            </div>
            <div className="h-[200px]">
              <TranscriptPanel
                lines={transcriptLines}
                currentInterim={currentInterim}
                isTranscribing={isTranscribing}
                className="h-full"
              />
            </div>
          </div>
        )}
      </div>

      {/* End Session Modal */}
      <Modal
        isOpen={showEndModal}
        onClose={() => setShowEndModal(false)}
        title="Session Complete"
      >
        <div className="text-center space-y-6 py-4">
          <div className="w-20 h-20 bg-emerald-100/50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-10 h-10 text-emerald-600" weight="bold" />
          </div>

          <div>
            <div className="text-2xl font-bold">Great Session!</div>
            <p className="text-muted-foreground mt-1">
              Knowledge has been captured and is being processed.
            </p>
          </div>

          <div className="bg-primary/5 p-5 rounded-xl border border-primary/10 text-left">
            <div className="font-semibold mb-3 text-primary flex items-center gap-2">
              <Columns className="w-4 h-4" weight="bold" />
              Processing in progress
            </div>
            <ul className="space-y-2">
              {['Extracting key insights', 'Updating knowledge graph', 'Generating session summary'].map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm text-foreground/80">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <Button onClick={handleEndSession} className="w-full">
            Back to Campaign
            <ArrowRight className="w-4 h-4 ml-2" weight="bold" />
          </Button>
        </div>
      </Modal>
    </div>
  )
}
