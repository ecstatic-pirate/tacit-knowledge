'use client'

import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react'
import { useDailyCall } from '@/lib/hooks/use-daily-call'
import {
  Microphone,
  MicrophoneSlash,
  VideoCamera,
  VideoCameraSlash,
  DesktopTower,
  CircleNotch,
  User,
  Warning,
} from 'phosphor-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface VideoCallHandle {
  leave: () => Promise<void>
  sendMessage: (data: unknown) => void
}

interface VideoCallProps {
  roomUrl: string
  token: string
  onAudioTrack?: (track: MediaStreamTrack, participantId: string) => void
  onJoined?: () => void
  onLeft?: () => void
  onError?: (error: Error) => void
  /** Callback with audio stream for transcription */
  onAudioStreamReady?: (getStream: () => MediaStream | null) => void
  /** Callback when app message is received from another participant */
  onAppMessage?: (data: unknown, fromParticipantId: string) => void
  className?: string
}

export const VideoCall = forwardRef<VideoCallHandle, VideoCallProps>(function VideoCall({
  roomUrl,
  token,
  onAudioTrack,
  onJoined,
  onLeft,
  onError,
  onAudioStreamReady,
  onAppMessage,
  className,
}, ref) {
  const {
    callObject,
    isJoining,
    isInCall,
    localParticipant,
    remoteParticipants,
    isAudioEnabled,
    isVideoEnabled,
    isScreenSharing,
    error,
    localVideoRef,
    joinCall,
    leaveCall,
    toggleAudio,
    toggleVideo,
    startScreenShare,
    stopScreenShare,
    getCombinedAudioStream,
    sendAppMessage,
  } = useDailyCall({
    onAudioTrack,
    onAppMessage,
    onError,
  })

  const remoteVideoRef = useRef<HTMLVideoElement>(null)
  const hasAttemptedJoin = useRef(false)

  // Expose methods to parent via ref
  useImperativeHandle(ref, () => ({
    leave: async () => {
      await leaveCall()
      onLeft?.()
    },
    sendMessage: (data: unknown) => {
      sendAppMessage(data)
    },
  }), [leaveCall, onLeft, sendAppMessage])

  // Auto-join when component mounts (with small delay for SDK initialization)
  useEffect(() => {
    if (roomUrl && token && !isInCall && !isJoining && !hasAttemptedJoin.current) {
      hasAttemptedJoin.current = true
      // Small delay to ensure Daily.co SDK is fully initialized
      const timer = setTimeout(() => {
        joinCall(roomUrl, token)
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [roomUrl, token, isInCall, isJoining, joinCall])

  // Notify parent when joined
  useEffect(() => {
    if (isInCall) {
      onJoined?.()
      // Pass the audio stream getter to the parent
      onAudioStreamReady?.(getCombinedAudioStream)
    }
  }, [isInCall, onJoined, onAudioStreamReady, getCombinedAudioStream])

  // Set up remote video
  useEffect(() => {
    if (!remoteVideoRef.current || remoteParticipants.length === 0) return

    const firstRemote = remoteParticipants[0]
    if (firstRemote.videoTrack) {
      const stream = new MediaStream([firstRemote.videoTrack])
      remoteVideoRef.current.srcObject = stream
    }
  }, [remoteParticipants])

  if (error) {
    return (
      <div className={cn('flex flex-col items-center justify-center h-full bg-zinc-900 rounded-xl p-8', className)}>
        <Warning className="w-12 h-12 text-red-400 mb-4" weight="bold" />
        <p className="text-red-400 font-medium mb-2">Failed to join call</p>
        <p className="text-zinc-400 text-sm text-center mb-4">{error}</p>
        <Button variant="outline" onClick={() => joinCall(roomUrl, token)}>
          Try Again
        </Button>
      </div>
    )
  }

  if (isJoining) {
    return (
      <div className={cn('flex flex-col items-center justify-center h-full bg-zinc-900 rounded-xl', className)}>
        <CircleNotch className="w-8 h-8 text-white animate-spin mb-4" weight="bold" />
        <p className="text-white font-medium">Joining call...</p>
      </div>
    )
  }

  if (!isInCall) {
    return (
      <div className={cn('flex flex-col items-center justify-center h-full bg-zinc-900 rounded-xl', className)}>
        <Button onClick={() => joinCall(roomUrl, token)} size="lg">
          <VideoCamera className="w-5 h-5 mr-2" weight="bold" />
          Join Call
        </Button>
      </div>
    )
  }

  return (
    <div className={cn('flex flex-col h-full bg-zinc-900 rounded-xl overflow-hidden', className)}>
      {/* Video Grid */}
      <div className="flex-1 relative p-2 grid gap-2" style={{
        gridTemplateColumns: remoteParticipants.length > 0 ? '1fr 1fr' : '1fr',
      }}>
        {/* Remote Participant (main view) */}
        {remoteParticipants.length > 0 ? (
          <div className="relative bg-zinc-800 rounded-lg overflow-hidden">
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            {!remoteParticipants[0].video && (
              <div className="absolute inset-0 flex items-center justify-center bg-zinc-800">
                <div className="w-20 h-20 rounded-full bg-zinc-700 flex items-center justify-center">
                  <User className="w-10 h-10 text-zinc-500" weight="bold" />
                </div>
              </div>
            )}
            <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/50 rounded text-xs text-white">
              {remoteParticipants[0].user_name || 'Guest'}
              {remoteParticipants[0].audio === false && (
                <MicrophoneSlash className="inline-block w-3 h-3 ml-1 text-red-400" weight="bold" />
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center bg-zinc-800 rounded-lg">
            <div className="text-center">
              <User className="w-16 h-16 text-zinc-600 mx-auto mb-2" weight="bold" />
              <p className="text-zinc-400 text-sm">Waiting for guest to join...</p>
            </div>
          </div>
        )}

        {/* Local Video */}
        <div className="relative bg-zinc-800 rounded-lg overflow-hidden">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover mirror"
          />
          {!isVideoEnabled && (
            <div className="absolute inset-0 flex items-center justify-center bg-zinc-800">
              <div className="w-16 h-16 rounded-full bg-zinc-700 flex items-center justify-center">
                <User className="w-8 h-8 text-zinc-500" weight="bold" />
              </div>
            </div>
          )}
          <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/50 rounded text-xs text-white">
            You
            {!isAudioEnabled && (
              <MicrophoneSlash className="inline-block w-3 h-3 ml-1 text-red-400" weight="bold" />
            )}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="p-3 flex items-center justify-center gap-2 bg-zinc-800/50">
        {/* Microphone Toggle */}
        <Button
          variant={isAudioEnabled ? 'secondary' : 'destructive'}
          size="icon"
          className="rounded-full w-12 h-12"
          onClick={toggleAudio}
        >
          {isAudioEnabled ? (
            <Microphone className="w-5 h-5" weight="bold" />
          ) : (
            <MicrophoneSlash className="w-5 h-5" weight="bold" />
          )}
        </Button>

        {/* Video Toggle */}
        <Button
          variant={isVideoEnabled ? 'secondary' : 'destructive'}
          size="icon"
          className="rounded-full w-12 h-12"
          onClick={toggleVideo}
        >
          {isVideoEnabled ? (
            <VideoCamera className="w-5 h-5" weight="bold" />
          ) : (
            <VideoCameraSlash className="w-5 h-5" weight="bold" />
          )}
        </Button>

        {/* Screen Share Toggle */}
        <Button
          variant={isScreenSharing ? 'default' : 'secondary'}
          size="icon"
          className="rounded-full w-12 h-12"
          onClick={isScreenSharing ? stopScreenShare : startScreenShare}
          title={isScreenSharing ? 'Stop sharing' : 'Share screen'}
        >
          <DesktopTower className={cn('w-5 h-5', isScreenSharing && 'text-primary-foreground')} weight="bold" />
        </Button>
      </div>

      <style jsx>{`
        .mirror {
          transform: scaleX(-1);
        }
      `}</style>
    </div>
  )
})
