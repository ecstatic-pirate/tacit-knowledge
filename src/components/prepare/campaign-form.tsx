'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { User, Sparkle, CircleNotch, ArrowRight, ArrowLeft, Check, Users, Plus, X, UserCircle, Folder, Calendar, Lightning, Lightbulb, Info, CheckCircle, Files, FileText, Clock, Wrench } from 'phosphor-react'
import { Input, Textarea } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { TeamSelector } from './team-selector'
import { REGIONS, INITIATIVE_TYPES, MATURITY_STAGES } from '@/lib/initiative-helpers'
import type { CampaignSubjectType } from '@/types'

interface CampaignFormProps {
  onSubmit: (data: CampaignFormData) => Promise<{ id: string } | void>
  isSubmitting?: boolean
}

export interface Collaborator {
  name: string
  email: string
  role: 'successor' | 'teammate' | 'partner' | 'manager' | 'report'
}

// Project type for classification (universal categories across industries)
export type ProjectType = 'system_tool' | 'process_workflow' | 'client_relationship' | 'regulatory_compliance' | 'product_service'

// Capture schedule type
export type CaptureSchedule = 'cadence' | 'event_driven'

// Capture cadence frequency
export type CaptureCadence = 'weekly' | 'biweekly' | 'monthly'

// Interview format
export type InterviewFormat = 'human_led' | 'ai_live' | 'ai_async'

// Session duration options
export type SessionDuration = 30 | 45 | 60

export interface DemoDocument {
  id: string
  filename: string
  description: string
  content: string
  fileType: string
}

export interface CampaignFormData {
  name: string
  role: string
  goal: string
  captureMode: 'human_led' | 'ai_guided' | 'hybrid'
  expertEmail?: string
  departureDate?: string
  collaborators: Collaborator[]
  subjectType: CampaignSubjectType
  projectId?: string
  teamId?: string
  // New fields for redesigned flow
  projectType?: ProjectType
  captureSchedule?: CaptureSchedule
  captureCadence?: CaptureCadence
  interviewFormat?: InterviewFormat
  sessionDuration?: SessionDuration
  focusAreas?: string[]
  suggestedDomains?: { name: string; confidence: number; description: string }[]
  // Demo documents
  selectedDemoDocuments?: DemoDocument[]
  // Initiative details (Mercedes AI Portfolio)
  initiativeType?: 'tool' | 'platform' | 'process' | 'integration'
  initiativeStatus?: 'planned' | 'active' | 'scaling' | 'retired'
  teamSize?: number
  techStack?: string[]
  businessUnit?: string
  region?: string
}

