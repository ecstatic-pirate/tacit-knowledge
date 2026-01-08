'use client'

import { useEffect, useState, useCallback, use } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  ArrowLeft,
  CircleNotch,
  Check,
  Clock,
  User,
  Users,
  EnvelopeSimple,
  PaperPlaneTilt,
  Copy,
  Warning,
  Plus,
  PencilSimple,
  Trash,
  CaretDown,
  CaretUp,
  Briefcase,
  Target,
  ChatCircleText,
  Lightbulb,
  Lightning,
  File,
  CheckCircle,
  Calendar,
  Book,
  ArrowSquareOut,
  ChartBar,
  Clipboard,
} from 'phosphor-react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'
import { cn } from '@/lib/utils'
import { Modal } from '@/components/ui/modal'
import type { CampaignAccessToken, CollaboratorResponse, Campaign, SelfAssessment, Json } from '@/lib/supabase/database.types'
import { containers } from '@/lib/design-system'
import { SessionForm, SessionList } from '@/components/sessions'
import { useKnowledgeCoverageStats } from '@/lib/hooks/use-knowledge-coverage'
import { CoverageBar } from '@/components/ui/coverage-bar'

type TabId = 'overview' | 'interviews' | 'preparation' | 'feedback'

interface CampaignWithDetails extends Campaign {
  organizations?: { name: string } | null
}

interface TokenWithDetails extends CampaignAccessToken {
  response?: CollaboratorResponse | null
}

interface Collaborator {
  name: string
  email: string
  role: string
}

interface Skill {
  id: string
  name: string
  category: string | null
  captured: boolean
}

interface Document {
  id: string
  filename: string
  file_type: string | null
  ai_processed: boolean
  extracted_skills: unknown
}

interface Session {
  id: string
  sessionNumber: number
  title?: string
  scheduledAt: string
  durationMinutes: number
  status: string
  topics: string[]
  aiSuggestedTopics?: Array<{
    topic: string
    description?: string
    questions?: string[]
  }>
  calendarEventId?: string
  calendarProvider?: string
}

type SubmissionStatus = 'pending' | 'submitted' | 'expired'

function getSubmissionStatus(token: TokenWithDetails): SubmissionStatus {
  if (token.submitted_at) return 'submitted'
  if (new Date(token.expires_at) < new Date()) return 'expired'
  return 'pending'
}

function StatusBadge({ status }: { status: SubmissionStatus | 'not_sent' }) {
  const styles = {
    pending: 'bg-amber-100 text-amber-700',
    submitted: 'bg-emerald-100 text-emerald-700',
    expired: 'bg-red-100 text-red-700',
    not_sent: 'bg-stone-100 text-stone-600',
  }

  const labels = {
    pending: 'Pending',
    submitted: 'Submitted',
    expired: 'Expired',
    not_sent: 'Not Sent',
  }

  return (
    <span className={cn('px-2 py-0.5 rounded text-xs font-medium', styles[status])}>
      {labels[status]}
    </span>
  )
}

const roleLabels: Record<string, string> = {
  successor: 'Successor',
  teammate: 'Teammate',
  partner: 'Partner',
  manager: 'Manager',
  report: 'Direct Report',
}

const roleOptions = [
  { value: 'successor', label: 'Successor - Taking over responsibilities' },
  { value: 'teammate', label: 'Teammate - Works alongside daily' },
  { value: 'partner', label: 'Partner - Cross-functional collaborator' },
  { value: 'manager', label: 'Manager - Direct supervisor' },
  { value: 'report', label: 'Direct Report - Supervised by expert' },
]

