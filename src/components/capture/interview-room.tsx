'use client'

import { useState, useCallback, useRef } from 'react'
import { VideoCall, VideoCallHandle } from './video-call'
import { TranscriptPanel } from './transcript-panel'
import { SessionGuidePanel } from './session-guide-panel'
import { useRealtimeTranscription } from '@/lib/hooks/use-realtime-transcription'
import {
  CircleNotch,
  Warning,
  SignOut,
  ArrowRight,
  Check,
  Columns,
  SidebarSimple,
  ClosedCaptioning,
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
  const [showSidePanel, setShowSidePanel] = useState(true)
  const [showTranscript, setShowTranscript] = useState(true)
  const lastProcessedTimeRef = useRef<number>(0)
  const pendingTranscriptRef = useRef<string>('')
  const getAudioStreamRef = useRef<(() => MediaStream | null) | null>(null)
  const videoCallRef = useRef<VideoCallHandle>(null)

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

  // Handler for receiving audio stream from VideoCall
  const handleAudioStreamReady = useCallback((getStream: () => MediaStream | null) => {
    getAudioStreamRef.current = getStream
  }, [])

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
      // Small delay to ensure audio stream is ready
      setTimeout(() => {
        const getAudioStream = getAudioStreamRef.current
        if (getAudioStream) {
          const audioStream = getAudioStream()
          if (audioStream) {
            startTranscription(audioStream)
          } else {
            console.warn('[InterviewRoom] Audio stream not available yet')
          }
        } else {
          console.warn('[InterviewRoom] getAudioStream function not available')
        }
      }, 1500)
    }
  }, [role, startTranscription])

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
        <div className="flex items-center gap-2">
          {isProcessing && (
            <span className="text-xs text-primary flex items-center gap-1.5 mr-2">
              <CircleNotch className="w-3 h-3 animate-spin" weight="bold" />
              Processing...
            </span>
          )}
          {role === 'interviewer' && (
            <>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  'h-8 gap-1.5 text-zinc-300 hover:text-white hover:bg-zinc-800',
                  !showTranscript && 'text-zinc-500'
                )}
                onClick={() => setShowTranscript(!showTranscript)}
              >
                <ClosedCaptioning className="w-3.5 h-3.5" weight={showTranscript ? 'fill' : 'bold'} />
                Transcript
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  'h-8 gap-1.5 text-zinc-300 hover:text-white hover:bg-zinc-800',
                  !showSidePanel && 'text-zinc-500'
                )}
                onClick={() => setShowSidePanel(!showSidePanel)}
              >
                <SidebarSimple className="w-3.5 h-3.5" weight={showSidePanel ? 'fill' : 'bold'} />
                Guide
              </Button>
            </>
          )}
          <div className="w-px h-5 bg-zinc-700 mx-1" />
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/20"
            onClick={() => videoCallRef.current?.leave()}
          >
            <SignOut className="w-3.5 h-3.5" weight="bold" />
            End Session
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {role === 'interviewer' ? (
          // Interviewer view: Video + Transcript + Session Guide
          <>
            {/* Left: Video + Transcript */}
            <div className={cn('flex flex-col p-4 gap-4 transition-all duration-300', showSidePanel ? 'w-2/3' : 'w-full')}>
              <div className="flex-1 relative">
                <VideoCall
                  ref={videoCallRef}
                  roomUrl={roomUrl}
                  token={token}
                  onJoined={handleCallJoined}
                  onLeft={handleCallLeft}
                  onAudioStreamReady={handleAudioStreamReady}
                  className="h-full"
                />
              </div>
              {showTranscript && (
                <div className="h-[300px]">
                  <TranscriptPanel
                    lines={transcriptLines}
                    currentInterim={currentInterim}
                    isTranscribing={isTranscribing}
                    isConnecting={!isTranscriptionConnected && isCallJoined}
                    className="h-full"
                  />
                </div>
              )}
            </div>

            {/* Right: Session Guide (Topic Coverage + AI Guidance) */}
            {showSidePanel && (
              <div className="w-1/3 flex flex-col p-4 pl-0">
                <SessionGuidePanel
                  sessionId={sessionId}
                  campaignId={campaignId}
                  recentTranscript={recentTranscript}
                  expertName={expertName}
                  sessionNumber={sessionNumber}
                  goal={goal}
                  className="h-full"
                />
              </div>
            )}
          </>
        ) : (
          // Guest view: Just video + transcript
          <div className="flex-1 flex flex-col p-4 gap-4 max-w-4xl mx-auto">
            <div className="flex-1">
              <VideoCall
                ref={videoCallRef}
                roomUrl={roomUrl}
                token={token}
                onJoined={handleCallJoined}
                onLeft={handleCallLeft}
                onAudioStreamReady={handleAudioStreamReady}
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
