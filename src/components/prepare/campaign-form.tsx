'use client'

import { useState, useCallback, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { User, Sparkle, CircleNotch, ArrowRight, ArrowLeft, Target, Check, Users, Plus, X, UserCircle, Folder, Calendar, Lightning, Lightbulb, Info, CheckCircle } from 'phosphor-react'
import { Input, Textarea } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { FileUpload } from './file-upload'
import { AISuggestions } from './ai-suggestions'
import { TeamSelector } from './team-selector'
import { ProjectSelector } from './project-selector'
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

// Project type for classification
export type ProjectType = 'product_feature' | 'team_process'

// Capture schedule type
export type CaptureSchedule = 'cadence' | 'event_driven'

// Capture cadence frequency
export type CaptureCadence = 'weekly' | 'biweekly' | 'monthly'

// Interview format
export type InterviewFormat = 'human_led' | 'ai_live' | 'ai_async'

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
  // New fields for redesigned flow
  projectType?: ProjectType
  captureSchedule?: CaptureSchedule
  captureCadence?: CaptureCadence
  interviewFormat?: InterviewFormat
  focusAreas?: string[]
  suggestedDomains?: { name: string; confidence: number; description: string }[]
}

// Steps for Expert campaign flow
const EXPERT_STEPS = [
  { id: 0, title: 'Expert', description: 'Who holds the knowledge?' },
  { id: 1, title: 'Team', description: 'Which team are they on?' },
  { id: 2, title: 'Documents', description: 'Upload relevant files' },
  { id: 3, title: 'Domains', description: 'AI-suggested knowledge areas' },
  { id: 4, title: 'Collaborators', description: 'Who else can provide input?' },
  { id: 5, title: 'Capture', description: 'How to conduct sessions?' },
]

// Steps for Project campaign flow
const PROJECT_STEPS = [
  { id: 0, title: 'Project', description: 'What project to document?' },
  { id: 1, title: 'Team', description: 'Which team owns it?' },
  { id: 2, title: 'Documents', description: 'Upload project artifacts' },
  { id: 3, title: 'Contributors', description: 'Who to interview?' },
  { id: 4, title: 'Capture', description: 'How to conduct sessions?' },
  { id: 5, title: 'Focus', description: 'AI-suggested focus areas' },
]

// Subject type selection (only Expert and Project now)
const subjectTypeOptions: Array<{
  id: CampaignSubjectType
  label: string
  description: string
  icon: typeof UserCircle
}> = [
  {
    id: 'person',
    label: 'Expert',
    description: 'Capture expertise from an individual (e.g., departing employee)',
    icon: UserCircle,
  },
  {
    id: 'project',
    label: 'Project',
    description: 'Document knowledge about a project or process',
    icon: Folder,
  },
]

// Project type options
const projectTypeOptions: Array<{
  id: ProjectType
  label: string
  description: string
}> = [
  {
    id: 'product_feature',
    label: 'Product / Feature',
    description: 'A product, feature, or system',
  },
  {
    id: 'team_process',
    label: 'Team Process',
    description: 'A team process, workflow, or methodology',
  },
]

// Capture schedule options
const captureScheduleOptions: Array<{
  id: CaptureSchedule
  label: string
  description: string
  icon: typeof Calendar
}> = [
  {
    id: 'cadence',
    label: 'Cadence-based',
    description: 'Regular sessions at set intervals',
    icon: Calendar,
  },
  {
    id: 'event_driven',
    label: 'Event-driven',
    description: 'Trigger sessions as needed',
    icon: Lightning,
  },
]

// Cadence frequency options
const cadenceOptions: Array<{
  id: CaptureCadence
  label: string
}> = [
  { id: 'weekly', label: 'Weekly' },
  { id: 'biweekly', label: 'Bi-weekly' },
  { id: 'monthly', label: 'Monthly' },
]

// Interview format options
const interviewFormatOptions: Array<{
  id: InterviewFormat
  label: string
  description: string
}> = [
  {
    id: 'human_led',
    label: 'Human-Led',
    description: 'Expert interviewer conducts sessions',
  },
  {
    id: 'ai_live',
    label: 'AI-Live',
    description: 'AI conducts live interview sessions',
  },
  {
    id: 'ai_async',
    label: 'AI-Async',
    description: 'Form-like experience, complete at own pace',
  },
]

const collaboratorRoles = [
  { id: 'successor', label: 'Successor', description: 'Taking over responsibilities' },
  { id: 'teammate', label: 'Teammate', description: 'Works closely with expert' },
  { id: 'partner', label: 'Partner', description: 'Cross-team collaborator' },
  { id: 'manager', label: 'Manager', description: 'Direct manager' },
  { id: 'report', label: 'Report', description: 'Reports to expert' },
] as const

