'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import DailyIframe, { DailyCall, DailyParticipant, DailyEventObjectParticipant, DailyEventObjectParticipantLeft } from '@daily-co/daily-js'

export interface UseDailyCallOptions {
  /** Callback when audio track is available (for transcription) */
  onAudioTrack?: (track: MediaStreamTrack, participantId: string) => void
  /** Callback when participant joins */
  onParticipantJoined?: (participant: DailyParticipant) => void
  /** Callback when participant leaves */
  onParticipantLeft?: (participant: DailyParticipant) => void
  /** Callback on errors */
  onError?: (error: Error) => void
}

export interface UseDailyCallReturn {
  // State
  callObject: DailyCall | null
  isJoining: boolean
  isInCall: boolean
  localParticipant: DailyParticipant | null
  remoteParticipants: DailyParticipant[]
  isAudioEnabled: boolean
  isVideoEnabled: boolean
  isRecording: boolean
  error: string | null

  // Video refs
  localVideoRef: React.RefObject<HTMLVideoElement>

  // Actions
  joinCall: (roomUrl: string, token: string) => Promise<void>
  leaveCall: () => Promise<void>
  toggleAudio: () => void
  toggleVideo: () => void
  startRecording: () => Promise<void>
  stopRecording: () => Promise<void>

  // Get combined audio stream (for Deepgram)
  getCombinedAudioStream: () => MediaStream | null
}

