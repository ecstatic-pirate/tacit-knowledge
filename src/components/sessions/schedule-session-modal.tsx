'use client'

import { useState } from 'react'
import { CircleNotch, CalendarBlank, EnvelopeSimple, User } from 'phosphor-react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/toast'

interface ScheduleSessionModalProps {
  isOpen: boolean
  onClose: () => void
  session: {
    id: string
    sessionNumber: number
    title?: string
    durationMinutes: number
  }
  onScheduled: () => void
}

export function ScheduleSessionModal({
  isOpen,
  onClose,
  session,
  onScheduled,
}: ScheduleSessionModalProps) {
  const { showToast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    date: '',
    time: '',
    interviewerName: '',
    interviewerEmail: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.date || !formData.time) {
      showToast('Please select a date and time', 'error')
      return
    }

    if (!formData.interviewerEmail) {
      showToast('Please enter the interviewer email', 'error')
      return
    }

    setIsSubmitting(true)

    try {
      // Combine date and time into ISO string
      const scheduledAt = new Date(`${formData.date}T${formData.time}`).toISOString()

      const response = await fetch(`/api/sessions/${session.id}/schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scheduledAt,
          interviewerName: formData.interviewerName,
          interviewerEmail: formData.interviewerEmail,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to schedule session')
      }

      const result = await response.json()

      // Show success message with email status
      let message = 'Session scheduled!'
      if (result.emailResults) {
        const sentCount = [
          result.emailResults.interviewer?.sent,
          result.emailResults.expert?.sent,
        ].filter(Boolean).length
        if (sentCount > 0) {
          message += ` ${sentCount} invite${sentCount > 1 ? 's' : ''} sent.`
        }
      }
      showToast(message)

      // Reset form and close
      setFormData({ date: '', time: '', interviewerName: '', interviewerEmail: '' })
      onClose()
      onScheduled()
    } catch (error) {
      console.error('Error scheduling session:', error)
      showToast(error instanceof Error ? error.message : 'Failed to schedule session', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Get minimum date (today)
  const today = new Date().toISOString().split('T')[0]

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Schedule ${session.title || `Session ${session.sessionNumber}`}`}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-muted-foreground mb-4">
          Set a date and time for this {session.durationMinutes}-minute session. Calendar invites will be sent to both the interviewer and expert.
        </p>

        {/* Date and Time */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium mb-1.5 block flex items-center gap-1.5">
              <CalendarBlank className="w-4 h-4 text-muted-foreground" />
              Date
            </label>
            <Input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
              min={today}
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Time</label>
            <Input
              type="time"
              value={formData.time}
              onChange={(e) => setFormData((prev) => ({ ...prev, time: e.target.value }))}
              required
            />
          </div>
        </div>

        {/* Interviewer Info */}
        <div className="pt-2 border-t">
          <h3 className="text-sm font-medium mb-3 flex items-center gap-1.5">
            <User className="w-4 h-4 text-muted-foreground" />
            Interviewer Details
          </h3>
          <div className="space-y-3">
            <div>
              <label className="text-sm text-muted-foreground mb-1.5 block">Name (optional)</label>
              <Input
                type="text"
                value={formData.interviewerName}
                onChange={(e) => setFormData((prev) => ({ ...prev, interviewerName: e.target.value }))}
                placeholder="Interviewer's name"
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1.5 block flex items-center gap-1.5">
                <EnvelopeSimple className="w-3.5 h-3.5" />
                Email
              </label>
              <Input
                type="email"
                value={formData.interviewerEmail}
                onChange={(e) => setFormData((prev) => ({ ...prev, interviewerEmail: e.target.value }))}
                placeholder="interviewer@example.com"
                required
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <CircleNotch className="w-4 h-4 mr-2 animate-spin" weight="bold" />
                Scheduling...
              </>
            ) : (
              <>
                <CalendarBlank className="w-4 h-4 mr-2" weight="bold" />
                Schedule & Send Invites
              </>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
