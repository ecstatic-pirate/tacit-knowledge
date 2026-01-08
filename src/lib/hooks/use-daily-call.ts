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
  isScreenSharing: boolean
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
  startScreenShare: () => Promise<void>
  stopScreenShare: () => void

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
  const [isAudioEnabled, setIsAudioEnabled] = useState(false)
  const [isVideoEnabled, setIsVideoEnabled] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const localVideoRef = useRef<HTMLVideoElement>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const combinedStreamRef = useRef<MediaStream | null>(null)
  const audioSourcesRef = useRef<MediaStreamAudioSourceNode[]>([])
  const callObjectRef = useRef<DailyCall | null>(null)
  const isJoiningRef = useRef(false)

  // Update participants from call object
  const updateParticipants = useCallback((call: DailyCall) => {
    const participants = call.participants()
    const local = participants.local
    const remote = Object.values(participants).filter(p => !p.local)

    setLocalParticipant(local)
    setRemoteParticipants(remote)
    // Use strict equality to ensure we only show as enabled when explicitly true
    setIsAudioEnabled(local.audio === true)
    setIsVideoEnabled(local.video === true)
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
    // Prevent duplicate join attempts
    if (isJoiningRef.current) {
      console.log('[useDailyCall] Already joining, skipping duplicate call')
      return
    }

    try {
      isJoiningRef.current = true
      setIsJoining(true)
      setError(null)

      // Clean up any existing call object first
      if (callObjectRef.current) {
        console.log('[useDailyCall] Destroying existing call object before creating new one')
        try {
          await callObjectRef.current.leave()
        } catch { /* ignore leave errors */ }
        callObjectRef.current.destroy()
        callObjectRef.current = null
        setCallObject(null)
      }

      // Create call object
      const call = DailyIframe.createCallObject({
        audioSource: true,
        videoSource: true,
      })

      // Store ref immediately to prevent duplicates
      callObjectRef.current = call

      // Set up event listeners
      call.on('joined-meeting', async () => {
        setIsInCall(true)
        setIsJoining(false)
        isJoiningRef.current = false

        // Explicitly enable audio and video after joining
        try {
          await call.setLocalAudio(true)
          await call.setLocalVideo(true)
        } catch (err) {
          console.warn('[useDailyCall] Failed to enable media:', err)
        }

        // Small delay to let media tracks initialize
        setTimeout(() => {
          updateParticipants(call)
          setupLocalVideo(call)
        }, 500)
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

      // Screen share events
      call.on('local-screen-share-started', () => {
        setIsScreenSharing(true)
      })

      call.on('local-screen-share-stopped', () => {
        setIsScreenSharing(false)
      })

      call.on('local-screen-share-canceled', () => {
        setIsScreenSharing(false)
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
      isJoiningRef.current = false
      // Clean up on error
      if (callObjectRef.current) {
        callObjectRef.current.destroy()
        callObjectRef.current = null
      }
      onError?.(err instanceof Error ? err : new Error(errorMsg))
    }
  }, [onAudioTrack, onParticipantJoined, onParticipantLeft, onError, updateParticipants, setupLocalVideo])

  // Leave the call
  const leaveCall = useCallback(async () => {
    const call = callObjectRef.current
    if (call) {
      try {
        await call.leave()
      } catch { /* ignore */ }
      call.destroy()
      callObjectRef.current = null
      setCallObject(null)
      setIsInCall(false)
      isJoiningRef.current = false

      // Clean up audio context
      if (audioContextRef.current) {
        audioContextRef.current.close()
        audioContextRef.current = null
      }
      combinedStreamRef.current = null
    }
  }, [])

  // Toggle local audio
  const toggleAudio = useCallback(() => {
    const call = callObjectRef.current
    if (call) {
      const newState = !isAudioEnabled
      call.setLocalAudio(newState)
      setIsAudioEnabled(newState)
    }
  }, [isAudioEnabled])

  // Toggle local video
  const toggleVideo = useCallback(() => {
    const call = callObjectRef.current
    if (call) {
      const newState = !isVideoEnabled
      call.setLocalVideo(newState)
      setIsVideoEnabled(newState)
    }
  }, [isVideoEnabled])

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

  // Start screen sharing
  const startScreenShare = useCallback(async () => {
    const call = callObjectRef.current
    if (call) {
      try {
        await call.startScreenShare()
      } catch (err) {
        console.error('[useDailyCall] Failed to start screen share:', err)
        // Don't set error state - user may have just cancelled the dialog
      }
    } else {
      console.warn('[useDailyCall] Cannot start screen share - no call object')
    }
  }, [])

  // Stop screen sharing
  const stopScreenShare = useCallback(() => {
    const call = callObjectRef.current
    if (call) {
      call.stopScreenShare()
    }
  }, [])

  // Get combined audio stream from all participants (for Deepgram)
  const getCombinedAudioStream = useCallback((): MediaStream | null => {
    const call = callObjectRef.current
    if (!call) return null

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

      const participants = call.participants()
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
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      const call = callObjectRef.current
      if (call) {
        console.log('[useDailyCall] Cleanup: destroying call object on unmount')
        try {
          call.leave()
        } catch { /* ignore */ }
        call.destroy()
        callObjectRef.current = null
      }
      isJoiningRef.current = false
      // Clean up audio sources
      audioSourcesRef.current.forEach(source => {
        try { source.disconnect() } catch { /* ignore */ }
      })
      audioSourcesRef.current = []
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
    }
  }, []) // Empty deps - only run on unmount

  return {
    callObject,
    isJoining,
    isInCall,
    localParticipant,
    remoteParticipants,
    isAudioEnabled,
    isVideoEnabled,
    isRecording,
    isScreenSharing,
    error,
    localVideoRef: localVideoRef as React.RefObject<HTMLVideoElement>,
    joinCall,
    leaveCall,
    toggleAudio,
    toggleVideo,
    startRecording,
    stopRecording,
    startScreenShare,
    stopScreenShare,
    getCombinedAudioStream,
  }
}
