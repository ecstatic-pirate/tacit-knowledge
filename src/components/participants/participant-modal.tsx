'use client'

import { useState, useEffect } from 'react'
import { CircleNotch } from 'phosphor-react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import type { Participant, ParticipantStatus } from '@/lib/supabase/database.types'

interface ParticipantFormData {
  name: string
  email: string
  role: string
  team: string
  status: ParticipantStatus
  notes: string
}

interface ParticipantModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: ParticipantFormData) => Promise<void>
  participant?: Participant | null
}

const statusOptions: { value: ParticipantStatus; label: string }[] = [
  { value: 'not_interviewed', label: 'Not Interviewed' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'complete', label: 'Complete' },
]

export function ParticipantModal({
  isOpen,
  onClose,
  onSave,
  participant,
}: ParticipantModalProps) {
  const [formData, setFormData] = useState<ParticipantFormData>({
    name: '',
    email: '',
    role: '',
    team: '',
    status: 'not_interviewed',
    notes: '',
  })
  const [saving, setSaving] = useState(false)

  // Reset form when modal opens/closes or participant changes
  useEffect(() => {
    if (isOpen) {
      if (participant) {
        setFormData({
          name: participant.name || '',
          email: participant.email || '',
          role: participant.role || '',
          team: participant.team || '',
          status: (participant.status as ParticipantStatus) || 'not_interviewed',
          notes: participant.notes || '',
        })
      } else {
        setFormData({
          name: '',
          email: '',
          role: '',
          team: '',
          status: 'not_interviewed',
          notes: '',
        })
      }
    }
  }, [isOpen, participant])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) return

    setSaving(true)
    try {
      await onSave(formData)
      onClose()
    } finally {
      setSaving(false)
    }
  }

  const isEditing = !!participant

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Participant' : 'Add Participant'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-1 block">
            Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, name: e.target.value }))
            }
            className="w-full px-3 py-2 border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20"
            placeholder="Full name"
            required
          />
        </div>

        <div>
          <label className="text-sm font-medium mb-1 block">Email</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, email: e.target.value }))
            }
            className="w-full px-3 py-2 border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20"
            placeholder="email@example.com"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Role</label>
            <input
              type="text"
              value={formData.role}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, role: e.target.value }))
              }
              className="w-full px-3 py-2 border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20"
              placeholder="e.g., Developer, PM"
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">Team</label>
            <input
              type="text"
              value={formData.team}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, team: e.target.value }))
              }
              className="w-full px-3 py-2 border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20"
              placeholder="e.g., Engineering"
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium mb-1 block">
            Interview Status
          </label>
          <select
            value={formData.status}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                status: e.target.value as ParticipantStatus,
              }))
            }
            className="w-full px-3 py-2 border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20"
          >
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-medium mb-1 block">Notes</label>
          <textarea
            value={formData.notes}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, notes: e.target.value }))
            }
            className="w-full px-3 py-2 border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20 resize-none"
            placeholder="Any notes about this participant..."
            rows={3}
          />
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving || !formData.name.trim()}>
            {saving ? (
              <CircleNotch className="w-4 h-4 mr-2 animate-spin" weight="bold" />
            ) : null}
            {isEditing ? 'Save Changes' : 'Add Participant'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