export function useDailyCall(options: UseDailyCallOptions = {}): UseDailyCallReturn {
  const { onAudioTrack, onParticipantJoined, onParticipantLeft, onError } = options

  const [callObject, setCallObject] = useState<DailyCall | null>(null)
  const [isJoining, setIsJoining] = useState(false)
  const [isInCall, setIsInCall] = useState(false)
  const [localParticipant, setLocalParticipant] = useState<DailyParticipant | null>(null)
  const [remoteParticipants, setRemoteParticipants] = useState<DailyParticipant[]>([])
  const [isAudioEnabled, setIsAudioEnabled] = useState(true)
  const [isVideoEnabled, setIsVideoEnabled] = useState(true)
  const [isRecording, setIsRecording] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const localVideoRef = useRef<HTMLVideoElement>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const combinedStreamRef = useRef<MediaStream | null>(null)
  const audioSourcesRef = useRef<MediaStreamAudioSourceNode[]>([])

  // Update participants from call object
  const updateParticipants = useCallback((call: DailyCall) => {
    const participants = call.participants()
    const local = participants.local
    const remote = Object.values(participants).filter(p => !p.local)

    setLocalParticipant(local)
    setRemoteParticipants(remote)
    setIsAudioEnabled(local.audio !== false)
    setIsVideoEnabled(local.video !== false)
  }, [])

  // Set up local video
  const setupLocalVideo = useCallback(async (call: DailyCall) => {
    if (!localVideoRef.current) return

    const participants = call.participants()
    const local = participants.local

    if (local.videoTrack) {
      const stream = new MediaStream([local.videoTrack])
      localVideoRef.current.srcObject = stream
    }
  }, [])

  // Join a Daily.co call
  const joinCall = useCallback(async (roomUrl: string, token: string) => {
    try {
      setIsJoining(true)
      setError(null)

      // Create call object
      const call = DailyIframe.createCallObject({
        audioSource: true,
        videoSource: true,
      })

      // Set up event listeners
      call.on('joined-meeting', () => {
        setIsInCall(true)
        setIsJoining(false)
        updateParticipants(call)
        setupLocalVideo(call)
      })

      call.on('left-meeting', () => {
        setIsInCall(false)
        setLocalParticipant(null)
        setRemoteParticipants([])
      })

      call.on('participant-joined', (event: DailyEventObjectParticipant | undefined) => {
        if (event?.participant) {
          updateParticipants(call)
          onParticipantJoined?.(event.participant)

          // Notify about audio track for transcription
          if (event.participant.audioTrack && onAudioTrack) {
            onAudioTrack(event.participant.audioTrack, event.participant.session_id)
          }
        }
      })

      call.on('participant-left', (event: DailyEventObjectParticipantLeft | undefined) => {
        if (event?.participant) {
          updateParticipants(call)
          onParticipantLeft?.(event.participant)
        }
      })

      call.on('participant-updated', () => {
        updateParticipants(call)
        setupLocalVideo(call)
      })

      call.on('track-started', (event) => {
        if (event?.track?.kind === 'audio' && event.participant && onAudioTrack) {
          onAudioTrack(event.track, event.participant.session_id)
        }
        if (event?.track?.kind === 'video' && event.participant?.local) {
          setupLocalVideo(call)
        }
      })

      call.on('recording-started', () => {
        setIsRecording(true)
      })

      call.on('recording-stopped', () => {
        setIsRecording(false)
      })

      call.on('error', (event) => {
        const errorMsg = event?.errorMsg || 'Unknown error'
        setError(errorMsg)
        onError?.(new Error(errorMsg))
      })

      setCallObject(call)

      // Join the call
      await call.join({
        url: roomUrl,
        token: token,
      })

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to join call'
      setError(errorMsg)
      setIsJoining(false)
      onError?.(err instanceof Error ? err : new Error(errorMsg))
    }
  }, [onAudioTrack, onParticipantJoined, onParticipantLeft, onError, updateParticipants, setupLocalVideo])

  // Leave the call
  const leaveCall = useCallback(async () => {
    if (callObject) {
      await callObject.leave()
      callObject.destroy()
      setCallObject(null)
      setIsInCall(false)

      // Clean up audio context
      if (audioContextRef.current) {
        audioContextRef.current.close()
        audioContextRef.current = null
      }
      combinedStreamRef.current = null
    }
  }, [callObject])

  // Toggle local audio
  const toggleAudio = useCallback(() => {
    if (callObject) {
      const newState = !isAudioEnabled
      callObject.setLocalAudio(newState)
      setIsAudioEnabled(newState)
    }
  }, [callObject, isAudioEnabled])

  // Toggle local video
  const toggleVideo = useCallback(() => {
    if (callObject) {
      const newState = !isVideoEnabled
      callObject.setLocalVideo(newState)
      setIsVideoEnabled(newState)
    }
  }, [callObject, isVideoEnabled])

  // Start cloud recording
  const startRecording = useCallback(async () => {
    if (callObject) {
      await callObject.startRecording()
    }
  }, [callObject])

  // Stop cloud recording
  const stopRecording = useCallback(async () => {
    if (callObject) {
      await callObject.stopRecording()
    }
  }, [callObject])

  // Get combined audio stream from all participants (for Deepgram)
  const getCombinedAudioStream = useCallback((): MediaStream | null => {
    if (!callObject) return null

    try {
      // Clean up previous audio sources to prevent memory leak
      audioSourcesRef.current.forEach(source => {
        try { source.disconnect() } catch { /* ignore */ }
      })
      audioSourcesRef.current = []

      // Create audio context if needed
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext()
      }
      const audioContext = audioContextRef.current

      const participants = callObject.participants()
      const destination = audioContext.createMediaStreamDestination()

      // Add all audio tracks to the destination
      Object.values(participants).forEach(participant => {
        if (participant.audioTrack) {
          const stream = new MediaStream([participant.audioTrack])
          const source = audioContext.createMediaStreamSource(stream)
          source.connect(destination)
          audioSourcesRef.current.push(source) // Track for cleanup
        }
      })

      combinedStreamRef.current = destination.stream
      return destination.stream
    } catch (err) {
      console.error('Failed to create combined audio stream:', err)
      return null
    }
  }, [callObject])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (callObject) {
        callObject.leave()
        callObject.destroy()
      }
      // Clean up audio sources
      audioSourcesRef.current.forEach(source => {
        try { source.disconnect() } catch { /* ignore */ }
      })
      audioSourcesRef.current = []
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
    }
  }, [callObject])

  return {
    callObject,
    isJoining,
    isInCall,
    localParticipant,
    remoteParticipants,
    isAudioEnabled,
    isVideoEnabled,
    isRecording,
    error,
    localVideoRef: localVideoRef as React.RefObject<HTMLVideoElement>,
    joinCall,
    leaveCall,
    toggleAudio,
    toggleVideo,
    startRecording,
    stopRecording,
    getCombinedAudioStream,
  }
}