export default function CampaignDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const campaignId = resolvedParams.id
  const router = useRouter()
  const { showToast } = useToast()
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [campaign, setCampaign] = useState<CampaignWithDetails | null>(null)
  const [tokens, setTokens] = useState<TokenWithDetails[]>([])
  const [responses, setResponses] = useState<CollaboratorResponse[]>([])
  const [resending, setResending] = useState<string | null>(null)
  const [sendingInvitations, setSendingInvitations] = useState(false)

  // Collaborator modal state
  const [collaboratorModalOpen, setCollaboratorModalOpen] = useState(false)
  const [editingCollaborator, setEditingCollaborator] = useState<{ index: number; data: Collaborator } | null>(null)
  const [collaboratorForm, setCollaboratorForm] = useState<Collaborator>({ name: '', email: '', role: 'teammate' })
  const [savingCollaborator, setSavingCollaborator] = useState(false)

  // Skills, documents, and sessions
  const [skills, setSkills] = useState<Skill[]>([])
  const [documents, setDocuments] = useState<Document[]>([])
  const [sessions, setSessions] = useState<Session[]>([])

  // Tab state
  const [activeTab, setActiveTab] = useState<TabId>('overview')

  // Knowledge coverage
  const { coveragePercentage, coveredCount, mentionedCount, notDiscussedCount, totalCount: topicCount, isLoading: coverageLoading } = useKnowledgeCoverageStats(campaignId)

  // Expandable sections
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({})

  const toggleSection = (id: string) => {
    setExpandedSections(prev => ({ ...prev, [id]: !prev[id] }))
  }

  // Fetch campaign and tokens
  const fetchData = useCallback(async () => {
    setLoading(true)

    // Fetch campaign
    const { data: campaignData, error: campaignError } = await supabase
      .from('campaigns')
      .select('*, organizations(name)')
      .eq('id', campaignId)
      .single()

    if (campaignError || !campaignData) {
      console.error('Error fetching campaign:', campaignError)
      router.push('/dashboard')
      return
    }

    setCampaign(campaignData)

    // Fetch tokens
    const { data: tokensData, error: tokensError } = await supabase
      .from('campaign_access_tokens')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('token_type', { ascending: true })
      .order('created_at', { ascending: true })

    if (tokensError) {
      console.error('Error fetching tokens:', tokensError)
    }

    // Fetch collaborator responses
    const { data: responsesData } = await supabase
      .from('collaborator_responses')
      .select('*')
      .eq('campaign_id', campaignId)

    if (responsesData) {
      setResponses(responsesData)
    }

    if (tokensData) {
      const tokensWithResponses: TokenWithDetails[] = tokensData.map(token => ({
        ...token,
        response: responsesData?.find(r => r.token_id === token.id) || null,
      }))
      setTokens(tokensWithResponses)
    }

    // Fetch skills
    const { data: skillsData } = await supabase
      .from('skills')
      .select('id, name, category, captured')
      .eq('campaign_id', campaignId)
      .is('deleted_at', null)
      .order('created_at', { ascending: true })

    if (skillsData) {
      setSkills(skillsData.map(s => ({ ...s, captured: s.captured ?? false })))
    }

    // Fetch documents
    const { data: documentsData } = await supabase
      .from('documents')
      .select('id, filename, file_type, ai_processed, extracted_skills')
      .eq('campaign_id', campaignId)
      .is('deleted_at', null)
      .order('created_at', { ascending: true })

    if (documentsData) {
      setDocuments(documentsData.map(d => ({ ...d, ai_processed: d.ai_processed ?? false })))
    }

    // Fetch sessions
    const { data: sessionsData } = await supabase
      .from('sessions')
      .select('*')
      .eq('campaign_id', campaignId)
      .is('deleted_at', null)
      .order('session_number', { ascending: true })

    if (sessionsData) {
      setSessions(sessionsData.map(s => ({
        id: s.id,
        sessionNumber: s.session_number,
        title: s.title || undefined,
        scheduledAt: s.scheduled_at || '',
        durationMinutes: s.duration_minutes || 60,
        status: s.status || 'scheduled',
        topics: s.topics || [],
        aiSuggestedTopics: (s.ai_suggested_topics as Session['aiSuggestedTopics']) || [],
        calendarEventId: s.calendar_event_id || undefined,
        calendarProvider: s.calendar_provider || undefined,
      })))
    }

    setLoading(false)
  }, [supabase, campaignId, router])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Real-time subscription
  useEffect(() => {
    const tokenSubscription = supabase
      .channel('campaign-tokens')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'campaign_access_tokens', filter: `campaign_id=eq.${campaignId}` }, () => fetchData())
      .subscribe()

    const responseSubscription = supabase
      .channel('collaborator-responses')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'collaborator_responses', filter: `campaign_id=eq.${campaignId}` }, () => fetchData())
      .subscribe()

    const campaignSubscription = supabase
      .channel('campaign-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'campaigns', filter: `id=eq.${campaignId}` }, () => fetchData())
      .subscribe()

    const sessionsSubscription = supabase
      .channel('campaign-sessions')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sessions', filter: `campaign_id=eq.${campaignId}` }, () => fetchData())
      .subscribe()

    return () => {
      tokenSubscription.unsubscribe()
      responseSubscription.unsubscribe()
      campaignSubscription.unsubscribe()
      sessionsSubscription.unsubscribe()
    }
  }, [supabase, campaignId, fetchData])

  const copyLink = (token: string, type: 'assess' | 'feedback') => {
    const baseUrl = window.location.origin
    const url = type === 'assess' ? `${baseUrl}/assess/${token}` : `${baseUrl}/feedback/${token}`
    navigator.clipboard.writeText(url)
    showToast('Link copied to clipboard')
  }

  const sendInvitations = async () => {
    setSendingInvitations(true)
    try {
      const response = await fetch(`/api/campaigns/${campaignId}/send-invitations`, { method: 'POST' })
      if (response.ok) {
        const data = await response.json()
        showToast(`Invitations sent! ${data.emailsSent || 0} emails sent.`)
        fetchData()
      } else {
        const error = await response.json()
        showToast(error.error || 'Failed to send invitations', 'error')
      }
    } catch (error) {
      console.error('Error sending invitations:', error)
      showToast('Failed to send invitations', 'error')
    } finally {
      setSendingInvitations(false)
    }
  }

  const resendInvitation = async (tokenId: string) => {
    setResending(tokenId)
    showToast('Invitation resent (placeholder)', 'info')
    setResending(null)
  }

  // Generate a shareable link without sending email
  const [generatingLink, setGeneratingLink] = useState<string | null>(null)
  const [generatingGuideLink, setGeneratingGuideLink] = useState(false)

  const generateLink = async (
    type: 'expert' | 'collaborator',
    email: string,
    name: string,
    role?: string
  ) => {
    const linkId = type === 'expert' ? 'expert' : email
    setGeneratingLink(linkId)

    try {
      // Generate cryptographic token
      const tokenBytes = new Uint8Array(32)
      crypto.getRandomValues(tokenBytes)
      const token = Array.from(tokenBytes).map(b => b.toString(16).padStart(2, '0')).join('')

      // Insert token into database
      const { error } = await supabase
        .from('campaign_access_tokens')
        .insert({
          campaign_id: campaignId,
          token,
          token_type: type === 'expert' ? 'expert' : 'collaborator',
          email,
          name,
          role: type === 'collaborator' ? role : null,
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
        })

      if (error) {
        console.error('Error creating token:', error)
        showToast('Failed to generate link', 'error')
        return
      }

      // Copy to clipboard
      const baseUrl = window.location.origin
      const url = type === 'expert' ? `${baseUrl}/assess/${token}` : `${baseUrl}/feedback/${token}`
      await navigator.clipboard.writeText(url)
      showToast('Link generated and copied to clipboard!')

      // Refresh data to show the new token
      fetchData()
    } catch (error) {
      console.error('Error generating link:', error)
      showToast('Failed to generate link', 'error')
    } finally {
      setGeneratingLink(null)
    }
  }

  // Generate or copy interviewer guide link
  const generateGuideLink = async () => {
    setGeneratingGuideLink(true)
    try {
      let token = campaign?.interviewer_guide_token

      // If no token exists, generate one
      if (!token) {
        const tokenBytes = new Uint8Array(32)
        crypto.getRandomValues(tokenBytes)
        token = Array.from(tokenBytes).map(b => b.toString(16).padStart(2, '0')).join('')

        // Save token to database
        const { error } = await supabase
          .from('campaigns')
          .update({ interviewer_guide_token: token })
          .eq('id', campaignId)

        if (error) {
          console.error('Error saving guide token:', error)
          showToast('Failed to generate guide link', 'error')
          return
        }

        // Update local state
        setCampaign(prev => prev ? { ...prev, interviewer_guide_token: token ?? null } : null)
      }

      // Copy to clipboard
      const baseUrl = window.location.origin
      const url = `${baseUrl}/guide/${token}`
      await navigator.clipboard.writeText(url)
      showToast('Interviewer guide link copied to clipboard!')
    } catch (error) {
      console.error('Error generating guide link:', error)
      showToast('Failed to generate guide link', 'error')
    } finally {
      setGeneratingGuideLink(false)
    }
  }

  // Collaborator management
  const openAddCollaborator = () => {
    setEditingCollaborator(null)
    setCollaboratorForm({ name: '', email: '', role: 'teammate' })
    setCollaboratorModalOpen(true)
  }

  const openEditCollaborator = (index: number, collab: Collaborator) => {
    setEditingCollaborator({ index, data: collab })
    setCollaboratorForm(collab)
    setCollaboratorModalOpen(true)
  }

  const saveCollaborator = async () => {
    if (!collaboratorForm.name || !collaboratorForm.email) {
      showToast('Please fill in all fields', 'error')
      return
    }

    setSavingCollaborator(true)
    const currentCollaborators = [...((campaign?.collaborators as unknown as Collaborator[]) || [])]

    if (editingCollaborator !== null) {
      currentCollaborators[editingCollaborator.index] = collaboratorForm
    } else {
      currentCollaborators.push(collaboratorForm)
    }

    const { error } = await supabase
      .from('campaigns')
      .update({ collaborators: currentCollaborators as unknown as Json })
      .eq('id', campaignId)

    if (error) {
      showToast('Failed to save collaborator', 'error')
    } else {
      showToast(editingCollaborator ? 'Collaborator updated' : 'Collaborator added')
      setCollaboratorModalOpen(false)
      fetchData()
    }
    setSavingCollaborator(false)
  }

  const removeCollaborator = async (index: number) => {
    const currentCollaborators = [...((campaign?.collaborators as unknown as Collaborator[]) || [])]
    currentCollaborators.splice(index, 1)

    const { error } = await supabase
      .from('campaigns')
      .update({ collaborators: currentCollaborators as unknown as Json })
      .eq('id', campaignId)

    if (error) {
      showToast('Failed to remove collaborator', 'error')
    } else {
      showToast('Collaborator removed')
      fetchData()
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <CircleNotch className="w-8 h-8 animate-spin text-muted-foreground" weight="bold" />
      </div>
    )
  }

  if (!campaign) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Warning className="w-12 h-12 text-muted-foreground mx-auto mb-4" weight="bold" />
          <h1 className="text-xl font-semibold mb-2">Campaign not found</h1>
          <Button onClick={() => router.push('/dashboard')}>Go to Dashboard</Button>
        </div>
      </div>
    )
  }

  const expertToken = tokens.find(t => t.token_type === 'expert')
  const collaboratorTokens = tokens.filter(t => t.token_type === 'collaborator')
  const campaignCollaborators = ((campaign.collaborators || []) as unknown) as Collaborator[]
  const hasExpertEmail = !!campaign.expert_email
  const hasCollaborators = campaignCollaborators.length > 0
  const noTokensYet = tokens.length === 0
  const needsInvitations = noTokensYet && (hasExpertEmail || hasCollaborators)
  const selfAssessment = campaign.self_assessment as SelfAssessment | null

  const submittedCount = tokens.filter(t => t.submitted_at).length
  const totalCount = noTokensYet ? (hasExpertEmail ? 1 : 0) + campaignCollaborators.length : tokens.length

  return (
    <div className={containers.pageContainer}>
      <div className={containers.wideContainer}>
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-semibold">{campaign.expert_name}</h1>
              <p className="text-muted-foreground">
                {campaign.expert_role}
                {campaign.department && ` · ${campaign.department}`}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Campaign Progress</p>
              <p className="text-lg font-semibold">{submittedCount}/{totalCount} submissions</p>
            </div>
          </div>
        </div>

        {/* Send Invitations Banner */}
        {needsInvitations && (
          <div className="mb-6 p-4 bg-amber-50 rounded-lg border border-amber-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <EnvelopeSimple className="w-5 h-5 text-amber-600" weight="bold" />
              <div>
                <p className="font-medium text-amber-900">Invitations not sent yet</p>
                <p className="text-sm text-amber-700">
                  {hasExpertEmail && hasCollaborators
                    ? `Expert and ${campaignCollaborators.length} collaborator${campaignCollaborators.length > 1 ? 's' : ''} waiting`
                    : hasExpertEmail ? 'Expert waiting' : `${campaignCollaborators.length} collaborator${campaignCollaborators.length > 1 ? 's' : ''} waiting`}
                </p>
              </div>
            </div>
            <Button onClick={sendInvitations} disabled={sendingInvitations}>
              {sendingInvitations ? <CircleNotch className="w-4 h-4 mr-2 animate-spin" weight="bold" /> : <PaperPlaneTilt className="w-4 h-4 mr-2" />}
              {sendingInvitations ? 'Sending...' : 'Send Invitations'}
            </Button>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex border-b mb-6">
          {[
            { id: 'overview' as TabId, label: 'Overview', icon: Target },
            { id: 'interviews' as TabId, label: 'Interviews', icon: Calendar },
            { id: 'preparation' as TabId, label: 'Preparation', icon: Clipboard },
            { id: 'feedback' as TabId, label: 'Feedback', icon: ChatCircleText },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors',
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30'
              )}
            >
              <tab.icon className="w-4 h-4" weight={activeTab === tab.id ? 'fill' : 'bold'} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <>
            {/* Knowledge Coverage Section */}
            <section className="mb-8">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <ChartBar className="w-5 h-5" weight="bold" />
                Knowledge Coverage
              </h2>
              <div className="border rounded-lg bg-card p-5">
                {topicCount > 0 ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold">{coveragePercentage}%</span>
                      <span className="text-sm text-muted-foreground">
                        {coveredCount} of {topicCount} topics covered
                      </span>
                    </div>
                    <CoverageBar
                      segments={[
                        { label: 'Covered', value: coveredCount, color: 'bg-emerald-500' },
                        { label: 'Mentioned', value: mentionedCount, color: 'bg-amber-400' },
                        { label: 'To Discuss', value: notDiscussedCount, color: 'bg-zinc-200' },
                      ]}
                      size="lg"
                    />
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-emerald-500" />
                        <span className="text-muted-foreground">Covered ({coveredCount})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-amber-400" />
                        <span className="text-muted-foreground">Mentioned ({mentionedCount})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-zinc-200" />
                        <span className="text-muted-foreground">To Discuss ({notDiscussedCount})</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    <ChartBar className="w-8 h-8 mx-auto mb-2" weight="bold" />
                    <p>No topics to track yet</p>
                    <p className="text-sm">Topics will be created during interview sessions</p>
                  </div>
                )}
              </div>
            </section>

            {/* Campaign Details Section */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Target className="w-5 h-5" weight="bold" />
            Campaign Details
          </h2>
          <div className="border rounded-lg bg-card p-5 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Expert</p>
                <p className="font-medium">{campaign.expert_name}</p>
                <p className="text-sm text-muted-foreground">{campaign.expert_email}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Role & Department</p>
                <p className="font-medium">{campaign.expert_role}</p>
                <p className="text-sm text-muted-foreground">{campaign.department || 'No department'}</p>
              </div>
            </div>
            {campaign.years_experience && (
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Experience</p>
                <p className="flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-muted-foreground" />
                  {campaign.years_experience} years
                </p>
              </div>
            )}
            {campaign.goal && (
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Campaign Goal</p>
                <p className="text-muted-foreground">{campaign.goal}</p>
              </div>
            )}
            {campaign.capture_mode && (
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Capture Mode</p>
                <p className="capitalize">{campaign.capture_mode}</p>
              </div>
            )}
          </div>
        </section>
          </>
        )}

        {/* Interviews Tab */}
        {activeTab === 'interviews' && (
          <>
            {/* Interview Plan Section */}
            <section className="mb-8">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5" weight="bold" />
                Interview Plan
                <span className="text-sm font-normal text-muted-foreground">
                  ({sessions.filter(s => s.status === 'completed').length}/{sessions.length} completed)
                </span>
              </h2>
              <div className="border rounded-lg bg-card overflow-hidden">
                {/* Add session form */}
                <div className="p-5 border-b bg-neutral-50/50 relative">
                  <SessionForm
                    campaignId={campaignId}
                    nextSessionNumber={sessions.length > 0 ? Math.max(...sessions.map(s => s.sessionNumber)) + 1 : 1}
                    onSessionCreated={fetchData}
                  />
                </div>

                {/* Sessions list */}
                <div className="p-5">
                  <SessionList
                    sessions={sessions}
                    showLinks
                    onSessionDeleted={fetchData}
                    emptyMessage="No sessions added yet. Add your first session above."
                  />
                </div>
              </div>
            </section>
          </>
        )}

        {/* Preparation Tab */}
        {activeTab === 'preparation' && (
          <>
            {/* Skills Section */}
        {skills.length > 0 && (
          <section className="mb-8">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Lightning className="w-5 h-5" weight="bold" />
              Skills to Capture
              <span className="text-sm font-normal text-muted-foreground">
                ({skills.filter(s => s.captured).length}/{skills.length} captured)
              </span>
            </h2>
            <div className="border rounded-lg bg-card p-5">
              <div className="flex flex-wrap gap-2">
                {skills.map(skill => (
                  <div
                    key={skill.id}
                    className={cn(
                      'px-3 py-1.5 rounded-full text-sm flex items-center gap-2',
                      skill.captured
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-secondary text-foreground'
                    )}
                  >
                    {skill.captured && <CheckCircle className="w-3.5 h-3.5" weight="fill" />}
                    {skill.name}
                    {skill.category && (
                      <span className="text-xs text-muted-foreground">({skill.category})</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Documents Section */}
        {documents.length > 0 && (
          <section className="mb-8">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <File className="w-5 h-5" weight="bold" />
              Uploaded Documents
              <span className="text-sm font-normal text-muted-foreground">
                ({documents.length} file{documents.length !== 1 ? 's' : ''})
              </span>
            </h2>
            <div className="border rounded-lg bg-card divide-y">
              {documents.map(doc => (
                <div key={doc.id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                      <File className="w-5 h-5 text-muted-foreground" weight="bold" />
                    </div>
                    <div>
                      <p className="font-medium">{doc.filename}</p>
                      <p className="text-xs text-muted-foreground">
                        {doc.file_type || 'Unknown type'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {doc.ai_processed ? (
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-700 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" weight="fill" />
                        Processed
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-stone-100 text-stone-600">
                        Pending
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Interviewer Guide Section */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Book className="w-5 h-5" weight="bold" />
            Interviewer Guide
          </h2>
          <div className="border rounded-lg bg-card p-5">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center flex-shrink-0">
                <Book className="w-6 h-6 text-primary-foreground" weight="bold" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium mb-1">Share Interview Preparation Guide</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Generate a shareable link that gives interviewers access to all the context they need - expert background,
                  session topics, skills to capture, and collaborator insights - all in one place without requiring login.
                </p>
                <div className="flex items-center gap-3">
                  <Button
                    onClick={generateGuideLink}
                    disabled={generatingGuideLink}
                    className="gap-2"
                  >
                    {generatingGuideLink ? (
                      <CircleNotch className="w-4 h-4 animate-spin" weight="bold" />
                    ) : campaign?.interviewer_guide_token ? (
                      <Copy className="w-4 h-4" />
                    ) : (
                      <ArrowSquareOut className="w-4 h-4" />
                    )}
                    {campaign?.interviewer_guide_token ? 'Copy Guide Link' : 'Generate Guide Link'}
                  </Button>
                  {campaign?.interviewer_guide_token && (
                    <a
                      href={`/guide/${campaign.interviewer_guide_token}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline flex items-center gap-1"
                    >
                      Open Guide
                      <ArrowSquareOut className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Expert Self-Assessment Section */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <User className="w-5 h-5" weight="bold" />
            Expert Self-Assessment
          </h2>

          {expertToken ? (
            <div className="border rounded-lg bg-card">
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                    <User className="w-5 h-5 text-muted-foreground" weight="bold" />
                  </div>
                  <div>
                    <p className="font-medium">{expertToken.name || campaign.expert_name}</p>
                    <p className="text-sm text-muted-foreground">{expertToken.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={getSubmissionStatus(expertToken)} />
                  {expertToken.submitted_at && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Check className="w-3.5 h-3.5 text-emerald-500" weight="bold" />
                      {new Date(expertToken.submitted_at).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>

              <div className="px-4 pb-4 flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => copyLink(expertToken.token, 'assess')}>
                  <Copy className="w-4 h-4 mr-1.5" /> Copy Link
                </Button>
                {!expertToken.submitted_at && (
                  <Button variant="outline" size="sm" onClick={() => resendInvitation(expertToken.id)} disabled={resending === expertToken.id}>
                    {resending === expertToken.id ? <CircleNotch className="w-4 h-4 mr-1.5 animate-spin" weight="bold" /> : <PaperPlaneTilt className="w-4 h-4 mr-1.5" />}
                    Resend
                  </Button>
                )}
              </div>

              {/* Show submitted self-assessment */}
              {selfAssessment && Object.keys(selfAssessment).length > 0 && (
                <div className="border-t">
                  <button
                    onClick={() => toggleSection('self-assessment')}
                    className="w-full p-4 flex items-center justify-between hover:bg-secondary/30 transition-colors"
                  >
                    <span className="text-sm font-medium flex items-center gap-2">
                      <Lightbulb className="w-4 h-4" />
                      View Self-Assessment Response
                    </span>
                    {expandedSections['self-assessment'] ? <CaretUp className="w-4 h-4" /> : <CaretDown className="w-4 h-4" />}
                  </button>
                  {expandedSections['self-assessment'] && (
                    <div className="p-4 pt-0 space-y-4">
                      {selfAssessment.what_you_know && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">What They Know Best</p>
                          <p className="text-sm">{selfAssessment.what_you_know}</p>
                        </div>
                      )}
                      {selfAssessment.questions_people_ask && selfAssessment.questions_people_ask.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Questions People Ask Them</p>
                          <ul className="list-disc list-inside text-sm space-y-1">
                            {selfAssessment.questions_people_ask.map((q, i) => <li key={i}>{q}</li>)}
                          </ul>
                        </div>
                      )}
                      {selfAssessment.what_will_break && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">What Would Break Without Them</p>
                          <p className="text-sm">{selfAssessment.what_will_break}</p>
                        </div>
                      )}
                      {selfAssessment.topics_to_cover && selfAssessment.topics_to_cover.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Topics to Cover</p>
                          <div className="flex flex-wrap gap-2">
                            {selfAssessment.topics_to_cover.map((t, i) => (
                              <span key={i} className="px-2 py-1 bg-secondary rounded text-xs">{t}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : hasExpertEmail ? (
            <div className="border rounded-lg bg-card">
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                    <User className="w-5 h-5 text-muted-foreground" weight="bold" />
                  </div>
                  <div>
                    <p className="font-medium">{campaign.expert_name}</p>
                    <p className="text-sm text-muted-foreground">{campaign.expert_email}</p>
                  </div>
                </div>
                <StatusBadge status="not_sent" />
              </div>
              <div className="px-4 pb-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => generateLink('expert', campaign.expert_email!, campaign.expert_name)}
                  disabled={generatingLink === 'expert'}
                >
                  {generatingLink === 'expert' ? (
                    <CircleNotch className="w-4 h-4 mr-1.5 animate-spin" weight="bold" />
                  ) : (
                    <Copy className="w-4 h-4 mr-1.5" />
                  )}
                  Get Link
                </Button>
              </div>
            </div>
          ) : (
            <div className="border rounded-lg bg-card p-6 text-center text-muted-foreground">
              <EnvelopeSimple className="w-8 h-8 mx-auto mb-2" weight="bold" />
              <p>No expert email configured</p>
            </div>
          )}
        </section>
          </>
        )}

        {/* Feedback Tab */}
        {activeTab === 'feedback' && (
          <>
            {/* Collaborators Section */}
            <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Users className="w-5 h-5" weight="bold" />
              Collaborator Feedback
              <span className="text-sm font-normal text-muted-foreground">
                ({collaboratorTokens.filter(t => t.submitted_at).length}/{collaboratorTokens.length || campaignCollaborators.length} submitted)
              </span>
            </h2>
            {noTokensYet && (
              <Button variant="outline" size="sm" onClick={openAddCollaborator}>
                <Plus className="w-4 h-4 mr-1.5" /> Add Collaborator
              </Button>
            )}
          </div>

          {collaboratorTokens.length > 0 ? (
            <div className="space-y-3">
              {collaboratorTokens.map(token => {
                const status = getSubmissionStatus(token)
                const response = token.response

                return (
                  <div key={token.id} className="border rounded-lg bg-card">
                    <div className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                          <User className="w-5 h-5 text-muted-foreground" weight="bold" />
                        </div>
                        <div>
                          <p className="font-medium">{token.name || 'Collaborator'}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>{token.email}</span>
                            {token.role && <><span>·</span><span>{roleLabels[token.role] || token.role}</span></>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <StatusBadge status={status} />
                        {token.submitted_at ? (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Check className="w-3.5 h-3.5 text-emerald-500" weight="bold" />
                            {new Date(token.submitted_at).toLocaleDateString()}
                          </span>
                        ) : status === 'pending' ? (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" weight="bold" />
                            Expires {new Date(token.expires_at).toLocaleDateString()}
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <div className="px-4 pb-4 flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => copyLink(token.token, 'feedback')}>
                        <Copy className="w-4 h-4 mr-1.5" /> Copy Link
                      </Button>
                      {status === 'pending' && (
                        <Button variant="outline" size="sm" onClick={() => resendInvitation(token.id)} disabled={resending === token.id}>
                          {resending === token.id ? <CircleNotch className="w-4 h-4 mr-1.5 animate-spin" weight="bold" /> : <PaperPlaneTilt className="w-4 h-4 mr-1.5" />}
                          Resend
                        </Button>
                      )}
                    </div>

                    {/* Show submitted response */}
                    {response && (
                      <div className="border-t">
                        <button
                          onClick={() => toggleSection(`response-${token.id}`)}
                          className="w-full p-4 flex items-center justify-between hover:bg-secondary/30 transition-colors"
                        >
                          <span className="text-sm font-medium flex items-center gap-2">
                            <ChatCircleText className="w-4 h-4" />
                            View Feedback Response
                          </span>
                          {expandedSections[`response-${token.id}`] ? <CaretUp className="w-4 h-4" /> : <CaretDown className="w-4 h-4" />}
                        </button>
                        {expandedSections[`response-${token.id}`] && (
                          <div className="p-4 pt-0 space-y-4">
                            {response.what_they_ask_about && response.what_they_ask_about.length > 0 && (
                              <div>
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">What They Ask the Expert About</p>
                                <ul className="list-disc list-inside text-sm space-y-1">
                                  {response.what_they_ask_about.map((q, i) => <li key={i}>{q}</li>)}
                                </ul>
                              </div>
                            )}
                            {response.what_will_be_hard && (
                              <div>
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">What Would Be Hard Without Them</p>
                                <p className="text-sm">{response.what_will_be_hard}</p>
                              </div>
                            )}
                            {response.wish_was_documented && (
                              <div>
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">What They Wish Was Documented</p>
                                <p className="text-sm">{response.wish_was_documented}</p>
                              </div>
                            )}
                            {response.specific_questions && response.specific_questions.length > 0 && (
                              <div>
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Specific Questions to Ask</p>
                                <ul className="list-disc list-inside text-sm space-y-1">
                                  {response.specific_questions.map((q, i) => <li key={i}>{q}</li>)}
                                </ul>
                              </div>
                            )}
                            {response.additional_notes && (
                              <div>
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Additional Notes</p>
                                <p className="text-sm">{response.additional_notes}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ) : hasCollaborators ? (
            <div className="space-y-3">
              {campaignCollaborators.map((collab, index) => (
                <div key={index} className="border rounded-lg bg-card">
                  <div className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                        <User className="w-5 h-5 text-muted-foreground" weight="bold" />
                      </div>
                      <div>
                        <p className="font-medium">{collab.name}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>{collab.email}</span>
                          {collab.role && <><span>·</span><span>{roleLabels[collab.role] || collab.role}</span></>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status="not_sent" />
                      <Button variant="ghost" size="sm" onClick={() => openEditCollaborator(index, collab)}>
                        <PencilSimple className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => removeCollaborator(index)} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                        <Trash className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="px-4 pb-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => generateLink('collaborator', collab.email, collab.name, collab.role)}
                      disabled={generatingLink === collab.email}
                    >
                      {generatingLink === collab.email ? (
                        <CircleNotch className="w-4 h-4 mr-1.5 animate-spin" weight="bold" />
                      ) : (
                        <Copy className="w-4 h-4 mr-1.5" />
                      )}
                      Get Link
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="border rounded-lg bg-card p-6 text-center text-muted-foreground">
              <Users className="w-8 h-8 mx-auto mb-2" weight="bold" />
              <p className="mb-3">No collaborators added yet</p>
              <Button variant="outline" size="sm" onClick={openAddCollaborator}>
                <Plus className="w-4 h-4 mr-1.5" /> Add Collaborator
              </Button>
            </div>
          )}
            </section>
          </>
        )}
      </div>

      {/* Collaborator Modal */}
      <Modal
        isOpen={collaboratorModalOpen}
        onClose={() => setCollaboratorModalOpen(false)}
        title={editingCollaborator ? 'Edit Collaborator' : 'Add Collaborator'}
      >
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Name</label>
            <input
              type="text"
              value={collaboratorForm.name}
              onChange={e => setCollaboratorForm(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20"
              placeholder="Full name"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Email</label>
            <input
              type="email"
              value={collaboratorForm.email}
              onChange={e => setCollaboratorForm(prev => ({ ...prev, email: e.target.value }))}
              className="w-full px-3 py-2 border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20"
              placeholder="email@example.com"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Role</label>
            <select
              value={collaboratorForm.role}
              onChange={e => setCollaboratorForm(prev => ({ ...prev, role: e.target.value }))}
              className="w-full px-3 py-2 border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20"
            >
              {roleOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setCollaboratorModalOpen(false)}>Cancel</Button>
            <Button onClick={saveCollaborator} disabled={savingCollaborator}>
              {savingCollaborator ? <CircleNotch className="w-4 h-4 mr-2 animate-spin" weight="bold" /> : null}
              {editingCollaborator ? 'Save Changes' : 'Add Collaborator'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
