'use client'

import { useState, useCallback, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { User, Sparkle, CircleNotch, ArrowRight, ArrowLeft, Target, Check, FileText, Users, Plus, X, UserCircle, Folder, UsersThree } from 'phosphor-react'
import { Input, Textarea } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { FileUpload } from './file-upload'
import { AISuggestions } from './ai-suggestions'
import type { CampaignSubjectType } from '@/types'

interface CampaignFormProps {
  onSubmit: (data: CampaignFormData) => Promise<{ id: string } | void>
  onAcceptSuggestions?: (campaignId: string) => void
  onEditSuggestions?: (campaignId: string) => void
  isSubmitting?: boolean
}

export interface Collaborator {
  name: string
  email: string
  role: 'successor' | 'teammate' | 'partner' | 'manager' | 'report'
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
  collaborators: Collaborator[]
  subjectType: CampaignSubjectType
  projectId?: string
  teamId?: string
}

type CaptureMode = 'human_led' | 'ai_guided' | 'hybrid'

const STEPS = [
  { id: 0, title: 'Subject', description: 'What to document?' },
  { id: 1, title: 'Expert', description: 'Who holds the knowledge?' },
  { id: 2, title: 'Objective', description: 'What to capture?' },
  { id: 3, title: 'Collaborators', description: 'Who else should provide input?' },
  { id: 4, title: 'Approach', description: 'How to capture?' },
  { id: 5, title: 'Documents', description: 'Upload & generate plan' },
]

const subjectTypeOptions: Array<{
  id: CampaignSubjectType
  label: string
  description: string
  icon: typeof UserCircle
}> = [
  {
    id: 'person',
    label: 'Person',
    description: 'Capture expertise from an individual',
    icon: UserCircle,
  },
  {
    id: 'project',
    label: 'Project',
    description: 'Document knowledge about a project',
    icon: Folder,
  },
  {
    id: 'team',
    label: 'Team',
    description: 'Capture team practices and processes',
    icon: UsersThree,
  },
]

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
    description: 'Your team leads with AI guidance',
  },
  {
    id: 'hybrid',
    label: 'Hybrid',
    description: 'Human experts & AI combined',
  },
]

