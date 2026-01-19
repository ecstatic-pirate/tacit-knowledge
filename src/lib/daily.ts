// Daily.co API integration for video calls
// Docs: https://docs.daily.co/reference/rest-api

const DAILY_API_KEY = process.env.DAILY_API_KEY
const DAILY_API_URL = 'https://api.daily.co/v1'

export interface DailyRoom {
  id: string
  name: string
  url: string
  created_at: string
  config: {
    enable_recording?: string
    enable_chat?: boolean
    start_video_off?: boolean
    start_audio_off?: boolean
  }
}

export interface CreateRoomOptions {
  /** Unique name for the room (will be part of URL) */
  name?: string
  /** Room expires after this many seconds. If not set, room is permanent. */
  expirySeconds?: number
  /** Enable cloud recording */
  enableRecording?: boolean
  /** Max participants (default: 2 for interviews) */
  maxParticipants?: number
}

export interface DailyMeetingToken {
  token: string
}

export interface CreateTokenOptions {
  roomName: string
  /** User's display name in the call */
  userName: string
  /** Is this the room owner/interviewer? */
  isOwner?: boolean
  /** Token expires after this many seconds */
  expirySeconds?: number
}

/**
 * Create a Daily.co room for an interview session
 */
export async function createRoom(options: CreateRoomOptions = {}): Promise<DailyRoom> {
  if (!DAILY_API_KEY) {
    throw new Error('DAILY_API_KEY environment variable is not set')
  }

  const {
    name,
    expirySeconds, // If not set, room is permanent
    enableRecording = true,
    maxParticipants = 2,
  } = options

  // Generate a unique room name if not provided
  const roomName = name || `interview-${Date.now()}-${Math.random().toString(36).substring(7)}`

  const response = await fetch(`${DAILY_API_URL}/rooms`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${DAILY_API_KEY}`,
    },
    body: JSON.stringify({
      name: roomName,
      privacy: 'private', // Require token to join
      properties: {
        // Only set exp if expirySeconds is provided; otherwise room is permanent
        ...(expirySeconds !== undefined && { exp: Math.floor(Date.now() / 1000) + expirySeconds }),
        max_participants: maxParticipants,
        enable_chat: true,
        enable_screenshare: true,
        enable_recording: enableRecording ? 'cloud' : undefined,
        start_video_off: false,
        start_audio_off: false,
        // Enable transcription webhook (for Deepgram integration)
        enable_advanced_chat: false,
      },
    }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(`Failed to create Daily room: ${error.error || response.statusText}`)
  }

  return response.json()
}

/**
 * Create a meeting token for a participant
 * Tokens control permissions and identify users
 */
export async function createMeetingToken(options: CreateTokenOptions): Promise<DailyMeetingToken> {
  if (!DAILY_API_KEY) {
    throw new Error('DAILY_API_KEY environment variable is not set')
  }

  const {
    roomName,
    userName,
    isOwner = false,
    expirySeconds = 3600,
  } = options

  const response = await fetch(`${DAILY_API_URL}/meeting-tokens`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${DAILY_API_KEY}`,
    },
    body: JSON.stringify({
      properties: {
        room_name: roomName,
        user_name: userName,
        is_owner: isOwner,
        exp: Math.floor(Date.now() / 1000) + expirySeconds,
        enable_recording: isOwner ? 'cloud' : undefined,
        start_cloud_recording: isOwner, // Auto-start recording for interviewers
      },
    }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(`Failed to create meeting token: ${error.error || response.statusText}`)
  }

  return response.json()
}

/**
 * Get room details by name
 */
export async function getRoom(roomName: string): Promise<DailyRoom | null> {
  if (!DAILY_API_KEY) {
    throw new Error('DAILY_API_KEY environment variable is not set')
  }

  const response = await fetch(`${DAILY_API_URL}/rooms/${roomName}`, {
    headers: {
      'Authorization': `Bearer ${DAILY_API_KEY}`,
    },
  })

  if (response.status === 404) {
    return null
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(`Failed to get room: ${error.error || response.statusText}`)
  }

  return response.json()
}

/**
 * Delete a room
 */
export async function deleteRoom(roomName: string): Promise<void> {
  if (!DAILY_API_KEY) {
    throw new Error('DAILY_API_KEY environment variable is not set')
  }

  const response = await fetch(`${DAILY_API_URL}/rooms/${roomName}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${DAILY_API_KEY}`,
    },
  })

  if (!response.ok && response.status !== 404) {
    const error = await response.json().catch(() => ({}))
    throw new Error(`Failed to delete room: ${error.error || response.statusText}`)
  }
}

/**
 * Start cloud recording for a room
 */
export async function startRecording(roomName: string): Promise<void> {
  if (!DAILY_API_KEY) {
    throw new Error('DAILY_API_KEY environment variable is not set')
  }

  const response = await fetch(`${DAILY_API_URL}/rooms/${roomName}/recordings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${DAILY_API_KEY}`,
    },
    body: JSON.stringify({
      // Default recording settings
    }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(`Failed to start recording: ${error.error || response.statusText}`)
  }
}

/**
 * Stop cloud recording for a room
 */
export async function stopRecording(roomName: string): Promise<void> {
  if (!DAILY_API_KEY) {
    throw new Error('DAILY_API_KEY environment variable is not set')
  }

  const response = await fetch(`${DAILY_API_URL}/rooms/${roomName}/recordings`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${DAILY_API_KEY}`,
    },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(`Failed to stop recording: ${error.error || response.statusText}`)
  }
}

/**
 * Get recordings for a room
 */
export async function getRecordings(roomName: string): Promise<{ recordings: Array<{ id: string; download_url: string }> }> {
  if (!DAILY_API_KEY) {
    throw new Error('DAILY_API_KEY environment variable is not set')
  }

  const response = await fetch(`${DAILY_API_URL}/recordings?room_name=${roomName}`, {
    headers: {
      'Authorization': `Bearer ${DAILY_API_KEY}`,
    },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(`Failed to get recordings: ${error.error || response.statusText}`)
  }

  return response.json()
}