// Demo documents based on the Tacit Knowledge Capture codebase
const DEMO_DOCUMENTS_EXPERT: DemoDocument[] = [
  {
    id: 'arch-overview',
    filename: 'Architecture Overview.md',
    description: 'System architecture and component relationships',
    fileType: 'text/markdown',
    content: `# Tacit Knowledge Capture - Architecture Overview

## Core Components

### Frontend (Next.js 16 + React 19)
- **Pages**: Campaign management, Sessions, Knowledge Hub, Concierge
- **Components**: Reusable UI components with Tailwind CSS
- **State Management**: React Context (AppContext) for global state

### Backend (Supabase)
- **Database**: PostgreSQL with Row Level Security (RLS)
- **Auth**: Supabase Auth with email/password
- **Storage**: File uploads for campaign documents
- **Edge Functions**: AI processing and email notifications

### AI Integration
- **OpenAI GPT-4**: Knowledge extraction, topic suggestions
- **Embeddings**: Vector search for knowledge retrieval
- **Concierge**: RAG-based Q&A over captured knowledge

## Data Flow
1. Campaign created → Collaborators invited → Surveys collected
2. Sessions scheduled → Interviews conducted → Transcripts generated
3. AI extracts insights → Knowledge graph built → Reports generated
4. Users query Concierge → RAG retrieval → Contextual answers`
  },
  {
    id: 'campaign-flows',
    filename: 'Campaign Flows.md',
    description: 'How expert and project campaigns work',
    fileType: 'text/markdown',
    content: `# Campaign Flows

## Expert Campaign Flow
1. **Setup**: Expert profile, team selection, collaborators
2. **Scoping**: Collaborators complete surveys about expert's knowledge
3. **AI Planning**: System suggests topics and interview questions
4. **Capture**: Human-led sessions with real-time transcription
5. **Processing**: AI extracts insights, builds knowledge graph
6. **Access**: Knowledge Hub and Concierge for retrieval

## Project Campaign Flow
1. **Setup**: Project details, document upload, contributors
2. **Scoping**: Contributors self-report expertise areas
3. **AI Planning**: System identifies gaps and suggests questions
4. **Capture**: Multiple participants interviewed about project
5. **Synthesis**: Knowledge consolidated across all interviews
6. **Delivery**: Comprehensive project documentation

## Key Entities
- **Campaign**: Container for all capture activities
- **Session**: Individual interview or capture event
- **Topic**: Knowledge area to be covered
- **Insight**: Extracted knowledge piece from sessions`
  },
  {
    id: 'tech-stack',
    filename: 'Technology Stack.md',
    description: 'Technologies and libraries used',
    fileType: 'text/markdown',
    content: `# Technology Stack

## Frontend
- **Framework**: Next.js 16 with App Router
- **UI**: React 19, Tailwind CSS 4, Radix UI primitives
- **Icons**: Phosphor React
- **Video**: Daily.co for live sessions

## Backend
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **Storage**: Supabase Storage
- **Email**: Resend for transactional emails

## AI/ML
- **LLM**: OpenAI GPT-4 for extraction and generation
- **Embeddings**: text-embedding-3-small for vector search
- **RAG**: Custom implementation with pgvector

## Development
- **Language**: TypeScript
- **Build**: Turbopack
- **Linting**: ESLint
- **Package Manager**: npm`
  },
  {
    id: 'db-schema',
    filename: 'Database Schema.md',
    description: 'Key database tables and relationships',
    fileType: 'text/markdown',
    content: `# Database Schema

## Core Tables

### campaigns
- Primary entity for knowledge capture
- Links to: org_id, team_id, project_id
- Types: person (Expert) or project

### sessions
- Individual capture events
- Links to: campaign_id, participant_id
- Status: scheduled, in_progress, completed

### topics
- Knowledge areas to capture
- Source: manual or ai_detected
- Status: captured or pending

### graph_nodes
- Knowledge graph entries
- Types: core, skill, concept, process
- Links to: campaign_id, topic_id, session_id

## Supporting Tables
- **documents**: Uploaded files for context
- **collaborator_responses**: Survey data
- **transcript_lines**: Session transcripts
- **knowledge_embeddings**: Vector search index`
  },
]

const DEMO_DOCUMENTS_PROJECT: DemoDocument[] = [
  {
    id: 'features-roadmap',
    filename: 'Features Roadmap.md',
    description: 'Upcoming features and priorities',
    fileType: 'text/markdown',
    content: `# Tacit Knowledge Capture - Features Roadmap

## Current Release (v1.0)
- ✅ Expert and Project campaign flows
- ✅ Collaborator and participant surveys
- ✅ Human-led interview sessions
- ✅ Knowledge Hub with search
- ✅ AI Concierge for Q&A

## Next Release (v1.1)
- 🔄 AI-Live interview mode
- 🔄 AI-Async form-based capture
- 🔄 Advanced reporting and exports
- 🔄 Email notifications system

## Future Roadmap
- Calendar integration (Outlook, Google)
- Team analytics and insights
- Knowledge graph visualization
- API for external integrations
- Mobile app for on-the-go capture`
  },
  {
    id: 'user-guide',
    filename: 'User Experience Guide.md',
    description: 'UX patterns and design decisions',
    fileType: 'text/markdown',
    content: `# User Experience Guide

## Design Principles
1. **Progressive Disclosure**: Show complexity only when needed
2. **Guided Workflows**: Step-by-step campaign creation
3. **Contextual Help**: Sidebar tips and inline guidance
4. **Minimal Friction**: Quick actions, smart defaults

## Key User Flows

### Creating a Campaign
1. Select campaign type (Expert or Project)
2. Fill basic details with inline validation
3. Add collaborators/contributors
4. Configure capture settings
5. Review and create

### Running Sessions
1. Schedule from campaigns page
2. Join video room with Daily.co
3. Real-time transcription
4. AI topic tracking
5. Post-session insights

### Accessing Knowledge
1. Browse Knowledge Hub by team/campaign
2. Search across all captured content
3. Ask Concierge natural language questions
4. Generate reports on demand`
  },
  {
    id: 'api-overview',
    filename: 'API Overview.md',
    description: 'Key API endpoints and data flows',
    fileType: 'text/markdown',
    content: `# API Overview

## Campaign APIs
- POST /api/campaigns - Create campaign
- GET /api/campaigns - List campaigns
- GET /api/campaigns/[id] - Get campaign details
- PATCH /api/campaigns/[id] - Update campaign

## Session APIs
- POST /api/sessions - Create session
- GET /api/sessions/[id] - Get session details
- POST /api/sessions/[id]/transcript - Add transcript line

## Knowledge APIs
- GET /api/knowledge - Search knowledge base
- POST /api/knowledge/embed - Generate embeddings

## AI APIs
- POST /api/ai/extract - Extract insights from text
- POST /api/ai/suggest-topics - Suggest topics
- POST /api/concierge/chat - Concierge Q&A

## Webhook Endpoints
- POST /api/webhooks/daily - Daily.co events
- POST /api/webhooks/email - Email delivery status`
  },
  {
    id: 'integration-guide',
    filename: 'Integration Guide.md',
    description: 'How components work together',
    fileType: 'text/markdown',
    content: `# Integration Guide

## Supabase Integration
- Direct client queries with RLS
- Server-side with service role for admin ops
- Real-time subscriptions for live updates

## Daily.co Integration
- Room creation via API
- Embedded video player
- Webhook for session events
- Recording and transcription

## OpenAI Integration
- Chat completions for extraction
- Embeddings for vector search
- Structured outputs for JSON responses

## Resend Integration
- Transactional emails for invitations
- Reminder sequences
- Email delivery tracking

## Environment Variables
- NEXT_PUBLIC_SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY
- OPENAI_API_KEY
- DAILY_API_KEY
- RESEND_API_KEY`
  },
]

