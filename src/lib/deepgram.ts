// Deepgram real-time transcription types and utilities
// Docs: https://developers.deepgram.com/docs/getting-started-with-live-streaming-audio

export interface DeepgramWord {
  word: string
  start: number
  end: number
  confidence: number
  speaker?: number
  punctuated_word?: string
}

export interface DeepgramAlternative {
  transcript: string
  confidence: number
  words: DeepgramWord[]
}

export interface DeepgramChannel {
  alternatives: DeepgramAlternative[]
}

export interface DeepgramTranscriptResponse {
  type: 'Results'
  channel_index: number[]
  duration: number
  start: number
  is_final: boolean
  speech_final: boolean
  channel: DeepgramChannel
}

export interface DeepgramMetadataResponse {
  type: 'Metadata'
  transaction_key: string
  request_id: string
  sha256: string
  created: string
  duration: number
  channels: number
  models: string[]
}

export interface DeepgramSpeechStartedResponse {
  type: 'SpeechStarted'
  channel: number[]
  timestamp: number
}

export interface DeepgramUtteranceEndResponse {
  type: 'UtteranceEnd'
  channel: number[]
  last_word_end: number
}

export type DeepgramResponse =
  | DeepgramTranscriptResponse
  | DeepgramMetadataResponse
  | DeepgramSpeechStartedResponse
  | DeepgramUtteranceEndResponse

export interface TranscriptSegment {
  id: string
  text: string
  speaker: number | null
  startTime: number
  endTime: number
  confidence: number
  isFinal: boolean
  words: DeepgramWord[]
}

/**
 * Build Deepgram WebSocket URL with query parameters
 */
export function buildDeepgramUrl(apiKey: string): string {
  const params = new URLSearchParams({
    model: 'nova-2', // Best model for English
    language: 'en',
    smart_format: 'true', // Auto punctuation and formatting
    diarize: 'true', // Speaker identification
    punctuate: 'true',
    interim_results: 'true', // Get results while speaking
    utterance_end_ms: '1500', // Detect end of utterance after 1.5s silence
    vad_events: 'true', // Voice activity detection events
    encoding: 'linear16',
    sample_rate: '16000',
  })

  return `wss://api.deepgram.com/v1/listen?${params.toString()}`
}

/**
 * Parse Deepgram response and extract transcript segment
 */
export function parseTranscriptResponse(response: DeepgramTranscriptResponse): TranscriptSegment | null {
  const channel = response.channel
  if (!channel?.alternatives?.[0]) return null

  const alternative = channel.alternatives[0]
  if (!alternative.transcript?.trim()) return null

  // Determine speaker from words (most common speaker)
  const speakerCounts: Record<number, number> = {}
  alternative.words?.forEach(word => {
    if (word.speaker !== undefined) {
      speakerCounts[word.speaker] = (speakerCounts[word.speaker] || 0) + 1
    }
  })

  const speaker = Object.entries(speakerCounts).length > 0
    ? parseInt(Object.entries(speakerCounts).sort((a, b) => b[1] - a[1])[0][0])
    : null

  return {
    id: `${response.start}-${Date.now()}`,
    text: alternative.transcript.trim(),
    speaker,
    startTime: response.start,
    endTime: response.start + response.duration,
    confidence: alternative.confidence,
    isFinal: response.is_final,
    words: alternative.words || [],
  }
}

/**
 * Convert speaker number to display name
 */
export function getSpeakerName(speaker: number | null, speakerMap?: Record<number, string>): string {
  if (speaker === null) return 'Unknown'
  if (speakerMap && speakerMap[speaker]) return speakerMap[speaker]
  return `Speaker ${speaker + 1}`
}
