'use client'

import { useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { components, inputs } from '@/lib/design-system'
import { REGIONS, EXPERTISE_AREAS } from '@/lib/initiative-helpers'

interface ProfileSetupModalProps {
  isOpen: boolean
  onComplete: () => void
  userId: string
  defaultName?: string
}

type RoleType = 'builder' | 'management' | 'both'

const ROLE_OPTIONS: { value: RoleType; label: string; description: string }[] = [
  { value: 'builder', label: 'Builder', description: 'Hands-on with AI/ML projects' },
  { value: 'management', label: 'Management', description: 'Overseeing AI portfolio' },
  { value: 'both', label: 'Both', description: 'Building and managing' },
]

export function ProfileSetupModal({ isOpen, onComplete, userId, defaultName }: ProfileSetupModalProps) {
  const supabase = useMemo(() => createClient(), [])
  const [step, setStep] = useState<1 | 2>(1)
  const [saving, setSaving] = useState(false)

  // Step 1 fields
  const [name, setName] = useState(defaultName ?? '')
  const [roleType, setRoleType] = useState<RoleType>('builder')
  const [region, setRegion] = useState('')
  const [department, setDepartment] = useState('')

  // Step 2 fields
  const [selectedExpertise, setSelectedExpertise] = useState<string[]>([])
  const [otherExpertise, setOtherExpertise] = useState('')

  const canProceedStep1 = name.trim().length > 0 && roleType && region

  function toggleExpertise(area: string) {
    setSelectedExpertise((prev) =>
      prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area]
    )
  }

  async function handleSubmit() {
    setSaving(true)
    try {
      const expertiseAreas = [
        ...selectedExpertise,
        ...(otherExpertise.trim() ? [otherExpertise.trim()] : []),
      ]

      const { error } = await supabase.from('user_profiles').insert({
        user_id: userId,
        role_type: roleType,
        region,
        department: department.trim() || null,
        expertise_areas: expertiseAreas.length > 0 ? expertiseAreas : null,
      })

      if (error) {
        console.error('Failed to save profile:', error)
        setSaving(false)
        return
      }

      // Also update user name if changed
      if (name.trim() !== (defaultName ?? '')) {
        await supabase
          .from('users')
          .update({ full_name: name.trim() })
          .eq('id', userId)
      }

      onComplete()
    } catch (err) {
      console.error('Profile save error:', err)
      setSaving(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={() => {}} title={step === 1 ? 'Welcome — Set Up Your Profile' : 'Select Your Expertise'}>
      {step === 1 && (
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-1.5">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your full name"
              className={inputs.textInput}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Role</label>
            <div className="space-y-2">
              {ROLE_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    roleType === opt.value
                      ? 'border-foreground bg-secondary/50'
                      : 'border-border hover:border-foreground/20'
                  }`}
                >
                  <input
                    type="radio"
                    name="roleType"
                    value={opt.value}
                    checked={roleType === opt.value}
                    onChange={() => setRoleType(opt.value)}
                    className="accent-foreground"
                  />
                  <div>
                    <p className="text-sm font-medium">{opt.label}</p>
                    <p className="text-xs text-muted-foreground">{opt.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Region</label>
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className={inputs.textInput}
            >
              <option value="">Select region...</option>
              {REGIONS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Department</label>
            <input
              type="text"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder="e.g. AI/ML Platform"
              className={inputs.textInput}
            />
          </div>

          <div className="flex justify-end pt-2">
            <Button onClick={() => setStep(2)} disabled={!canProceedStep1}>
              Next
            </Button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-2">Areas of Expertise</label>
            <p className="text-xs text-muted-foreground mb-3">Select all that apply.</p>
            <div className="grid grid-cols-2 gap-2">
              {EXPERTISE_AREAS.map((area) => (
                <label
                  key={area}
                  className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer text-sm transition-colors ${
                    selectedExpertise.includes(area)
                      ? 'border-foreground bg-secondary/50'
                      : 'border-border hover:border-foreground/20'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedExpertise.includes(area)}
                    onChange={() => toggleExpertise(area)}
                    className="accent-foreground"
                  />
                  {area}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Other</label>
            <input
              type="text"
              value={otherExpertise}
              onChange={(e) => setOtherExpertise(e.target.value)}
              placeholder="Additional expertise..."
              className={inputs.textInput}
            />
          </div>

          <div className="flex justify-between pt-2">
            <Button variant="ghost" onClick={() => setStep(1)}>
              Back
            </Button>
            <Button onClick={handleSubmit} disabled={saving}>
              {saving ? 'Saving...' : 'Complete Setup'}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  )
}
