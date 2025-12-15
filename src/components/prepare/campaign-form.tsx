'use client'

import { useState } from 'react'
import { User, Briefcase, Building2, Clock, Target, Sparkles, Loader2, Mail } from 'lucide-react'
import { Input, Textarea } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface CampaignFormProps {
  onSubmit: (data: CampaignFormData) => void
  isSubmitting?: boolean
}

export interface CampaignFormData {
  name: string
  role: string
  department: string
  yearsExperience: number
  goal: string
  skills: string
  captureMode: 'human_led' | 'ai_guided' | 'hybrid'
  expertEmail?: string
}

type CaptureMode = 'human_led' | 'ai_guided' | 'hybrid'

const captureModeOptions: Array<{
  id: CaptureMode
  label: string
  description: string
}> = [
  {
    id: 'human_led',
    label: 'Human-Led',
    description: 'Expert interviewer conducts all sessions',
  },
  {
    id: 'ai_guided',
    label: 'AI-Guided',
    description: 'Your team leads with AI guidance & support',
  },
  {
    id: 'hybrid',
    label: 'Hybrid',
    description: 'Combination of human experts & AI assistance',
  },
]

export function CampaignForm({ onSubmit, isSubmitting = false }: CampaignFormProps) {
  const [formData, setFormData] = useState<CampaignFormData>({
    name: '',
    role: '',
    department: '',
    yearsExperience: 0,
    goal: '',
    skills: '',
    captureMode: 'hybrid',
    expertEmail: '',
  })

  const [errors, setErrors] = useState<Partial<Record<keyof CampaignFormData, string>>>({})

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof CampaignFormData, string>> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required'
    }
    if (!formData.role.trim()) {
      newErrors.role = 'Role is required'
    }
    if (formData.expertEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.expertEmail)) {
      newErrors.expertEmail = 'Invalid email format'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validate()) {
      onSubmit(formData)
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-neutral-200/80 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-neutral-100 bg-gradient-to-r from-primary/5 to-violet-500/5">
        <h3 className="text-xl font-bold text-neutral-900 flex items-center gap-2">
          <div className="p-2 rounded-xl bg-gradient-to-br from-primary to-violet-500 shadow-lg">
            <User className="w-5 h-5 text-white" />
          </div>
          Create Knowledge Capture Campaign
        </h3>
        <p className="text-sm text-neutral-500 mt-2">
          Set up a campaign to capture tacit knowledge from a departing expert
        </p>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Expert Information */}
        <div className="space-y-4">
          <h4 className="font-semibold text-neutral-800 flex items-center gap-2 text-sm uppercase tracking-wide">
            <Briefcase className="w-4 h-4 text-primary" />
            Expert Information
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Input
                label="Expert Name"
                placeholder="e.g., James Morrison"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={errors.name ? 'border-red-300' : ''}
              />
              {errors.name && (
                <p className="text-red-500 text-xs mt-1">{errors.name}</p>
              )}
            </div>

            <div>
              <Input
                label="Role / Title"
                placeholder="e.g., Billing Systems Lead"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className={errors.role ? 'border-red-300' : ''}
              />
              {errors.role && (
                <p className="text-red-500 text-xs mt-1">{errors.role}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Department"
              placeholder="e.g., Operations"
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
            />

            <Input
              label="Years of Experience"
              type="number"
              placeholder="30"
              value={formData.yearsExperience || ''}
              onChange={(e) =>
                setFormData({ ...formData, yearsExperience: parseInt(e.target.value) || 0 })
              }
            />

            <div>
              <Input
                label="Expert Email (for calendar invites)"
                type="email"
                placeholder="expert@company.com"
                value={formData.expertEmail}
                onChange={(e) => setFormData({ ...formData, expertEmail: e.target.value })}
                className={errors.expertEmail ? 'border-red-300' : ''}
              />
              {errors.expertEmail && (
                <p className="text-red-500 text-xs mt-1">{errors.expertEmail}</p>
              )}
            </div>
          </div>
        </div>

        {/* Campaign Goal */}
        <div className="space-y-4">
          <h4 className="font-semibold text-neutral-800 flex items-center gap-2 text-sm uppercase tracking-wide">
            <Target className="w-4 h-4 text-primary" />
            Campaign Goal
          </h4>

          <Textarea
            label="What expertise do you want to capture?"
            placeholder="Describe the knowledge areas, processes, and insights you want to preserve..."
            value={formData.goal}
            onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
            rows={3}
          />

          <Textarea
            label="Key Skills to Focus On"
            placeholder="List specific skills, processes, or knowledge areas (one per line or comma-separated)"
            value={formData.skills}
            onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
            rows={3}
          />
        </div>

        {/* Capture Mode */}
        <div className="space-y-4">
          <h4 className="font-semibold text-neutral-800 flex items-center gap-2 text-sm uppercase tracking-wide">
            <Sparkles className="w-4 h-4 text-primary" />
            Capture Mode
          </h4>
          <p className="text-sm text-neutral-500 -mt-2">
            Can be changed per-session once the campaign starts
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {captureModeOptions.map((option) => (
              <label
                key={option.id}
                className={cn(
                  'flex flex-col p-4 rounded-xl cursor-pointer transition-all duration-200 border-2',
                  formData.captureMode === option.id
                    ? 'border-primary bg-primary/5'
                    : 'border-neutral-200 bg-white hover:border-primary/30 hover:bg-neutral-50'
                )}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="capture-mode"
                    value={option.id}
                    checked={formData.captureMode === option.id}
                    onChange={() => setFormData({ ...formData, captureMode: option.id })}
                    className="w-4 h-4 accent-primary"
                  />
                  <span
                    className={cn(
                      'font-semibold',
                      formData.captureMode === option.id ? 'text-primary' : 'text-neutral-900'
                    )}
                  >
                    {option.label}
                  </span>
                </div>
                <p className="text-xs text-neutral-500 mt-1 ml-6">{option.description}</p>
              </label>
            ))}
          </div>
        </div>

        {/* Submit */}
        <div className="pt-4 border-t border-neutral-100">
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating Campaign...
              </>
            ) : (
              'Create Campaign'
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