export function CampaignForm({
  onSubmit,
  onAcceptSuggestions,
  onEditSuggestions,
  isSubmitting = false
}: CampaignFormProps) {
  const searchParams = useSearchParams()
  const [currentStep, setCurrentStep] = useState(0)
  const [createdCampaignId, setCreatedCampaignId] = useState<string | null>(null)
  const [extractedSkills, setExtractedSkills] = useState<string[]>([])
  const [formData, setFormData] = useState<CampaignFormData>({
    name: '',
    role: '',
    department: '',
    yearsExperience: 0,
    goal: '',
    skills: '',
    captureMode: 'hybrid',
    expertEmail: '',
    collaborators: [],
    subjectType: 'person',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLocalhost, setIsLocalhost] = useState(false)

  // Check for localhost after mount to avoid hydration mismatch
  useEffect(() => {
    setIsLocalhost(
      window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    )
  }, [])

  // Parse URL params for pre-filling (from Knowledge Hub CTAs)
  useEffect(() => {
    const type = searchParams.get('type') as CampaignSubjectType | null
    const projectId = searchParams.get('projectId')
    const teamId = searchParams.get('teamId')

    if (type && ['person', 'project', 'team'].includes(type)) {
      setFormData(prev => ({
        ...prev,
        subjectType: type,
        projectId: projectId ?? undefined,
        teamId: teamId ?? undefined,
      }))
      // Skip step 0 if type is pre-selected
      setCurrentStep(1)
    }
  }, [searchParams])

  const fillDemoData = () => {
    setFormData({
      name: 'James Morrison',
      role: 'Billing Systems Lead',
      department: 'Operations',
      yearsExperience: 15,
      goal: 'Capture institutional knowledge about legacy billing reconciliation processes.',
      skills: 'SAP integration\nException handling\nMonth-end close procedures\nVendor dispute resolution',
      captureMode: 'hybrid',
      expertEmail: 'james.morrison@example.com',
      collaborators: [
        { name: 'Sarah Chen', email: 'sarah.chen@example.com', role: 'successor' },
        { name: 'Mike Johnson', email: 'mike.johnson@example.com', role: 'teammate' },
        { name: 'Lisa Park', email: 'lisa.park@example.com', role: 'partner' },
      ],
      subjectType: 'person',
    })
  }

  // Dynamic labels based on subject type
  const getExpertLabel = () => {
    switch (formData.subjectType) {
      case 'project':
        return 'Project Expert'
      case 'team':
        return 'Team Representative'
      default:
        return 'Expert'
    }
  }

  const getStepDescription = () => {
    switch (formData.subjectType) {
      case 'project':
        return 'Who knows most about this project?'
      case 'team':
        return 'Who can represent the team\'s knowledge?'
      default:
        return 'Who holds the knowledge?'
    }
  }

  const [newCollaborator, setNewCollaborator] = useState<Collaborator>({
    name: '',
    email: '',
    role: 'teammate',
  })

  const addCollaborator = () => {
    if (newCollaborator.name && newCollaborator.email) {
      setFormData({
        ...formData,
        collaborators: [...formData.collaborators, newCollaborator],
      })
      setNewCollaborator({ name: '', email: '', role: 'teammate' })
    }
  }

  const removeCollaborator = (index: number) => {
    setFormData({
      ...formData,
      collaborators: formData.collaborators.filter((_, i) => i !== index),
    })
  }

  const collaboratorRoles = [
    { id: 'successor', label: 'Successor', description: 'Taking over responsibilities' },
    { id: 'teammate', label: 'Teammate', description: 'Works closely with expert' },
    { id: 'partner', label: 'Partner', description: 'Cross-team collaborator' },
    { id: 'manager', label: 'Manager', description: 'Direct manager' },
    { id: 'report', label: 'Report', description: 'Reports to expert' },
  ] as const

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {}

    if (step === 1) {
      if (!formData.name.trim()) {
        newErrors.name = 'Name is required'
      }
      if (!formData.role.trim()) {
        newErrors.role = 'Role is required'
      }
      if (formData.expertEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.expertEmail)) {
        newErrors.expertEmail = 'Invalid email format'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = async () => {
    if (!validateStep(currentStep)) return

    // If moving to step 5 and campaign not created yet, create it
    if (currentStep === 4 && !createdCampaignId) {
      const result = await onSubmit(formData)
      if (result?.id) {
        setCreatedCampaignId(result.id)
      }
    }

    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const goToStep = async (step: number) => {
    // If going to step 5 and campaign not created, create it first
    if (step === 5 && !createdCampaignId && validateStep(1)) {
      const result = await onSubmit(formData)
      if (result?.id) {
        setCreatedCampaignId(result.id)
      }
    }
    setCurrentStep(step)
  }

  const handleSkillsExtracted = useCallback((skills: string[]) => {
    setExtractedSkills((prev) => [...new Set([...prev, ...skills])])
  }, [])

  return (
    <div className="space-y-6">
      {/* Progress Steps */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
        {STEPS.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <button
              type="button"
              onClick={() => goToStep(step.id)}
              className={cn(
                'flex items-center gap-2 p-2 rounded-lg transition-colors',
                step.id === currentStep && 'bg-secondary',
                step.id !== currentStep && 'hover:bg-secondary/50 cursor-pointer'
              )}
            >
              <div
                className={cn(
                  'w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium transition-colors shrink-0',
                  step.id === currentStep && 'bg-foreground text-background',
                  step.id < currentStep && 'bg-emerald-500 text-white',
                  step.id > currentStep && 'bg-border text-muted-foreground'
                )}
              >
                {step.id < currentStep ? (
                  <Check className="w-3.5 h-3.5" weight="bold" />
                ) : (
                  step.id
                )}
              </div>
              <span className="hidden lg:block text-xs font-medium">{step.title}</span>
            </button>
            {index < STEPS.length - 1 && (
              <div className={cn(
                'h-px w-8 mx-1',
                step.id < currentStep ? 'bg-emerald-500' : 'bg-border'
              )} />
            )}
          </div>
        ))}
        </div>
        {isLocalhost && (
          <button
            type="button"
            onClick={fillDemoData}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Fill demo data
          </button>
        )}
      </div>

      {/* Step 0: Subject Type Selection */}
      {currentStep === 0 && (
        <div className="border rounded-lg bg-card">
          <div className="p-4 border-b flex items-center gap-3">
            <div className="p-2 rounded-md bg-secondary">
              <Sparkle className="w-4 h-4 text-muted-foreground" weight="bold" />
            </div>
            <div>
              <h3 className="font-medium">What are you documenting?</h3>
              <p className="text-xs text-muted-foreground">
                Select the type of knowledge you want to capture
              </p>
            </div>
          </div>
          <div className="p-4">
            <div className="grid gap-3">
              {subjectTypeOptions.map((option) => {
                const Icon = option.icon
                return (
                  <label
                    key={option.id}
                    className={cn(
                      'flex items-center gap-4 p-4 rounded-lg cursor-pointer transition-colors border',
                      formData.subjectType === option.id
                        ? 'border-foreground bg-secondary/50'
                        : 'border-border hover:bg-secondary/30'
                    )}
                  >
                    <input
                      type="radio"
                      name="subject-type"
                      value={option.id}
                      checked={formData.subjectType === option.id}
                      onChange={() => setFormData({ ...formData, subjectType: option.id })}
                      className="sr-only"
                    />
                    <div
                      className={cn(
                        'w-10 h-10 rounded-lg flex items-center justify-center transition-colors',
                        formData.subjectType === option.id
                          ? 'bg-foreground text-background'
                          : 'bg-secondary text-muted-foreground'
                      )}
                    >
                      <Icon className="w-5 h-5" weight="bold" />
                    </div>
                    <div className="flex-1">
                      <span className="font-medium text-sm">{option.label}</span>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {option.description}
                      </p>
                    </div>
                    <div
                      className={cn(
                        'w-4 h-4 rounded-full border-2 flex items-center justify-center',
                        formData.subjectType === option.id
                          ? 'border-foreground'
                          : 'border-muted-foreground'
                      )}
                    >
                      {formData.subjectType === option.id && (
                        <div className="w-2 h-2 rounded-full bg-foreground" />
                      )}
                    </div>
                  </label>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Step 1: Expert Profile */}
      {currentStep === 1 && (
        <div className="border rounded-lg bg-card">
          <div className="p-4 border-b flex items-center gap-3">
            <div className="p-2 rounded-md bg-secondary">
              <User className="w-4 h-4 text-muted-foreground" weight="bold" />
            </div>
            <div>
              <h3 className="font-medium">{getExpertLabel()} Profile</h3>
              <p className="text-xs text-muted-foreground">
                {getStepDescription()}
              </p>
            </div>
          </div>
          <div className="p-4 space-y-4">
            <Input
              label={`${getExpertLabel()} Name`}
              placeholder="James Morrison"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              error={errors.name}
            />
            <Input
              label="Role / Title"
              placeholder="Billing Systems Lead"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              error={errors.role}
            />
            <Input
              label="Department"
              placeholder="Operations"
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
            />
            <Input
              label="Years of Experience"
              type="number"
              placeholder="15"
              value={formData.yearsExperience || ''}
              onChange={(e) =>
                setFormData({ ...formData, yearsExperience: parseInt(e.target.value) || 0 })
              }
            />
            <Input
              label="Email"
              type="email"
              placeholder="name@company.com"
              value={formData.expertEmail}
              onChange={(e) => setFormData({ ...formData, expertEmail: e.target.value })}
              error={errors.expertEmail}
            />
          </div>
        </div>
      )}

      {/* Step 2: Campaign Objective */}
      {currentStep === 2 && (
        <div className="border rounded-lg bg-card">
          <div className="p-4 border-b flex items-center gap-3">
            <div className="p-2 rounded-md bg-secondary">
              <Target className="w-4 h-4 text-muted-foreground" weight="bold" />
            </div>
            <div>
              <h3 className="font-medium">Campaign Objective</h3>
              <p className="text-xs text-muted-foreground">
                What knowledge do you want to capture?
              </p>
            </div>
          </div>
          <div className="p-4 space-y-4">
            <Textarea
              label="What expertise do you want to capture?"
              placeholder="Knowledge areas and processes to preserve..."
              value={formData.goal}
              onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
              rows={6}
            />
            <Textarea
              label="Key Skills to Focus On"
              placeholder="One skill per line"
              value={formData.skills}
              onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
              rows={5}
            />
          </div>
        </div>
      )}

      {/* Step 3: Collaborators */}
      {currentStep === 3 && (
        <div className="border rounded-lg bg-card">
          <div className="p-4 border-b flex items-center gap-3">
            <div className="p-2 rounded-md bg-secondary">
              <Users className="w-4 h-4 text-muted-foreground" weight="bold" />
            </div>
            <div>
              <h3 className="font-medium">Collaborators</h3>
              <p className="text-xs text-muted-foreground">
                Nominate people who will receive a survey about the expert
              </p>
            </div>
          </div>
          <div className="p-4 space-y-4">
            {/* Add collaborator form */}
            <div className="space-y-3 p-4 rounded-lg bg-secondary/30">
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Name"
                  placeholder="Sarah Chen"
                  value={newCollaborator.name}
                  onChange={(e) => setNewCollaborator({ ...newCollaborator, name: e.target.value })}
                />
                <Input
                  label="Email"
                  type="email"
                  placeholder="sarah@company.com"
                  value={newCollaborator.email}
                  onChange={(e) => setNewCollaborator({ ...newCollaborator, email: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Role</label>
                <select
                  value={newCollaborator.role}
                  onChange={(e) => setNewCollaborator({ ...newCollaborator, role: e.target.value as Collaborator['role'] })}
                  className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                >
                  {collaboratorRoles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.label} - {role.description}
                    </option>
                  ))}
                </select>
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={addCollaborator}
                disabled={!newCollaborator.name || !newCollaborator.email}
              >
                <Plus className="w-4 h-4 mr-1" weight="bold" />
                Add Collaborator
              </Button>
            </div>

            {/* Collaborators list */}
            {formData.collaborators.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Added ({formData.collaborators.length})
                </p>
                {formData.collaborators.map((collab, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-lg bg-secondary/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                        <User className="w-4 h-4 text-muted-foreground" weight="bold" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{collab.name}</p>
                        <p className="text-xs text-muted-foreground">{collab.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-1 rounded bg-secondary text-muted-foreground">
                        {collaboratorRoles.find((r) => r.id === collab.role)?.label}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeCollaborator(index)}
                        className="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                      >
                        <X className="w-4 h-4" weight="bold" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {formData.collaborators.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No collaborators added yet. Add people who work with the expert.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Step 4: Capture Mode */}
      {currentStep === 4 && (
        <div className="border rounded-lg bg-card">
          <div className="p-4 border-b flex items-center gap-3">
            <div className="p-2 rounded-md bg-secondary">
              <Sparkle className="w-4 h-4 text-muted-foreground" weight="bold" />
            </div>
            <div>
              <h3 className="font-medium">Capture Approach</h3>
              <p className="text-xs text-muted-foreground">
                How should we conduct the knowledge capture sessions?
              </p>
            </div>
          </div>
          <div className="p-4">
            <div className="space-y-3">
              {captureModeOptions.map((option) => (
                <label
                  key={option.id}
                  className={cn(
                    'flex items-center gap-4 p-4 rounded-lg cursor-pointer transition-colors border',
                    formData.captureMode === option.id
                      ? 'border-foreground bg-secondary/50'
                      : 'border-border hover:bg-secondary/30'
                  )}
                >
                  <input
                    type="radio"
                    name="capture-mode"
                    value={option.id}
                    checked={formData.captureMode === option.id}
                    onChange={() => setFormData({ ...formData, captureMode: option.id })}
                    className="sr-only"
                  />
                  <div
                    className={cn(
                      'w-4 h-4 rounded-full border-2 flex items-center justify-center',
                      formData.captureMode === option.id
                        ? 'border-foreground'
                        : 'border-muted-foreground'
                    )}
                  >
                    {formData.captureMode === option.id && (
                      <div className="w-2 h-2 rounded-full bg-foreground" />
                    )}
                  </div>
                  <div>
                    <span className="font-medium text-sm">{option.label}</span>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {option.description}
                    </p>
                  </div>
                </label>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              This can be changed for individual sessions later.
            </p>
          </div>
        </div>
      )}

      {/* Step 5: Documents & AI */}
      {currentStep === 5 && (
        <div className="space-y-6">
          <FileUpload
            campaignId={createdCampaignId || undefined}
            onSkillsExtracted={handleSkillsExtracted}
          />
          <AISuggestions
            campaignId={createdCampaignId || undefined}
            extractedSkills={extractedSkills}
            onAccept={() => createdCampaignId && onAcceptSuggestions?.(createdCampaignId)}
            onEdit={() => createdCampaignId && onEditSuggestions?.(createdCampaignId)}
          />
        </div>
      )}

      {/* Navigation */}
      {currentStep < 5 && (
        <div className="flex items-center justify-between pt-2">
          <div>
            {currentStep > 0 && (
              <Button type="button" variant="ghost" onClick={handleBack}>
                <ArrowLeft className="w-4 h-4 mr-2" weight="bold" />
                Back
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground mr-2">
              Step {currentStep + 1} of {STEPS.length}
            </span>
            <Button type="button" onClick={handleNext} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <CircleNotch className="w-4 h-4 mr-2 animate-spin" weight="bold" />
                  Creating...
                </>
              ) : currentStep === 4 ? (
                <>
                  Create & Continue
                  <ArrowRight className="w-4 h-4 ml-2" weight="bold" />
                </>
              ) : (
                <>
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" weight="bold" />
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