// Sidebar content for contextual guidance
interface SidebarTip {
  icon: typeof Lightbulb
  text: string
}

interface SidebarContent {
  title: string
  tips: SidebarTip[]
}

// Sidebar content for Expert flow steps
const EXPERT_SIDEBAR: Record<number, SidebarContent> = {
  0: {
    title: 'Expert Profile Tips',
    tips: [
      { icon: Lightbulb, text: 'Include their official title for accurate documentation' },
      { icon: Info, text: 'Years of experience helps AI calibrate questions' },
      { icon: CheckCircle, text: 'Email enables sending interview invitations directly' },
    ],
  },
  1: {
    title: 'Team Selection',
    tips: [
      { icon: Lightbulb, text: 'Teams organize your knowledge hub for easy discovery' },
      { icon: Info, text: 'Create new teams as needed from this screen' },
    ],
  },
  2: {
    title: 'Document Upload',
    tips: [
      { icon: Lightbulb, text: 'PDFs, Word docs, and text files work best' },
      { icon: Info, text: 'AI analyzes documents to suggest knowledge domains' },
      { icon: CheckCircle, text: 'More context = better AI suggestions' },
    ],
  },
  3: {
    title: 'Knowledge Domains',
    tips: [
      { icon: Lightbulb, text: 'AI-suggested domains guide interview questions' },
      { icon: Info, text: 'You can edit or add domains after campaign creation' },
    ],
  },
  4: {
    title: 'Adding Collaborators',
    tips: [
      { icon: Lightbulb, text: 'Successors provide the most valuable 360° input' },
      { icon: Info, text: 'Collaborators receive brief surveys, not full interviews' },
      { icon: CheckCircle, text: '2-4 collaborators is ideal for comprehensive coverage' },
    ],
  },
  5: {
    title: 'Interview Format',
    tips: [
      { icon: Lightbulb, text: 'Human-led interviews capture nuance best' },
      { icon: Info, text: 'AI-Async works well for busy experts' },
      { icon: CheckCircle, text: 'You can change format for individual sessions later' },
    ],
  },
}

// Sidebar content for Project flow steps
const PROJECT_SIDEBAR: Record<number, SidebarContent> = {
  0: {
    title: 'Project Details',
    tips: [
      { icon: Lightbulb, text: 'Be specific—"Payment Gateway v2" beats "Payment System"' },
      { icon: Info, text: 'Description helps AI generate relevant questions' },
    ],
  },
  1: {
    title: 'Team Selection',
    tips: [
      { icon: Lightbulb, text: 'Select the team that owns this project' },
      { icon: Info, text: 'Knowledge will be searchable by team' },
    ],
  },
  2: {
    title: 'Project Artifacts',
    tips: [
      { icon: Lightbulb, text: 'Upload specs, architecture docs, or runbooks' },
      { icon: Info, text: 'AI will suggest focus areas based on content' },
      { icon: CheckCircle, text: 'Even partial documentation helps' },
    ],
  },
  3: {
    title: 'Contributors',
    tips: [
      { icon: Lightbulb, text: 'Add people with hands-on project knowledge' },
      { icon: Info, text: 'Different roles provide unique perspectives' },
      { icon: CheckCircle, text: 'Include both current and past contributors' },
    ],
  },
  4: {
    title: 'Capture Schedule',
    tips: [
      { icon: Lightbulb, text: 'Cadence-based works well for ongoing projects' },
      { icon: Info, text: 'Event-driven is better for one-time documentation' },
    ],
  },
  5: {
    title: 'Focus Areas',
    tips: [
      { icon: Lightbulb, text: 'Focus areas guide what knowledge to prioritize' },
      { icon: Info, text: 'AI suggests areas based on uploaded documents' },
      { icon: CheckCircle, text: 'Start with 3-5 key areas' },
    ],
  },
}

// Sidebar content for subject type selection
const SUBJECT_SELECTION_SIDEBAR: SidebarContent = {
  title: 'Getting Started',
  tips: [
    { icon: Lightbulb, text: 'Expert campaigns capture individual knowledge' },
    { icon: Info, text: 'Project campaigns document system/process knowledge' },
    { icon: CheckCircle, text: 'You can run multiple campaigns simultaneously' },
  ],
}