// Steps for Expert campaign flow (simplified - no AI domains step)
// Documents is step 3 so campaign can be created after collecting all key info
const EXPERT_STEPS = [
  { id: 0, title: 'Expert', description: 'Who holds the knowledge?' },
  { id: 1, title: 'Team', description: 'Which team are they on?' },
  { id: 2, title: 'Collaborators', description: 'Who else can provide input?' },
  { id: 3, title: 'Documents', description: 'Upload relevant files' },
  { id: 4, title: 'Capture', description: 'How to conduct sessions?' },
]

// Steps for Project campaign flow (simplified - no AI focus step)
const PROJECT_STEPS = [
  { id: 0, title: 'Project', description: 'What project to document?' },
  { id: 1, title: 'Documents', description: 'Upload project artifacts' },
  { id: 2, title: 'Contributors', description: 'Who to interview?' },
  { id: 3, title: 'Capture', description: 'How to conduct sessions?' },
]

// Subject type selection (only Expert and Project now)
const subjectTypeOptions: Array<{
  id: CampaignSubjectType
  label: string
  description: string
  icon: typeof UserCircle
  disabled?: boolean
  comingSoon?: boolean
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
    disabled: true,
    comingSoon: true,
  },
]

// Project type options (universal categories across industries)
const projectTypeOptions: Array<{
  id: ProjectType
  label: string
  description: string
}> = [
  {
    id: 'system_tool',
    label: 'System / Tool',
    description: 'Technical systems, software, platforms, equipment',
  },
  {
    id: 'process_workflow',
    label: 'Process / Workflow',
    description: 'Procedures, methodologies, how work gets done',
  },
  {
    id: 'client_relationship',
    label: 'Client / Relationship',
    description: 'Client knowledge, vendor relationships, accounts',
  },
  {
    id: 'regulatory_compliance',
    label: 'Regulatory / Compliance',
    description: 'Rules, regulations, policies, compliance procedures',
  },
  {
    id: 'product_service',
    label: 'Product / Service',
    description: 'Products or services your organization offers',
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
  disabled?: boolean
  comingSoon?: boolean
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
    disabled: true,
    comingSoon: true,
  },
  {
    id: 'ai_async',
    label: 'AI-Async',
    description: 'Form-like experience, complete at own pace',
    disabled: true,
    comingSoon: true,
  },
]

