'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import {
  buildDeepgramUrl,
  parseTranscriptResponse,
  getSpeakerName,
  TranscriptSegment,
  DeepgramResponse,
  DeepgramTranscriptResponse,
} from '@/lib/deepgram'

export interface TranscriptLine {
  id: string
  speaker: string
  text: string
  timestampSeconds: number
  isFinal: boolean
  confidence?: number
}

export interface UseRealtimeTranscriptionOptions {
  /** Deepgram API key (optional - transcription won't work without it) */
  apiKey?: string
  /** Map speaker numbers to names (e.g., { 0: 'Interviewer', 1: 'Expert' }) */
  speakerMap?: Record<number, string>
  /** Callback when a final transcript line is ready */
  onTranscriptLine?: (line: TranscriptLine) => void
  /** Callback when utterance ends (natural pause) - good time for AI processing */
  onUtteranceEnd?: (transcriptSoFar: TranscriptLine[]) => void
  /** Callback on errors */
  onError?: (error: Error) => void
}

export interface UseRealtimeTranscriptionReturn {
  // State
  isConnected: boolean
  isTranscribing: boolean
  transcriptLines: TranscriptLine[]
  currentInterim: string
  error: string | null

  // Actions
  startTranscription: (audioStream: MediaStream) => void
  stopTranscription: () => void
  clearTranscript: () => void
}

export function useRealtimeTranscription(
  options: UseRealtimeTranscriptionOptions
): UseRealtimeTranscriptionReturn {
  const { apiKey, speakerMap, onTranscriptLine, onUtteranceEnd, onError } = options

  const [isConnected, setIsConnected] = useState(false)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [transcriptLines, setTranscriptLines] = useState<TranscriptLine[]>([])
  const [currentInterim, setCurrentInterim] = useState('')
  const [error, setError] = useState<string | null>(null)

  const websocketRef = useRef<WebSocket | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const processorRef = useRef<ScriptProcessorNode | null>(null)
  const startTimeRef = useRef<number>(0)
  const lineIdRef = useRef(0)

  // Convert TranscriptSegment to TranscriptLine
  const segmentToLine = useCallback((segment: TranscriptSegment): TranscriptLine => {
    return {
      id: `line-${++lineIdRef.current}`,
      speaker: getSpeakerName(segment.speaker, speakerMap),
      text: segment.text,
      timestampSeconds: Math.floor(segment.startTime),
      isFinal: segment.isFinal,
      confidence: segment.confidence,
    }
  }, [speakerMap])

  // Start transcription with an audio stream
  const startTranscription = useCallback((audioStream: MediaStream) => {
    if (!apiKey) {
      const err = new Error('Deepgram API key is required')
      setError(err.message)
      onError?.(err)
      return
    }

    try {
      setError(null)
      startTimeRef.current = Date.now()

      // Create WebSocket connection to Deepgram
      const wsUrl = buildDeepgramUrl(apiKey)
      const ws = new WebSocket(wsUrl, ['token', apiKey])

      ws.onopen = () => {
        console.log('Deepgram WebSocket connected')
        setIsConnected(true)
        setIsTranscribing(true)

        // Set up audio processing
        const audioContext = new AudioContext({ sampleRate: 16000 })
        audioContextRef.current = audioContext

        const source = audioContext.createMediaStreamSource(audioStream)
        const processor = audioContext.createScriptProcessor(4096, 1, 1)
        processorRef.current = processor

        processor.onaudioprocess = (event) => {
          if (ws.readyState === WebSocket.OPEN) {
            const inputData = event.inputBuffer.getChannelData(0)
            // Convert float32 to int16
            const int16Data = new Int16Array(inputData.length)
            for (let i = 0; i < inputData.length; i++) {
              const s = Math.max(-1, Math.min(1, inputData[i]))
              int16Data[i] = s < 0 ? s * 0x8000 : s * 0x7fff
            }
            ws.send(int16Data.buffer)
          }
        }

        source.connect(processor)
        processor.connect(audioContext.destination)
      }

      ws.onmessage = (event) => {
        try {
          const response: DeepgramResponse = JSON.parse(event.data)

          if (response.type === 'Results') {
            const segment = parseTranscriptResponse(response as DeepgramTranscriptResponse)

            if (segment) {
              if (segment.isFinal) {
                // Final result - add to transcript
                const line = segmentToLine(segment)
                setTranscriptLines(prev => [...prev, line])
                setCurrentInterim('')
                onTranscriptLine?.(line)
              } else {
                // Interim result - show as current
                setCurrentInterim(segment.text)
              }
            }
          } else if (response.type === 'UtteranceEnd') {
            // Natural pause detected - good time for AI processing
            setTranscriptLines(prev => {
              onUtteranceEnd?.(prev)
              return prev
            })
          }
        } catch (err) {
          console.error('Error parsing Deepgram response:', err)
        }
      }

      ws.onerror = (event) => {
        console.error('Deepgram WebSocket error:', event)
        const err = new Error('Transcription connection error')
        setError(err.message)
        onError?.(err)
      }

      ws.onclose = (event) => {
        console.log('Deepgram WebSocket closed:', event.code, event.reason)
        setIsConnected(false)
        setIsTranscribing(false)

        // Clean up audio processing
        if (processorRef.current) {
          processorRef.current.disconnect()
          processorRef.current = null
        }
        if (audioContextRef.current) {
          audioContextRef.current.close()
          audioContextRef.current = null
        }
      }

      websocketRef.current = ws

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to start transcription'
      setError(errorMsg)
      onError?.(err instanceof Error ? err : new Error(errorMsg))
    }
  }, [apiKey, segmentToLine, onTranscriptLine, onUtteranceEnd, onError])

  // Stop transcription
  const stopTranscription = useCallback(() => {
    setIsTranscribing(false)

    // Close WebSocket
    if (websocketRef.current) {
      if (websocketRef.current.readyState === WebSocket.OPEN) {
        // Send close message to Deepgram
        websocketRef.current.send(JSON.stringify({ type: 'CloseStream' }))
      }
      websocketRef.current.close()
      websocketRef.current = null
    }

    // Stop media recorder
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop()
      mediaRecorderRef.current = null
    }

    // Clean up audio processing
    if (processorRef.current) {
      processorRef.current.disconnect()
      processorRef.current = null
    }
    if (audioContextRef.current) {
      audioContextRef.current.close()
      audioContextRef.current = null
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
      stopTranscription()
    }
  }, [stopTranscription])

  return {
    isConnected,
    isTranscribing,
    transcriptLines,
    currentInterim,
    error,
    startTranscription,
    stopTranscription,
    clearTranscript,
  }
}
