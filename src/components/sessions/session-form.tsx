'use client'

import { useState, useMemo } from 'react'
import {
  Plus,
  CircleNotch,
  WarningCircle,
} from 'phosphor-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createClient } from '@/lib/supabase/client'

interface SessionFormProps {
  campaignId: string
  nextSessionNumber: number
  onSessionCreated?: () => void
}

export function SessionForm({
  campaignId,
  nextSessionNumber,
  onSessionCreated,
}: SessionFormProps) {
  const [isCreating, setIsCreating] = useState(false)
  const [sessionName, setSessionName] = useState('')
  const [sessionDate, setSessionDate] = useState('')
  const [error, setError] = useState<string | null>(null)

  const supabase = useMemo(() => createClient(), [])

  const handleCreateSession = async () => {
    if (!sessionName.trim()) {
      setError('Please enter a session name')
      return
    }

    setIsCreating(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()

      const { error: createError } = await supabase
        .from('sessions')
        .insert({
          campaign_id: campaignId,
          session_number: nextSessionNumber,
          title: sessionName.trim(),
          scheduled_at: sessionDate ? new Date(`${sessionDate}T09:00:00`).toISOString() : null,
          duration_minutes: 60,
          status: 'scheduled',
          topics: [], // Will be AI-generated later
          created_by: user?.id,
        })
        .select()
        .single()

      if (createError) {
        throw new Error(createError.message)
      }

      // Reset form
      setSessionName('')
      setSessionDate('')

      onSessionCreated?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create session')
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="flex items-end gap-3">
      {/* Error display */}
      {error && (
        <div className="absolute -top-10 left-0 right-0 p-2 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
          <WarningCircle className="w-4 h-4" weight="bold" />
          {error}
        </div>
      )}

      {/* Session Name */}
      <div className="flex-1">
        <label className="block text-sm font-medium text-neutral-700 mb-1">
          Session Name
        </label>
        <Input
          type="text"
          placeholder={`e.g., Session ${nextSessionNumber}: Core Processes`}
          value={sessionName}
          onChange={(e) => setSessionName(e.target.value)}
        />
      </div>

      {/* Date (optional) */}
      <div className="w-44">
        <label className="block text-sm font-medium text-neutral-700 mb-1">
          Date <span className="text-neutral-400 font-normal">(optional)</span>
        </label>
        <Input
          type="date"
          value={sessionDate}
          onChange={(e) => setSessionDate(e.target.value)}
          min={new Date().toISOString().split('T')[0]}
        />
      </div>

      {/* Add Button */}
      <Button onClick={handleCreateSession} disabled={isCreating}>
        {isCreating ? (
          <>
            <CircleNotch className="w-4 h-4 mr-2 animate-spin" weight="bold" />
            Adding...
          </>
        ) : (
          <>
            <Plus className="w-4 h-4 mr-2" weight="bold" />
            Add Session
          </>
        )}
      </Button>
    </div>
  )
}