// Session duration options
const sessionDurationOptions: Array<{
  value: SessionDuration
  label: string
}> = [
  { value: 30, label: '30 min' },
  { value: 45, label: '45 min' },
  { value: 60, label: '60 min' },
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
      { icon: Info, text: 'Email enables sending capture invitations directly' },
      { icon: CheckCircle, text: 'Team is selected in the next step' },
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
      { icon: Info, text: 'Documents provide context for capture sessions' },
      { icon: CheckCircle, text: 'You can skip this and upload later' },
    ],
  },
  3: {
    title: 'Adding Collaborators',
    tips: [
      { icon: Lightbulb, text: 'Successors provide the most valuable 360° input' },
      { icon: Info, text: 'Collaborators receive brief surveys, not full sessions' },
      { icon: CheckCircle, text: '2-4 collaborators is ideal for comprehensive coverage' },
    ],
  },
  4: {
    title: 'Capture Format',
    tips: [
      { icon: Lightbulb, text: 'Human-led sessions capture nuance best' },
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
      { icon: Info, text: 'Description helps generate relevant questions' },
    ],
  },
  1: {
    title: 'Project Artifacts',
    tips: [
      { icon: Lightbulb, text: 'Upload specs, architecture docs, or runbooks' },
      { icon: Info, text: 'Documents provide context for capture sessions' },
      { icon: CheckCircle, text: 'No docs? Contributors will fill in the gaps' },
    ],
  },
  2: {
    title: 'Contributors',
    tips: [
      { icon: Lightbulb, text: 'Add people with hands-on project knowledge' },
      { icon: Info, text: 'They\'ll receive a survey to kickstart capture' },
      { icon: CheckCircle, text: 'Include both current and past contributors' },
    ],
  },
  3: {
    title: 'Capture Format',
    tips: [
      { icon: Lightbulb, text: 'Cadence-based works well for ongoing projects' },
      { icon: Info, text: 'Event-driven is better for one-time documentation' },
      { icon: CheckCircle, text: 'You can change format for individual sessions later' },
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
  isSubmitting = false
}: CampaignFormProps) {
  const searchParams = useSearchParams()

  // Flow state
  const [subjectType, setSubjectType] = useState<CampaignSubjectType>('person')
  const [currentStep, setCurrentStep] = useState(-1) // -1 = subject selection
  const [createdCampaignId, setCreatedCampaignId] = useState<string | null>(null)

  // Form data
  const [formData, setFormData] = useState<CampaignFormData>({
    name: '',
    role: '',
    goal: '',
    captureMode: 'hybrid',
    expertEmail: '',
    departureDate: '',
    collaborators: [],
    subjectType: 'person',
    projectType: 'system_tool',
    captureSchedule: 'event_driven',
    captureCadence: 'biweekly',
    interviewFormat: 'human_led',
    sessionDuration: 30,
    focusAreas: [],
    suggestedDomains: [],
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLocalhost, setIsLocalhost] = useState(false)
  const [techStackInput, setTechStackInput] = useState('')

  // Prefetch teams immediately when form loads
  const [teams, setTeams] = useState<Array<{ id: string; name: string; description: string | null; color: string | null }>>([])
  const [teamsLoading, setTeamsLoading] = useState(true)

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const response = await fetch('/api/teams')
        const data = await response.json()
        if (data.success) {
          setTeams(data.teams)
        }
      } catch (err) {
        console.error('Failed to prefetch teams:', err)
      } finally {
        setTeamsLoading(false)
      }
    }
    fetchTeams()
  }, [])

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
    // Get a date 3 months from now for demo departure date
    const futureDate = new Date()
    futureDate.setMonth(futureDate.getMonth() + 3)
    const departureDateStr = futureDate.toISOString().split('T')[0]

    // Select first available team (Product Engineering if available)
    const productTeam = teams.find(t => t.name.toLowerCase().includes('product') || t.name.toLowerCase().includes('engineering'))
    const selectedTeamId = productTeam?.id || teams[0]?.id || formData.teamId

    if (subjectType === 'person') {
      // Expert flow: Shantanu Garg - Product Lead on Tacit Knowledge Capture
      setFormData({
        ...formData,
        name: 'Shantanu Garg',
        role: 'Product Lead',
        goal: 'Capture comprehensive knowledge of the Tacit Knowledge Capture platform: architecture decisions, implementation patterns, AI integration approaches, user experience design rationale, and operational knowledge for maintaining and extending the system.',
        captureMode: 'hybrid',
        expertEmail: 'shantanu.garg@getabstract.com',
        departureDate: departureDateStr,
        teamId: selectedTeamId,
        collaborators: [
          { name: 'Raul Bergen', email: 'raul@getabstract.com', role: 'partner' },
        ],
        subjectType: 'person',
        interviewFormat: 'human_led',
        selectedDemoDocuments: DEMO_DOCUMENTS_EXPERT,
      })
    } else {
      // Project flow: Tacit Knowledge Capture platform documentation
      setFormData({
        ...formData,
        name: 'Tacit Knowledge Capture Platform',
        role: 'Core Product',
        goal: 'Document the complete Tacit Knowledge Capture system: campaign management, knowledge capture workflows, AI concierge integration, session management, and the knowledge hub architecture.',
        captureMode: 'hybrid',
        teamId: selectedTeamId,
        collaborators: [
          { name: 'Shantanu Garg', email: 'shantanu.garg@getabstract.com', role: 'teammate' },
          { name: 'Raul Bergen', email: 'raul@getabstract.com', role: 'partner' },
        ],
        subjectType: 'project',
        projectType: 'process_workflow',
        captureSchedule: 'event_driven',
        captureCadence: 'weekly',
        interviewFormat: 'human_led',
        selectedDemoDocuments: DEMO_DOCUMENTS_PROJECT,
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
        // Validate departure date is in the future if provided
        if (formData.departureDate) {
          const today = new Date()
          today.setHours(0, 0, 0, 0)
          const departureDate = new Date(formData.departureDate)
          if (departureDate < today) {
            newErrors.departureDate = 'Departure date must be today or in the future'
          }
        }
      }
      if (step === 1) {
        if (!formData.teamId) newErrors.teamId = 'Team is required'
      }
    } else {
      // Project flow validation (no team required)
      if (step === 0) {
        if (!formData.name.trim()) newErrors.name = 'Project name is required'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle next step
  const handleNext = async () => {
    if (!validateStep(currentStep)) return

    // Auto-add pending collaborator/contributor when leaving Collaborators step (step 2)
    if (currentStep === 2 && newCollaborator.name && newCollaborator.email) {
      setFormData({
        ...formData,
        collaborators: [...formData.collaborators, newCollaborator],
      })
      setNewCollaborator({ name: '', email: '', role: 'teammate' })
    }

    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  // Handle final submission - create campaign at the end
  const handleFinish = async () => {
    if (!validateStep(currentStep)) return

    if (!createdCampaignId) {
      const result = await onSubmit(formData)
      if (result?.id) {
        setCreatedCampaignId(result.id)
      }
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    } else if (currentStep === 0) {
      setCurrentStep(-1) // Go back to subject selection
    }
  }

  const goToStep = (step: number) => {
    setCurrentStep(step)
  }

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
                  const isDisabled = option.disabled
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => {
                        if (!isDisabled) handleSubjectTypeSelect(option.id)
                      }}
                      disabled={isDisabled}
                      className={cn(
                        'flex items-center gap-4 p-4 rounded-lg transition-colors border text-left',
                        isDisabled
                          ? 'cursor-not-allowed opacity-60 border-border'
                          : 'border-border hover:bg-secondary/30 hover:border-foreground/20'
                      )}
                    >
                      <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-secondary text-muted-foreground">
                        <Icon className="w-6 h-6" weight="bold" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{option.label}</span>
                          {option.comingSoon && (
                            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                              Coming Soon
                            </span>
                          )}
                        </div>
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
            <>
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
                <Input
                  label="Email"
                  type="email"
                  placeholder="name@company.com"
                  value={formData.expertEmail}
                  onChange={(e) => setFormData({ ...formData, expertEmail: e.target.value })}
                  error={errors.expertEmail}
                  hint="Optional - used to send interview invitations"
                />
                <Input
                  label="Departure Date"
                  type="date"
                  value={formData.departureDate}
                  onChange={(e) => setFormData({ ...formData, departureDate: e.target.value })}
                  error={errors.departureDate}
                  hint="Optional - when is the expert leaving?"
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>

            {/* Initiative Details */}
            <div className="border rounded-lg bg-card">
              <div className="p-4 border-b flex items-center gap-3">
                <div className="p-2 rounded-md bg-secondary">
                  <Wrench className="w-4 h-4 text-muted-foreground" weight="bold" />
                </div>
                <div>
                  <h3 className="font-medium">Initiative Details</h3>
                  <p className="text-xs text-muted-foreground">
                    Optional metadata for portfolio tracking
                  </p>
                </div>
              </div>
              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Region</label>
                  <select
                    value={formData.region || ''}
                    onChange={(e) => setFormData({ ...formData, region: e.target.value || undefined })}
                    className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                  >
                    <option value="">Select region...</option>
                    {REGIONS.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Initiative Type</label>
                  <select
                    value={formData.initiativeType || ''}
                    onChange={(e) => setFormData({ ...formData, initiativeType: (e.target.value || undefined) as CampaignFormData['initiativeType'] })}
                    className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                  >
                    <option value="">Select type...</option>
                    {(Object.entries(INITIATIVE_TYPES) as [string, { label: string }][]).map(([key, val]) => (
                      <option key={key} value={key}>{val.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Initiative Status</label>
                  <div className="flex flex-wrap gap-2">
                    {(Object.entries(MATURITY_STAGES) as [string, { label: string; color: string; bgColor: string; borderColor: string }][]).map(([key, val]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setFormData({ ...formData, initiativeStatus: key as CampaignFormData['initiativeStatus'] })}
                        className={cn(
                          'px-3 py-1.5 rounded-md text-sm font-medium transition-colors border',
                          formData.initiativeStatus === key
                            ? `${val.bgColor} ${val.color} ${val.borderColor}`
                            : 'border-border hover:bg-secondary/30'
                        )}
                      >
                        {val.label}
                      </button>
                    ))}
                  </div>
                </div>

                <Input
                  label="Team Size"
                  type="number"
                  placeholder="e.g., 5"
                  value={formData.teamSize?.toString() || ''}
                  onChange={(e) => setFormData({ ...formData, teamSize: e.target.value ? parseInt(e.target.value, 10) : undefined })}
                  hint="Number of people working on this initiative"
                />

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Tech Stack</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g., Python, TensorFlow, AWS"
                      value={techStackInput}
                      onChange={(e) => setTechStackInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ',') {
                          e.preventDefault()
                          const tags = techStackInput.split(',').map(t => t.trim()).filter(Boolean)
                          if (tags.length > 0) {
                            setFormData({ ...formData, techStack: [...(formData.techStack || []), ...tags] })
                            setTechStackInput('')
                          }
                        }
                      }}
                      className="flex-1 h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        const tags = techStackInput.split(',').map(t => t.trim()).filter(Boolean)
                        if (tags.length > 0) {
                          setFormData({ ...formData, techStack: [...(formData.techStack || []), ...tags] })
                          setTechStackInput('')
                        }
                      }}
                    >
                      Add
                    </Button>
                  </div>
                  {formData.techStack && formData.techStack.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {formData.techStack.map((tech, i) => (
                        <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-secondary text-xs font-medium">
                          {tech}
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, techStack: formData.techStack!.filter((_, j) => j !== i) })}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            <X className="w-3 h-3" weight="bold" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">Press Enter or comma to add tags</p>
                </div>

                <Input
                  label="Business Unit"
                  placeholder="e.g., Autonomous Driving, MBUX"
                  value={formData.businessUnit || ''}
                  onChange={(e) => setFormData({ ...formData, businessUnit: e.target.value || undefined })}
                />
              </div>
            </div>
            </>
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
                  teams={teams}
                  isLoading={teamsLoading}
                  onTeamsChange={setTeams}
                />
              </div>
            </div>
          )}

          {/* Step 2: Collaborators */}
          {currentStep === 2 && (
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

          {/* Step 3: Documents */}
          {currentStep === 3 && (
            <div className="border rounded-lg bg-card">
              <div className="p-4 border-b flex items-center gap-3">
                <div className="p-2 rounded-md bg-secondary">
                  <Files className="w-4 h-4 text-muted-foreground" weight="bold" />
                </div>
                <div>
                  <h3 className="font-medium">Documents</h3>
                  <p className="text-xs text-muted-foreground">
                    {formData.selectedDemoDocuments?.length
                      ? 'Select documents to include with this campaign'
                      : 'Upload files to provide context for capture sessions'}
                  </p>
                </div>
              </div>
              <div className="p-4">
                {formData.selectedDemoDocuments?.length ? (
                  <div className="space-y-2">
                    {(subjectType === 'person' ? DEMO_DOCUMENTS_EXPERT : DEMO_DOCUMENTS_PROJECT).map((doc) => {
                      const isSelected = formData.selectedDemoDocuments?.some(d => d.id === doc.id)
                      return (
                        <button
                          key={doc.id}
                          type="button"
                          onClick={() => {
                            const currentDocs = formData.selectedDemoDocuments || []
                            if (isSelected) {
                              setFormData({
                                ...formData,
                                selectedDemoDocuments: currentDocs.filter(d => d.id !== doc.id)
                              })
                            } else {
                              setFormData({
                                ...formData,
                                selectedDemoDocuments: [...currentDocs, doc]
                              })
                            }
                          }}
                          className={cn(
                            'w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-all',
                            isSelected
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:border-primary/50 hover:bg-secondary/30'
                          )}
                        >
                          <div className={cn(
                            'flex items-center justify-center w-5 h-5 rounded border-[1.5px] shrink-0 transition-colors',
                            isSelected
                              ? 'border-primary bg-primary'
                              : 'border-muted-foreground/40'
                          )}>
                            {isSelected && (
                              <Check className="w-3 h-3 text-primary-foreground" weight="bold" />
                            )}
                          </div>
                          <div className="p-2 rounded bg-secondary/50">
                            <FileText className="w-4 h-4 text-muted-foreground" weight="bold" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{doc.filename}</p>
                            <p className="text-xs text-muted-foreground truncate">{doc.description}</p>
                          </div>
                        </button>
                      )
                    })}
                    <p className="text-xs text-muted-foreground text-center pt-2">
                      {formData.selectedDemoDocuments.length} document{formData.selectedDemoDocuments.length !== 1 ? 's' : ''} selected
                    </p>
                  </div>
                ) : (
                  <div className="text-center space-y-3 py-2">
                    <div className="w-12 h-12 rounded-full bg-secondary/50 flex items-center justify-center mx-auto">
                      <Files className="w-6 h-6 text-muted-foreground" weight="bold" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Documents can be uploaded after the campaign is created.
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        You&apos;ll be able to add relevant files from the campaign page.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 4: Capture Format */}
          {currentStep === 4 && (
            <div className="space-y-6">
              {/* Capture Format */}
              <div className="border rounded-lg bg-card">
                <div className="p-4 border-b flex items-center gap-3">
                  <div className="p-2 rounded-md bg-secondary">
                    <Sparkle className="w-4 h-4 text-muted-foreground" weight="bold" />
                  </div>
                  <div>
                    <h3 className="font-medium">Capture Format</h3>
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
                          'flex items-center gap-4 p-4 rounded-lg transition-colors border',
                          option.disabled
                            ? 'cursor-not-allowed opacity-50 border-border'
                            : 'cursor-pointer',
                          !option.disabled && formData.interviewFormat === option.id
                            ? 'border-foreground bg-secondary/50'
                            : !option.disabled && 'border-border hover:bg-secondary/30'
                        )}
                        onClick={(e) => {
                          if (option.disabled) {
                            e.preventDefault()
                          }
                        }}
                      >
                        <input
                          type="radio"
                          name="capture-format"
                          value={option.id}
                          checked={formData.interviewFormat === option.id}
                          onChange={() => {
                            if (!option.disabled) {
                              setFormData({ ...formData, interviewFormat: option.id })
                            }
                          }}
                          disabled={option.disabled}
                          className="sr-only"
                        />
                        <div
                          className={cn(
                            'w-4 h-4 rounded-full border-2 flex items-center justify-center',
                            formData.interviewFormat === option.id && !option.disabled
                              ? 'border-foreground'
                              : 'border-muted-foreground'
                          )}
                        >
                          {formData.interviewFormat === option.id && !option.disabled && (
                            <div className="w-2 h-2 rounded-full bg-foreground" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{option.label}</span>
                            {option.comingSoon && (
                              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                                Coming Soon
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {option.description}
                          </p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Session Duration */}
              <div className="border rounded-lg bg-card">
                <div className="p-4 border-b flex items-center gap-3">
                  <div className="p-2 rounded-md bg-secondary">
                    <Clock className="w-4 h-4 text-muted-foreground" weight="bold" />
                  </div>
                  <div>
                    <h3 className="font-medium">Session Duration</h3>
                    <p className="text-xs text-muted-foreground">
                      Target length for each capture session
                    </p>
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex gap-2">
                    {sessionDurationOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setFormData({ ...formData, sessionDuration: option.value })}
                        className={cn(
                          'flex-1 px-4 py-3 rounded-lg text-sm font-medium transition-colors border',
                          formData.sessionDuration === option.value
                            ? 'border-foreground bg-secondary/50'
                            : 'border-border hover:bg-secondary/30'
                        )}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-3">
                    AI will plan sessions to fit within this duration based on the topics to cover.
                  </p>
                </div>
              </div>
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
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

                <Input
                  label="Project Name"
                  placeholder="e.g., Payment Gateway v2, Customer Onboarding Process"
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

          {/* Step 1: Documents */}
          {currentStep === 1 && (
            <div className="border rounded-lg bg-card">
              <div className="p-4 border-b flex items-center gap-3">
                <div className="p-2 rounded-md bg-secondary">
                  <Files className="w-4 h-4 text-muted-foreground" weight="bold" />
                </div>
                <div>
                  <h3 className="font-medium">Documents</h3>
                  <p className="text-xs text-muted-foreground">
                    {formData.selectedDemoDocuments?.length
                      ? 'Select documents to include with this campaign'
                      : 'Upload project artifacts (specs, docs, diagrams)'}
                  </p>
                </div>
              </div>
              <div className="p-4">
                {formData.selectedDemoDocuments?.length ? (
                  <div className="space-y-2">
                    {DEMO_DOCUMENTS_PROJECT.map((doc) => {
                      const isSelected = formData.selectedDemoDocuments?.some(d => d.id === doc.id)
                      return (
                        <button
                          key={doc.id}
                          type="button"
                          onClick={() => {
                            const currentDocs = formData.selectedDemoDocuments || []
                            if (isSelected) {
                              setFormData({
                                ...formData,
                                selectedDemoDocuments: currentDocs.filter(d => d.id !== doc.id)
                              })
                            } else {
                              setFormData({
                                ...formData,
                                selectedDemoDocuments: [...currentDocs, doc]
                              })
                            }
                          }}
                          className={cn(
                            'w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-all',
                            isSelected
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:border-primary/50 hover:bg-secondary/30'
                          )}
                        >
                          <div className={cn(
                            'flex items-center justify-center w-5 h-5 rounded border-[1.5px] shrink-0 transition-colors',
                            isSelected
                              ? 'border-primary bg-primary'
                              : 'border-muted-foreground/40'
                          )}>
                            {isSelected && (
                              <Check className="w-3 h-3 text-primary-foreground" weight="bold" />
                            )}
                          </div>
                          <div className="p-2 rounded bg-secondary/50">
                            <FileText className="w-4 h-4 text-muted-foreground" weight="bold" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{doc.filename}</p>
                            <p className="text-xs text-muted-foreground truncate">{doc.description}</p>
                          </div>
                        </button>
                      )
                    })}
                    <p className="text-xs text-muted-foreground text-center pt-2">
                      {formData.selectedDemoDocuments.length} document{formData.selectedDemoDocuments.length !== 1 ? 's' : ''} selected
                    </p>
                  </div>
                ) : (
                  <div className="text-center space-y-3 py-2">
                    <div className="w-12 h-12 rounded-full bg-secondary/50 flex items-center justify-center mx-auto">
                      <Files className="w-6 h-6 text-muted-foreground" weight="bold" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Documents can be uploaded after the campaign is created.
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        You&apos;ll be able to add project artifacts from the campaign page.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Contributors */}
          {currentStep === 2 && (
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

          {/* Step 3: Capture Mode */}
          {currentStep === 3 && (
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

              {/* Capture Format */}
              <div className="border rounded-lg bg-card">
                <div className="p-4 border-b flex items-center gap-3">
                  <div className="p-2 rounded-md bg-secondary">
                    <Sparkle className="w-4 h-4 text-muted-foreground" weight="bold" />
                  </div>
                  <div>
                    <h3 className="font-medium">Capture Format</h3>
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
                          'flex items-center gap-4 p-4 rounded-lg transition-colors border',
                          option.disabled
                            ? 'cursor-not-allowed opacity-50 border-border'
                            : 'cursor-pointer',
                          !option.disabled && formData.interviewFormat === option.id
                            ? 'border-foreground bg-secondary/50'
                            : !option.disabled && 'border-border hover:bg-secondary/30'
                        )}
                        onClick={(e) => {
                          if (option.disabled) {
                            e.preventDefault()
                          }
                        }}
                      >
                        <input
                          type="radio"
                          name="capture-format-project"
                          value={option.id}
                          checked={formData.interviewFormat === option.id}
                          onChange={() => {
                            if (!option.disabled) {
                              setFormData({ ...formData, interviewFormat: option.id })
                            }
                          }}
                          disabled={option.disabled}
                          className="sr-only"
                        />
                        <div
                          className={cn(
                            'w-4 h-4 rounded-full border-2 flex items-center justify-center',
                            formData.interviewFormat === option.id && !option.disabled
                              ? 'border-foreground'
                              : 'border-muted-foreground'
                          )}
                        >
                          {formData.interviewFormat === option.id && !option.disabled && (
                            <div className="w-2 h-2 rounded-full bg-foreground" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{option.label}</span>
                            {option.comingSoon && (
                              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                                Coming Soon
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {option.description}
                          </p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Session Duration */}
              <div className="border rounded-lg bg-card">
                <div className="p-4 border-b flex items-center gap-3">
                  <div className="p-2 rounded-md bg-secondary">
                    <Clock className="w-4 h-4 text-muted-foreground" weight="bold" />
                  </div>
                  <div>
                    <h3 className="font-medium">Session Duration</h3>
                    <p className="text-xs text-muted-foreground">
                      Target length for each capture session
                    </p>
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex gap-2">
                    {sessionDurationOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setFormData({ ...formData, sessionDuration: option.value })}
                        className={cn(
                          'flex-1 px-4 py-3 rounded-lg text-sm font-medium transition-colors border',
                          formData.sessionDuration === option.value
                            ? 'border-foreground bg-secondary/50'
                            : 'border-border hover:bg-secondary/30'
                        )}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-3">
                    AI will plan sessions to fit within this duration based on the topics to cover.
                  </p>
                </div>
              </div>
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

        {currentStep < STEPS.length - 1 ? (
          <Button type="button" onClick={handleNext}>
            Next
            <ArrowRight className="w-4 h-4 ml-2" weight="bold" />
          </Button>
        ) : (
          <Button type="button" onClick={handleFinish} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <CircleNotch className="w-4 h-4 mr-2 animate-spin" weight="bold" />
                Creating...
              </>
            ) : (
              <>
                Create Campaign
                <ArrowRight className="w-4 h-4 ml-2" weight="bold" />
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  )
}