// Sidebar component
function StepSidebar({ content }: { content: SidebarContent }) {
  return (
    <div className="space-y-4">
      <h4 className="text-sm font-semibold text-stone-800 dark:text-stone-200">{content.title}</h4>
      <div className="space-y-3">
        {content.tips.map((tip, index) => {
          const Icon = tip.icon
          return (
            <div key={index} className="flex items-start gap-3">
              <div className="p-1.5 rounded-md bg-stone-200 dark:bg-stone-700 shrink-0 mt-0.5">
                <Icon className="w-3.5 h-3.5 text-stone-600 dark:text-stone-300" weight="bold" />
              </div>
              <p className="text-sm text-stone-600 dark:text-stone-300 leading-relaxed">{tip.text}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function CampaignForm({
  onSubmit,
  onAcceptSuggestions,
  onEditSuggestions,
  isSubmitting = false
}: CampaignFormProps) {
  const searchParams = useSearchParams()

  // Flow state
  const [subjectType, setSubjectType] = useState<CampaignSubjectType>('person')
  const [currentStep, setCurrentStep] = useState(-1) // -1 = subject selection
  const [createdCampaignId, setCreatedCampaignId] = useState<string | null>(null)
  const [extractedSkills, setExtractedSkills] = useState<string[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [aiSuggestions, setAiSuggestions] = useState<{
    domains: { name: string; confidence: number; description: string }[]
    skills: string[]
    focusAreas: { area: string; description: string; priority: 'high' | 'medium' | 'low' }[]
    keyTopics: string[]
    summary: string
  } | null>(null)

  // Form data
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
    projectType: 'product_feature',
    captureSchedule: 'event_driven',
    captureCadence: 'biweekly',
    interviewFormat: 'human_led',
    focusAreas: [],
    suggestedDomains: [],
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLocalhost, setIsLocalhost] = useState(false)

  // Check for localhost after mount
  useEffect(() => {
    setIsLocalhost(
      window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    )
  }, [])

  // Parse URL params for pre-filling
  useEffect(() => {
    const type = searchParams.get('type') as CampaignSubjectType | null
    const projectId = searchParams.get('projectId')
    const teamId = searchParams.get('teamId')

    if (type && ['person', 'project'].includes(type)) {
      setSubjectType(type)
      setFormData(prev => ({
        ...prev,
        subjectType: type,
        projectId: projectId ?? undefined,
        teamId: teamId ?? undefined,
      }))
      setCurrentStep(0) // Skip subject selection
    }
  }, [searchParams])

  const fillDemoData = () => {
    if (subjectType === 'person') {
      setFormData({
        ...formData,
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
        ],
        subjectType: 'person',
        interviewFormat: 'human_led',
      })
    } else {
      setFormData({
        ...formData,
        name: 'Payment Gateway',
        role: 'Core Infrastructure',
        department: '',
        goal: 'Document the payment processing system architecture and operational knowledge.',
        captureMode: 'hybrid',
        collaborators: [
          { name: 'Alice Chen', email: 'alice@example.com', role: 'teammate' },
          { name: 'Bob Smith', email: 'bob@example.com', role: 'teammate' },
        ],
        subjectType: 'project',
        projectType: 'product_feature',
        captureSchedule: 'cadence',
        captureCadence: 'biweekly',
        interviewFormat: 'human_led',
      })
    }
  }

  // New collaborator form state
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

  // Get current steps based on subject type
  const STEPS = subjectType === 'person' ? EXPERT_STEPS : PROJECT_STEPS

  // Validate step
  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {}

    if (subjectType === 'person') {
      // Expert flow validation
      if (step === 0) {
        if (!formData.name.trim()) newErrors.name = 'Name is required'
        if (!formData.role.trim()) newErrors.role = 'Role is required'
        if (formData.expertEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.expertEmail)) {
          newErrors.expertEmail = 'Invalid email format'
        }
      }
      if (step === 1) {
        if (!formData.teamId) newErrors.teamId = 'Team is required'
      }
    } else {
      // Project flow validation
      if (step === 0) {
        if (!formData.name.trim()) newErrors.name = 'Project name is required'
      }
      if (step === 1) {
        if (!formData.teamId) newErrors.teamId = 'Team is required'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle next step
  const handleNext = async () => {
    if (!validateStep(currentStep)) return

    // For Expert flow: Create campaign after Step 1 (Team selection) to enable document upload
    // For Project flow: Create campaign after Step 1 (Team selection) to enable document upload
    if (currentStep === 1 && !createdCampaignId) {
      const result = await onSubmit(formData)
      if (result?.id) {
        setCreatedCampaignId(result.id)
      }
    }

    // Trigger AI analysis after documents step (step 2)
    if (currentStep === 2 && createdCampaignId) {
      await analyzeDocuments()
    }

    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    } else if (currentStep === 0) {
      setCurrentStep(-1) // Go back to subject selection
    }
  }

  const goToStep = async (step: number) => {
    // Create campaign before documents step if not created
    if (step >= 2 && !createdCampaignId && validateStep(0) && validateStep(1)) {
      const result = await onSubmit(formData)
      if (result?.id) {
        setCreatedCampaignId(result.id)
      }
    }
    setCurrentStep(step)
  }

  // Analyze documents with AI
  const analyzeDocuments = async () => {
    if (!createdCampaignId) return

    setIsAnalyzing(true)
    try {
      const response = await fetch('/api/ai/analyze-campaign-documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId: createdCampaignId,
          campaignType: subjectType,
          contextInfo: subjectType === 'person'
            ? { expertName: formData.name, expertRole: formData.role }
            : { projectName: formData.name, projectDescription: formData.goal },
        }),
      })

      const data = await response.json()
      if (data.success && data.suggestions) {
        setAiSuggestions({
          domains: data.suggestions.suggestedDomains || [],
          skills: data.suggestions.suggestedSkills || [],
          focusAreas: data.suggestions.suggestedFocusAreas || [],
          keyTopics: data.suggestions.keyTopics || [],
          summary: data.suggestions.summary || '',
        })

        // Update form data with AI suggestions
        setFormData(prev => ({
          ...prev,
          suggestedDomains: data.suggestions.suggestedDomains || [],
          focusAreas: (data.suggestions.suggestedFocusAreas || []).map((f: { area: string }) => f.area),
        }))
      }
    } catch (err) {
      console.error('Failed to analyze documents:', err)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleSkillsExtracted = useCallback((skills: string[]) => {
    setExtractedSkills((prev) => [...new Set([...prev, ...skills])])
  }, [])

  // Handle subject type selection
  const handleSubjectTypeSelect = (type: CampaignSubjectType) => {
    setSubjectType(type)
    setFormData(prev => ({ ...prev, subjectType: type }))
    setCurrentStep(0)
  }

  // Get sidebar content based on current step and flow
  const getSidebarContent = (): SidebarContent => {
    if (currentStep === -1) return SUBJECT_SELECTION_SIDEBAR
    const sidebarMap = subjectType === 'person' ? EXPERT_SIDEBAR : PROJECT_SIDEBAR
    return sidebarMap[currentStep] || { title: '', tips: [] }
  }

  // Render subject type selection
  if (currentStep === -1) {
    return (
      <div className="flex flex-col md:flex-row gap-8">
        {/* Main content */}
        <div className="flex-1 min-w-0 space-y-6">
          <div className="border rounded-lg bg-card">
            <div className="p-4 border-b flex items-center gap-3">
              <div className="p-2 rounded-md bg-secondary">
                <Sparkle className="w-4 h-4 text-muted-foreground" weight="bold" />
              </div>
              <h3 className="font-medium">What are you documenting?</h3>
            </div>
            <div className="p-5">
              <div className="grid gap-3">
                {subjectTypeOptions.map((option) => {
                  const Icon = option.icon
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => handleSubjectTypeSelect(option.id)}
                      className={cn(
                        'flex items-center gap-4 p-4 rounded-lg transition-colors border text-left',
                        'border-border hover:bg-secondary/30 hover:border-foreground/20'
                      )}
                    >
                      <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-secondary text-muted-foreground">
                        <Icon className="w-6 h-6" weight="bold" />
                      </div>
                      <div className="flex-1">
                        <span className="font-medium">{option.label}</span>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {option.description}
                        </p>
                      </div>
                      <ArrowRight className="w-5 h-5 text-muted-foreground" weight="bold" />
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="hidden md:block w-80 shrink-0">
          <div className="sticky top-6 p-5 rounded-xl bg-stone-100 dark:bg-stone-800/50">
            <StepSidebar content={SUBJECT_SELECTION_SIDEBAR} />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Progress Steps */}
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
                  step.id + 1
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

      {/* Two-column layout: Form + Sidebar */}
      <div className="flex flex-col md:flex-row gap-8">
        {/* Main form content */}
        <div className="flex-1 min-w-0 space-y-6">
          {/* EXPERT FLOW STEPS */}
          {subjectType === 'person' && (
        <>
          {/* Step 0: Expert Profile */}
          {currentStep === 0 && (
            <div className="border rounded-lg bg-card">
              <div className="p-4 border-b flex items-center gap-3">
                <div className="p-2 rounded-md bg-secondary">
                  <User className="w-4 h-4 text-muted-foreground" weight="bold" />
                </div>
                <div>
                  <h3 className="font-medium">Expert Profile</h3>
                  <p className="text-xs text-muted-foreground">
                    Who holds the knowledge you want to capture?
                  </p>
                </div>
              </div>
              <div className="p-4 space-y-4">
                <Input
                  label="Expert Name"
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
                <div className="grid grid-cols-2 gap-4">
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
                    onChange={(e) => setFormData({ ...formData, yearsExperience: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <Input
                  label="Email"
                  type="email"
                  placeholder="name@company.com"
                  value={formData.expertEmail}
                  onChange={(e) => setFormData({ ...formData, expertEmail: e.target.value })}
                  error={errors.expertEmail}
                  hint="Optional - used to send interview invitations"
                />
              </div>
            </div>
          )}

          {/* Step 1: Team Selection */}
          {currentStep === 1 && (
            <div className="border rounded-lg bg-card">
              <div className="p-4 border-b flex items-center gap-3">
                <div className="p-2 rounded-md bg-secondary">
                  <Users className="w-4 h-4 text-muted-foreground" weight="bold" />
                </div>
                <div>
                  <h3 className="font-medium">Team</h3>
                  <p className="text-xs text-muted-foreground">
                    Which team does this expert belong to?
                  </p>
                </div>
              </div>
              <div className="p-4">
                <TeamSelector
                  value={formData.teamId}
                  onChange={(teamId) => setFormData({ ...formData, teamId })}
                  error={errors.teamId}
                  required
                  hint="Teams help organize knowledge in your Knowledge Hub"
                />
              </div>
            </div>
          )}

          {/* Step 2: Documents */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <FileUpload
                campaignId={createdCampaignId || undefined}
                onSkillsExtracted={handleSkillsExtracted}
              />
              <div className="text-xs text-muted-foreground text-center">
                Upload documents to help AI understand the expert&apos;s knowledge domains.
                You can skip this step and upload documents later.
              </div>
            </div>
          )}

          {/* Step 3: AI-Suggested Domains */}
          {currentStep === 3 && (
            <div className="border rounded-lg bg-card">
              <div className="p-4 border-b flex items-center gap-3">
                <div className="p-2 rounded-md bg-secondary">
                  <Sparkle className="w-4 h-4 text-muted-foreground" weight="bold" />
                </div>
                <div>
                  <h3 className="font-medium">Knowledge Domains</h3>
                  <p className="text-xs text-muted-foreground">
                    AI-suggested domains based on uploaded documents
                  </p>
                </div>
              </div>
              <div className="p-4 space-y-4">
                {isAnalyzing ? (
                  <div className="flex items-center justify-center py-8">
                    <CircleNotch className="w-6 h-6 animate-spin text-muted-foreground" weight="bold" />
                    <span className="ml-2 text-sm text-muted-foreground">Analyzing documents...</span>
                  </div>
                ) : aiSuggestions?.domains && aiSuggestions.domains.length > 0 ? (
                  <>
                    <p className="text-sm text-muted-foreground">{aiSuggestions.summary}</p>
                    <div className="space-y-2">
                      {aiSuggestions.domains.map((domain, index) => (
                        <div key={index} className="p-3 rounded-lg bg-secondary/50 border border-border">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-sm">{domain.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {Math.round(domain.confidence * 100)}% confidence
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">{domain.description}</p>
                        </div>
                      ))}
                    </div>
                    {aiSuggestions.skills.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-2">Suggested Skills</p>
                        <div className="flex flex-wrap gap-2">
                          {aiSuggestions.skills.map((skill, index) => (
                            <span key={index} className="px-2 py-1 text-xs bg-secondary rounded-md">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-sm text-muted-foreground">
                      No documents uploaded yet. You can define knowledge areas manually.
                    </p>
                    <Textarea
                      label="Key Skills to Focus On"
                      placeholder="One skill per line"
                      value={formData.skills}
                      onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                      rows={5}
                      className="mt-4"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 4: Collaborators */}
          {currentStep === 4 && (
            <div className="border rounded-lg bg-card">
              <div className="p-4 border-b flex items-center gap-3">
                <div className="p-2 rounded-md bg-secondary">
                  <Users className="w-4 h-4 text-muted-foreground" weight="bold" />
                </div>
                <div>
                  <h3 className="font-medium">Collaborators</h3>
                  <p className="text-xs text-muted-foreground">
                    Add people who can provide a 360° view of the expert
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
                    No collaborators added yet. Collaborators receive surveys to provide additional context about the expert.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Step 5: Capture Mode */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <div className="border rounded-lg bg-card">
                <div className="p-4 border-b flex items-center gap-3">
                  <div className="p-2 rounded-md bg-secondary">
                    <Sparkle className="w-4 h-4 text-muted-foreground" weight="bold" />
                  </div>
                  <div>
                    <h3 className="font-medium">Interview Format</h3>
                    <p className="text-xs text-muted-foreground">
                      How should knowledge capture sessions be conducted?
                    </p>
                  </div>
                </div>
                <div className="p-4">
                  <div className="space-y-3">
                    {interviewFormatOptions.map((option) => (
                      <label
                        key={option.id}
                        className={cn(
                          'flex items-center gap-4 p-4 rounded-lg cursor-pointer transition-colors border',
                          formData.interviewFormat === option.id
                            ? 'border-foreground bg-secondary/50'
                            : 'border-border hover:bg-secondary/30'
                        )}
                      >
                        <input
                          type="radio"
                          name="interview-format"
                          value={option.id}
                          checked={formData.interviewFormat === option.id}
                          onChange={() => setFormData({ ...formData, interviewFormat: option.id })}
                          className="sr-only"
                        />
                        <div
                          className={cn(
                            'w-4 h-4 rounded-full border-2 flex items-center justify-center',
                            formData.interviewFormat === option.id
                              ? 'border-foreground'
                              : 'border-muted-foreground'
                          )}
                        >
                          {formData.interviewFormat === option.id && (
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
                </div>
              </div>

              <AISuggestions
                campaignId={createdCampaignId || undefined}
                extractedSkills={extractedSkills}
                onAccept={() => createdCampaignId && onAcceptSuggestions?.(createdCampaignId)}
                onEdit={() => createdCampaignId && onEditSuggestions?.(createdCampaignId)}
              />
            </div>
          )}
        </>
      )}

      {/* PROJECT FLOW STEPS */}
      {subjectType === 'project' && (
        <>
          {/* Step 0: Project Info */}
          {currentStep === 0 && (
            <div className="border rounded-lg bg-card">
              <div className="p-4 border-b flex items-center gap-3">
                <div className="p-2 rounded-md bg-secondary">
                  <Folder className="w-4 h-4 text-muted-foreground" weight="bold" />
                </div>
                <div>
                  <h3 className="font-medium">Project Details</h3>
                  <p className="text-xs text-muted-foreground">
                    What project or process do you want to document?
                  </p>
                </div>
              </div>
              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Project Type</label>
                  <div className="grid grid-cols-2 gap-3">
                    {projectTypeOptions.map((option) => (
                      <label
                        key={option.id}
                        className={cn(
                          'flex flex-col p-3 rounded-lg cursor-pointer transition-colors border',
                          formData.projectType === option.id
                            ? 'border-foreground bg-secondary/50'
                            : 'border-border hover:bg-secondary/30'
                        )}
                      >
                        <input
                          type="radio"
                          name="project-type"
                          value={option.id}
                          checked={formData.projectType === option.id}
                          onChange={() => setFormData({ ...formData, projectType: option.id })}
                          className="sr-only"
                        />
                        <span className="font-medium text-sm">{option.label}</span>
                        <span className="text-xs text-muted-foreground mt-0.5">{option.description}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <ProjectSelector
                  value={formData.projectId}
                  onChange={(projectId) => setFormData({ ...formData, projectId })}
                  label="Select or Create Project"
                  hint="Choose an existing project or create a new one"
                />

                <Input
                  label="Project Name / Title"
                  placeholder="Payment Gateway"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  error={errors.name}
                />

                <Textarea
                  label="Description"
                  placeholder="Describe the project or process you want to document..."
                  value={formData.goal}
                  onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
                  rows={3}
                />
              </div>
            </div>
          )}

          {/* Step 1: Team Selection */}
          {currentStep === 1 && (
            <div className="border rounded-lg bg-card">
              <div className="p-4 border-b flex items-center gap-3">
                <div className="p-2 rounded-md bg-secondary">
                  <Users className="w-4 h-4 text-muted-foreground" weight="bold" />
                </div>
                <div>
                  <h3 className="font-medium">Team</h3>
                  <p className="text-xs text-muted-foreground">
                    Which team owns this project?
                  </p>
                </div>
              </div>
              <div className="p-4">
                <TeamSelector
                  value={formData.teamId}
                  onChange={(teamId) => setFormData({ ...formData, teamId })}
                  error={errors.teamId}
                  required
                  hint="Teams help organize knowledge in your Knowledge Hub"
                />
              </div>
            </div>
          )}

          {/* Step 2: Documents */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <FileUpload
                campaignId={createdCampaignId || undefined}
                onSkillsExtracted={handleSkillsExtracted}
              />
              <div className="text-xs text-muted-foreground text-center">
                Upload project artifacts (specs, docs, diagrams) to help AI suggest focus areas.
              </div>
            </div>
          )}

          {/* Step 3: Contributors */}
          {currentStep === 3 && (
            <div className="border rounded-lg bg-card">
              <div className="p-4 border-b flex items-center gap-3">
                <div className="p-2 rounded-md bg-secondary">
                  <Users className="w-4 h-4 text-muted-foreground" weight="bold" />
                </div>
                <div>
                  <h3 className="font-medium">Contributors</h3>
                  <p className="text-xs text-muted-foreground">
                    Who should be interviewed about this project?
                  </p>
                </div>
              </div>
              <div className="p-4 space-y-4">
                {/* Add contributor form */}
                <div className="space-y-3 p-4 rounded-lg bg-secondary/30">
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      label="Name"
                      placeholder="Alice Chen"
                      value={newCollaborator.name}
                      onChange={(e) => setNewCollaborator({ ...newCollaborator, name: e.target.value })}
                    />
                    <Input
                      label="Email"
                      type="email"
                      placeholder="alice@company.com"
                      value={newCollaborator.email}
                      onChange={(e) => setNewCollaborator({ ...newCollaborator, email: e.target.value })}
                    />
                  </div>
                  <Input
                    label="Role on Project"
                    placeholder="Tech Lead, Backend Developer, PM..."
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={addCollaborator}
                    disabled={!newCollaborator.name || !newCollaborator.email}
                  >
                    <Plus className="w-4 h-4 mr-1" weight="bold" />
                    Add Contributor
                  </Button>
                </div>

                {/* Contributors list */}
                {formData.collaborators.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Contributors ({formData.collaborators.length})
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
                        <button
                          type="button"
                          onClick={() => removeCollaborator(index)}
                          className="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        >
                          <X className="w-4 h-4" weight="bold" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {formData.collaborators.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No contributors added yet. Add people who have knowledge about this project.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Step 4: Capture Mode */}
          {currentStep === 4 && (
            <div className="space-y-6">
              {/* Capture Schedule */}
              <div className="border rounded-lg bg-card">
                <div className="p-4 border-b flex items-center gap-3">
                  <div className="p-2 rounded-md bg-secondary">
                    <Calendar className="w-4 h-4 text-muted-foreground" weight="bold" />
                  </div>
                  <div>
                    <h3 className="font-medium">Capture Schedule</h3>
                    <p className="text-xs text-muted-foreground">
                      How often should knowledge capture happen?
                    </p>
                  </div>
                </div>
                <div className="p-4 space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    {captureScheduleOptions.map((option) => {
                      const Icon = option.icon
                      return (
                        <label
                          key={option.id}
                          className={cn(
                            'flex items-center gap-3 p-4 rounded-lg cursor-pointer transition-colors border',
                            formData.captureSchedule === option.id
                              ? 'border-foreground bg-secondary/50'
                              : 'border-border hover:bg-secondary/30'
                          )}
                        >
                          <input
                            type="radio"
                            name="capture-schedule"
                            value={option.id}
                            checked={formData.captureSchedule === option.id}
                            onChange={() => setFormData({ ...formData, captureSchedule: option.id })}
                            className="sr-only"
                          />
                          <Icon className="w-5 h-5 text-muted-foreground" weight="bold" />
                          <div>
                            <span className="font-medium text-sm">{option.label}</span>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {option.description}
                            </p>
                          </div>
                        </label>
                      )
                    })}
                  </div>

                  {formData.captureSchedule === 'cadence' && (
                    <div className="p-3 rounded-lg bg-secondary/30">
                      <label className="block text-sm font-medium text-foreground mb-2">Frequency</label>
                      <div className="flex gap-2">
                        {cadenceOptions.map((option) => (
                          <button
                            key={option.id}
                            type="button"
                            onClick={() => setFormData({ ...formData, captureCadence: option.id })}
                            className={cn(
                              'px-4 py-2 rounded-md text-sm transition-colors',
                              formData.captureCadence === option.id
                                ? 'bg-foreground text-background'
                                : 'bg-secondary hover:bg-secondary/70'
                            )}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        You&apos;ll receive reminders to schedule sessions at this cadence.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Interview Format */}
              <div className="border rounded-lg bg-card">
                <div className="p-4 border-b flex items-center gap-3">
                  <div className="p-2 rounded-md bg-secondary">
                    <Sparkle className="w-4 h-4 text-muted-foreground" weight="bold" />
                  </div>
                  <div>
                    <h3 className="font-medium">Interview Format</h3>
                    <p className="text-xs text-muted-foreground">
                      How should knowledge capture sessions be conducted?
                    </p>
                  </div>
                </div>
                <div className="p-4">
                  <div className="space-y-3">
                    {interviewFormatOptions.map((option) => (
                      <label
                        key={option.id}
                        className={cn(
                          'flex items-center gap-4 p-4 rounded-lg cursor-pointer transition-colors border',
                          formData.interviewFormat === option.id
                            ? 'border-foreground bg-secondary/50'
                            : 'border-border hover:bg-secondary/30'
                        )}
                      >
                        <input
                          type="radio"
                          name="interview-format"
                          value={option.id}
                          checked={formData.interviewFormat === option.id}
                          onChange={() => setFormData({ ...formData, interviewFormat: option.id })}
                          className="sr-only"
                        />
                        <div
                          className={cn(
                            'w-4 h-4 rounded-full border-2 flex items-center justify-center',
                            formData.interviewFormat === option.id
                              ? 'border-foreground'
                              : 'border-muted-foreground'
                          )}
                        >
                          {formData.interviewFormat === option.id && (
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
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Focus Areas */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <div className="border rounded-lg bg-card">
                <div className="p-4 border-b flex items-center gap-3">
                  <div className="p-2 rounded-md bg-secondary">
                    <Target className="w-4 h-4 text-muted-foreground" weight="bold" />
                  </div>
                  <div>
                    <h3 className="font-medium">Focus Areas</h3>
                    <p className="text-xs text-muted-foreground">
                      AI-suggested areas to focus knowledge capture on
                    </p>
                  </div>
                </div>
                <div className="p-4 space-y-4">
                  {isAnalyzing ? (
                    <div className="flex items-center justify-center py-8">
                      <CircleNotch className="w-6 h-6 animate-spin text-muted-foreground" weight="bold" />
                      <span className="ml-2 text-sm text-muted-foreground">Analyzing documents...</span>
                    </div>
                  ) : aiSuggestions?.focusAreas && aiSuggestions.focusAreas.length > 0 ? (
                    <>
                      <p className="text-sm text-muted-foreground">{aiSuggestions.summary}</p>
                      <div className="space-y-2">
                        {aiSuggestions.focusAreas.map((area, index) => (
                          <div key={index} className="p-3 rounded-lg bg-secondary/50 border border-border">
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-sm">{area.area}</span>
                              <span className={cn(
                                'text-xs px-2 py-0.5 rounded',
                                area.priority === 'high' && 'bg-destructive/10 text-destructive',
                                area.priority === 'medium' && 'bg-yellow-500/10 text-yellow-600',
                                area.priority === 'low' && 'bg-secondary text-muted-foreground'
                              )}>
                                {area.priority}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">{area.description}</p>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-6">
                      <p className="text-sm text-muted-foreground mb-4">
                        {formData.captureSchedule === 'cadence'
                          ? 'For cadence-based capture, focus areas are discovered during interviews.'
                          : 'Upload documents for AI-suggested focus areas, or define them manually below.'}
                      </p>
                      <Textarea
                        label="Focus Areas"
                        placeholder="One focus area per line (e.g., Architecture decisions, Deployment process)"
                        value={formData.focusAreas?.join('\n') || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          focusAreas: e.target.value.split('\n').filter(s => s.trim())
                        })}
                        rows={5}
                      />
                    </div>
                  )}
                </div>
              </div>

              <AISuggestions
                campaignId={createdCampaignId || undefined}
                extractedSkills={extractedSkills}
                onAccept={() => createdCampaignId && onAcceptSuggestions?.(createdCampaignId)}
                onEdit={() => createdCampaignId && onEditSuggestions?.(createdCampaignId)}
              />
            </div>
          )}
        </>
      )}
        </div>

        {/* Contextual Sidebar */}
        <div className="hidden md:block w-80 shrink-0">
          <div className="sticky top-6 p-5 rounded-xl bg-stone-100 dark:bg-stone-800/50">
            <StepSidebar content={getSidebarContent()} />
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-2">
          <Button type="button" variant="ghost" onClick={handleBack}>
            <ArrowLeft className="w-4 h-4 mr-2" weight="bold" />
            Back
          </Button>
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

        {currentStep < STEPS.length - 1 && (
          <Button type="button" onClick={handleNext} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <CircleNotch className="w-4 h-4 mr-2 animate-spin" weight="bold" />
                Creating...
              </>
            ) : currentStep === 1 && !createdCampaignId ? (
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
        )}
      </div>
    </div>
  )
}
