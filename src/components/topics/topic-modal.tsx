'use client'

import { useState, useEffect } from 'react'
import { CircleNotch } from 'phosphor-react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'

interface TopicFormData {
  name: string
  category: string
  suggested_by: string
}

interface TopicModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: TopicFormData) => Promise<void>
  topic?: {
    id: string
    name: string
    category: string | null
    suggested_by: string | null
  } | null
}

const categoryOptions = [
  { value: '', label: 'No category' },
  { value: 'process', label: 'Process' },
  { value: 'technical', label: 'Technical' },
  { value: 'people', label: 'People & Relationships' },
  { value: 'strategy', label: 'Strategy' },
  { value: 'operations', label: 'Operations' },
  { value: 'other', label: 'Other' },
]

export function TopicModal({
  isOpen,
  onClose,
  onSave,
  topic,
}: TopicModalProps) {
  const [formData, setFormData] = useState<TopicFormData>({
    name: '',
    category: '',
    suggested_by: '',
  })
  const [saving, setSaving] = useState(false)

  // Reset form when modal opens/closes or topic changes
  useEffect(() => {
    if (isOpen) {
      if (topic) {
        setFormData({
          name: topic.name || '',
          category: topic.category || '',
          suggested_by: topic.suggested_by || '',
        })
      } else {
        setFormData({
          name: '',
          category: '',
          suggested_by: '',
        })
      }
    }
  }, [isOpen, topic])

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

  const isEditing = !!topic

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Topic' : 'Add Topic'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-1 block">
            Topic Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, name: e.target.value }))
            }
            className="w-full px-3 py-2 border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20"
            placeholder="e.g., Vendor relationships, Deployment process"
            required
          />
        </div>

        <div>
          <label className="text-sm font-medium mb-1 block">Category</label>
          <select
            value={formData.category}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, category: e.target.value }))
            }
            className="w-full px-3 py-2 border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20"
          >
            {categoryOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-medium mb-1 block">Suggested By</label>
          <input
            type="text"
            value={formData.suggested_by}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, suggested_by: e.target.value }))
            }
            className="w-full px-3 py-2 border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20"
            placeholder="e.g., Manager, Self-assessment, Collaborator"
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
            {isEditing ? 'Save Changes' : 'Add Topic'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
