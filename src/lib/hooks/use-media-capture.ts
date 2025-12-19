'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

// Web Speech API type declarations
interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number
  readonly results: SpeechRecognitionResultList
}

interface SpeechRecognitionResultList {
  readonly length: number
  item(index: number): SpeechRecognitionResult
  [index: number]: SpeechRecognitionResult
}

interface SpeechRecognitionResult {
  readonly isFinal: boolean
  readonly length: number
  item(index: number): SpeechRecognitionAlternative
  [index: number]: SpeechRecognitionAlternative
}

interface SpeechRecognitionAlternative {
  readonly transcript: string
  readonly confidence: number
}

interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string
  readonly message: string
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  onstart: ((this: SpeechRecognitionInstance, ev: Event) => void) | null
  onresult: ((this: SpeechRecognitionInstance, ev: SpeechRecognitionEvent) => void) | null
  onerror: ((this: SpeechRecognitionInstance, ev: SpeechRecognitionErrorEvent) => void) | null
  onend: ((this: SpeechRecognitionInstance, ev: Event) => void) | null
  start(): void
  stop(): void
  abort(): void
}

interface SpeechRecognitionConstructor {
  new(): SpeechRecognitionInstance
}

export interface TranscriptLine {
  id: string
  speaker: string
  text: string
  timestampSeconds: number
  isFinal: boolean
  confidence?: number
}

export interface UseMediaCaptureReturn {
  // Media state
  isMediaReady: boolean
  isVideoOn: boolean
  isAudioOn: boolean
  localVideoRef: React.RefObject<HTMLVideoElement>
  mediaError: string | null

  // Transcription state
  isTranscribing: boolean
  transcriptLines: TranscriptLine[]
  currentInterim: string

  // Actions
  startMedia: () => Promise<void>
  stopMedia: () => void
  toggleVideo: () => void
  toggleAudio: () => void
  startTranscription: () => void
  stopTranscription: () => void
  clearTranscript: () => void
}

// Check if browser supports speech recognition
const getSpeechRecognition = (): SpeechRecognitionConstructor | null => {
  if (typeof window === 'undefined') return null

  const win = window as Window & {
    SpeechRecognition?: SpeechRecognitionConstructor
    webkitSpeechRecognition?: SpeechRecognitionConstructor
  }

  return win.SpeechRecognition || win.webkitSpeechRecognition || null
}

export function useMediaCapture(
  onTranscriptLine?: (line: TranscriptLine) => void
): UseMediaCaptureReturn {
  const [isMediaReady, setIsMediaReady] = useState(false)
  const [isVideoOn, setIsVideoOn] = useState(false)
  const [isAudioOn, setIsAudioOn] = useState(false)
  const [mediaError, setMediaError] = useState<string | null>(null)

  const [isTranscribing, setIsTranscribing] = useState(false)
  const [transcriptLines, setTranscriptLines] = useState<TranscriptLine[]>([])
  const [currentInterim, setCurrentInterim] = useState('')

  const localVideoRef = useRef<HTMLVideoElement>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null)
  const startTimeRef = useRef<number>(0)
  const lineIdRef = useRef(0)

  // Start media (camera + microphone)
  const startMedia = useCallback(async () => {
    try {
      setMediaError(null)

      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      })

      mediaStreamRef.current = stream

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream
      }

      setIsVideoOn(true)
      setIsAudioOn(true)
      setIsMediaReady(true)
      startTimeRef.current = Date.now()
    } catch (err) {
      console.error('Error accessing media devices:', err)
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError') {
          setMediaError('Camera/microphone access denied. Please allow access in your browser settings.')
        } else if (err.name === 'NotFoundError') {
          setMediaError('No camera or microphone found. Please connect a device.')
        } else {
          setMediaError(`Failed to access media: ${err.message}`)
        }
      }
    }
  }, [])

  // Stop media
  const stopMedia = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop())
      mediaStreamRef.current = null
    }

    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null
    }

    setIsMediaReady(false)
    setIsVideoOn(false)
    setIsAudioOn(false)
    stopTranscription()
  }, [])

  // Toggle video
  const toggleVideo = useCallback(() => {
    if (mediaStreamRef.current) {
      const videoTrack = mediaStreamRef.current.getVideoTracks()[0]
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled
        setIsVideoOn(videoTrack.enabled)
      }
    }
  }, [])

  // Toggle audio
  const toggleAudio = useCallback(() => {
    if (mediaStreamRef.current) {
      const audioTrack = mediaStreamRef.current.getAudioTracks()[0]
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled
        setIsAudioOn(audioTrack.enabled)
      }
    }
  }, [])

  // Start speech recognition
  const startTranscription = useCallback(() => {
    const SpeechRecognitionClass = getSpeechRecognition()

    if (!SpeechRecognitionClass) {
      setMediaError('Speech recognition is not supported in this browser. Please use Chrome or Edge.')
      return
    }

    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }

    const recognition = new SpeechRecognitionClass()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'

    recognition.onstart = () => {
      setIsTranscribing(true)
      setMediaError(null)
    }

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimTranscript = ''

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        const transcript = result[0].transcript

        if (result.isFinal) {
          const timestampSeconds = Math.floor((Date.now() - startTimeRef.current) / 1000)
          const newLine: TranscriptLine = {
            id: `line-${++lineIdRef.current}`,
            speaker: 'You', // Default to 'You' - in a real app, would use speaker diarization
            text: transcript.trim(),
            timestampSeconds,
            isFinal: true,
            confidence: result[0].confidence,
          }

          setTranscriptLines(prev => [...prev, newLine])
          setCurrentInterim('')

          // Callback for saving to database
          if (onTranscriptLine) {
            onTranscriptLine(newLine)
          }
        } else {
          interimTranscript += transcript
        }
      }

      if (interimTranscript) {
        setCurrentInterim(interimTranscript)
      }
    }

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error)
      if (event.error === 'not-allowed') {
        setMediaError('Microphone access denied for speech recognition.')
      } else if (event.error !== 'no-speech') {
        // no-speech is common and not an error
        setMediaError(`Speech recognition error: ${event.error}`)
      }
    }

    recognition.onend = () => {
      // Auto-restart if still transcribing
      if (isTranscribing && recognitionRef.current) {
        try {
          recognitionRef.current.start()
        } catch {
          // Ignore if already started
        }
      }
    }

    recognitionRef.current = recognition

    try {
      recognition.start()
    } catch (err) {
      console.error('Failed to start speech recognition:', err)
    }
  }, [isTranscribing, onTranscriptLine])

  // Stop transcription
  const stopTranscription = useCallback(() => {
    setIsTranscribing(false)
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      recognitionRef.current = null
    }
    setCurrentInterim('')
  }, [])

  // Clear transcript
  const clearTranscript = useCallback(() => {
    setTranscriptLines([])
    setCurrentInterim('')
    lineIdRef.current = 0
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopMedia()
    }
  }, [stopMedia])

  return {
    isMediaReady,
    isVideoOn,
    isAudioOn,
    localVideoRef: localVideoRef as React.RefObject<HTMLVideoElement>,
    mediaError,
    isTranscribing,
    transcriptLines,
    currentInterim,
    startMedia,
    stopMedia,
    toggleVideo,
    toggleAudio,
    startTranscription,
    stopTranscription,
    clearTranscript,
  }
}
