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
  UsersThree,
  EnvelopeSimple,
  PaperPlaneTilt,
  Copy,
  Warning,
  Plus,
  PencilSimple,
  Trash,
  CaretDown,
  CaretUp,
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
  FolderSimple,
  Briefcase,
  Sparkle,
  Scroll,
} from 'phosphor-react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'
import { cn } from '@/lib/utils'
import { Modal } from '@/components/ui/modal'
import type { CampaignAccessToken, CollaboratorResponse, Campaign, SelfAssessment, Json, Participant, ParticipantStatus } from '@/lib/supabase/database.types'
import { containers } from '@/lib/design-system'
import { SessionForm, SessionList } from '@/components/sessions'
import { useKnowledgeCoverageStats } from '@/lib/hooks/use-knowledge-coverage'
import { CoverageBar } from '@/components/ui/coverage-bar'
import { ParticipantModal, ParticipantsList } from '@/components/participants'
import { TopicModal, TopicsList } from '@/components/topics'

type TabId = 'overview' | 'participants' | 'topics' | 'sessions' | 'context' | 'transcripts'

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

interface Question {
  id: string
  text: string
  priority: 'high' | 'medium' | 'low' | null
  category: string | null
  asked: boolean
  topic_id: string | null
}

interface Topic {
  id: string
  name: string
  category: string | null
  captured: boolean
  suggested_by: string | null
  questions?: Question[]
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
  participantId?: string
  participantName?: string
}

interface TranscriptLine {
  id: string
  session_id: string
  speaker: string
  text: string
  timestamp_seconds: number
  created_at: string | null
}

interface SessionWithTranscript extends Session {
  transcriptLines: TranscriptLine[]
}

// Transform ai_suggested_topics from DB format to UI format
function transformAiSuggestedTopics(
  data: unknown,
  questionsMap: Map<string, string[]>
): Session['aiSuggestedTopics'] {
  if (!data) return []

  // Handle the database format: { topics: [{ id, name }] }
  if (typeof data === 'object' && data !== null && 'topics' in data) {
    const dbFormat = data as { topics: Array<{ id: string | null; name: string }> }
    return dbFormat.topics.map(t => ({
      topic: t.name,
      questions: t.id ? questionsMap.get(t.id) || [] : [],
    }))
  }

  // Handle if already in array format
  if (Array.isArray(data)) {
    return data as Session['aiSuggestedTopics']
  }

  return []
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

  // Topics, documents, and sessions
  const [topics, setTopics] = useState<Topic[]>([])
  const [documents, setDocuments] = useState<Document[]>([])
  const [sessions, setSessions] = useState<Session[]>([])
  const [sessionsWithTranscripts, setSessionsWithTranscripts] = useState<SessionWithTranscript[]>([])
  const [loadingTranscripts, setLoadingTranscripts] = useState(false)
  const [expandedTranscripts, setExpandedTranscripts] = useState<Set<string>>(new Set())

  // Participants state (for project campaigns)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [participantModalOpen, setParticipantModalOpen] = useState(false)
  const [editingParticipant, setEditingParticipant] = useState<Participant | null>(null)

  // Topics modal state
  const [topicModalOpen, setTopicModalOpen] = useState(false)
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null)

  // Generation status (from database for persistence)
  const topicsGenerationStatus = campaign?.topics_generation_status as string | null
  const topicsGenerationStartedAt = campaign?.topics_generation_started_at as string | null
  const sessionsGenerationStatus = campaign?.sessions_generation_status as string | null
  const sessionsGenerationStartedAt = campaign?.sessions_generation_started_at as string | null

  const isGeneratingTopics = topicsGenerationStatus === 'generating'
  const isGeneratingSessions = sessionsGenerationStatus === 'generating'

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

    // Fetch topics
    const { data: topicsData } = await supabase
      .from('topics')
      .select('id, name, category, captured, suggested_by, coverage_status')
      .eq('campaign_id', campaignId)
      .is('deleted_at', null)
      .order('created_at', { ascending: true })

    // Fetch questions
    const { data: questionsData } = await supabase
      .from('questions')
      .select('id, text, priority, category, asked, topic_id')
      .eq('campaign_id', campaignId)
      .is('deleted_at', null)
      .order('created_at', { ascending: true })

    if (topicsData) {
      // Associate questions with topics
      const questionsMap = new Map<string, Question[]>()
      if (questionsData) {
        questionsData.forEach(q => {
          if (q.topic_id) {
            if (!questionsMap.has(q.topic_id)) {
              questionsMap.set(q.topic_id, [])
            }
            questionsMap.get(q.topic_id)!.push({
              id: q.id,
              text: q.text,
              priority: q.priority as 'high' | 'medium' | 'low' | null,
              category: q.category,
              asked: q.asked ?? false,
              topic_id: q.topic_id,
            })
          }
        })
      }

      setTopics(topicsData.map(t => ({
        id: t.id,
        name: t.name,
        category: t.category,
        captured: t.captured ?? false,
        suggested_by: t.suggested_by ?? null,
        coverage_status: (t.coverage_status ?? 'not_discussed') as 'not_discussed' | 'mentioned' | 'partial' | 'full',
        questions: questionsMap.get(t.id) || [],
      })))
    }

    // Fetch documents
    const { data: documentsData } = await supabase
      .from('documents')
      .select('id, filename, file_type, ai_processed, extracted_skills')
      .eq('campaign_id', campaignId)
      .is('deleted_at', null)
      .order('created_at', { ascending: true })

    if (documentsData) {
      setDocuments(documentsData.map(d => ({ ...d, ai_processed: d.ai_processed ?? false, extracted_skills: d.extracted_skills })))
    }

    // Fetch sessions
    const { data: sessionsData } = await supabase
      .from('sessions')
      .select('*')
      .eq('campaign_id', campaignId)
      .is('deleted_at', null)
      .order('session_number', { ascending: true })

    if (sessionsData) {
      // Build a map of topic_id -> question texts for sessions
      const sessionQuestionsMap = new Map<string, string[]>()
      if (questionsData) {
        questionsData.forEach(q => {
          if (q.topic_id) {
            const existing = sessionQuestionsMap.get(q.topic_id) || []
            existing.push(q.text)
            sessionQuestionsMap.set(q.topic_id, existing)
          }
        })
      }

      setSessions(sessionsData.map(s => ({
        id: s.id,
        sessionNumber: s.session_number,
        title: s.title || undefined,
        scheduledAt: s.scheduled_at || '',
        durationMinutes: s.duration_minutes || 60,
        status: s.status || 'scheduled',
        topics: s.topics || [],
        aiSuggestedTopics: transformAiSuggestedTopics(s.ai_suggested_topics, sessionQuestionsMap),
        calendarEventId: s.calendar_event_id || undefined,
        calendarProvider: s.calendar_provider || undefined,
        participantId: s.participant_id || undefined,
      })))
    }

    // Fetch participants (for project campaigns)
    const { data: participantsData } = await supabase
      .from('participants')
      .select('*')
      .eq('campaign_id', campaignId)
      .is('deleted_at', null)
      .order('created_at', { ascending: true })

    if (participantsData) {
      setParticipants(participantsData)
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

    const participantsSubscription = supabase
      .channel('campaign-participants')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'participants', filter: `campaign_id=eq.${campaignId}` }, () => fetchData())
      .subscribe()

    const topicsSubscription = supabase
      .channel('campaign-topics')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'topics', filter: `campaign_id=eq.${campaignId}` }, () => fetchData())
      .subscribe()

    const questionsSubscription = supabase
      .channel('campaign-questions')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'questions', filter: `campaign_id=eq.${campaignId}` }, () => fetchData())
      .subscribe()

    return () => {
      tokenSubscription.unsubscribe()
      responseSubscription.unsubscribe()
      campaignSubscription.unsubscribe()
      sessionsSubscription.unsubscribe()
      participantsSubscription.unsubscribe()
      topicsSubscription.unsubscribe()
      questionsSubscription.unsubscribe()
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

  // Load transcripts for completed sessions
  const loadTranscripts = useCallback(async () => {
    if (loadingTranscripts) return
    setLoadingTranscripts(true)

    try {
      // Get completed sessions
      const completedSessions = sessions.filter(s => s.status === 'completed')
      if (completedSessions.length === 0) {
        setSessionsWithTranscripts([])
        setLoadingTranscripts(false)
        return
      }

      // Fetch transcript lines for all completed sessions
      const sessionIds = completedSessions.map(s => s.id)
      const { data: transcriptData, error } = await supabase
        .from('transcript_lines')
        .select('*')
        .in('session_id', sessionIds)
        .order('timestamp_seconds', { ascending: true })

      if (error) {
        console.error('Error fetching transcripts:', error)
        setLoadingTranscripts(false)
        return
      }

      // Group transcript lines by session
      const transcriptsBySession = (transcriptData || []).reduce((acc, line) => {
        if (!acc[line.session_id]) acc[line.session_id] = []
        acc[line.session_id].push(line)
        return acc
      }, {} as Record<string, TranscriptLine[]>)

      // Get participant names for project sessions
      const participantIds = completedSessions
        .map(s => s.participantId)
        .filter((id): id is string => !!id)

      let participantMap = new Map<string, string>()
      if (participantIds.length > 0) {
        const { data: participantData } = await supabase
          .from('participants')
          .select('id, name')
          .in('id', participantIds)

        if (participantData) {
          participantData.forEach(p => participantMap.set(p.id, p.name))
        }
      }

      // Build sessions with transcripts
      const sessionsWithData: SessionWithTranscript[] = completedSessions
        .filter(session => transcriptsBySession[session.id]?.length > 0)
        .map(session => ({
          ...session,
          participantName: session.participantId ? participantMap.get(session.participantId) : undefined,
          transcriptLines: transcriptsBySession[session.id] || [],
        }))
        .sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime())

      setSessionsWithTranscripts(sessionsWithData)
    } catch (err) {
      console.error('Error loading transcripts:', err)
    } finally {
      setLoadingTranscripts(false)
    }
  }, [sessions, supabase, loadingTranscripts])

  // Load transcripts when switching to transcripts tab
  useEffect(() => {
    if (activeTab === 'transcripts' && sessionsWithTranscripts.length === 0 && sessions.some(s => s.status === 'completed')) {
      loadTranscripts()
    }
  }, [activeTab, sessionsWithTranscripts.length, sessions, loadTranscripts])

  const toggleTranscriptExpanded = (sessionId: string) => {
    setExpandedTranscripts(prev => {
      const next = new Set(prev)
      if (next.has(sessionId)) {
        next.delete(sessionId)
      } else {
        next.add(sessionId)
      }
      return next
    })
  }

  // Format timestamp for display
  const formatTimestamp = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Generate a shareable link without sending email
  const [generatingLink, setGeneratingLink] = useState<string | null>(null)
  const [generatingGuideLink, setGeneratingGuideLink] = useState(false)
  const [generatingManagerLink, setGeneratingManagerLink] = useState(false)

  // Manager modal state
  const [managerModalOpen, setManagerModalOpen] = useState(false)
  const [managerForm, setManagerForm] = useState({ name: '', email: '' })

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

  // Generate manager survey link
  const generateManagerSurveyLink = async (name: string, email: string) => {
    setGeneratingManagerLink(true)

    try {
      // Generate cryptographic token
      const tokenBytes = new Uint8Array(32)
      crypto.getRandomValues(tokenBytes)
      const token = Array.from(tokenBytes).map(b => b.toString(16).padStart(2, '0')).join('')

      // Insert token into database with token_type 'manager'
      const { error } = await supabase
        .from('campaign_access_tokens')
        .insert({
          campaign_id: campaignId,
          token,
          token_type: 'manager',
          email,
          name,
          role: 'manager',
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
        })

      if (error) {
        console.error('Error creating manager token:', error)
        showToast('Failed to generate manager link', 'error')
        return
      }

      // Copy to clipboard
      const baseUrl = window.location.origin
      const url = `${baseUrl}/manager-survey/${token}`
      await navigator.clipboard.writeText(url)
      showToast('Manager survey link generated and copied to clipboard!')

      // Close modal and refresh data
      setManagerModalOpen(false)
      setManagerForm({ name: '', email: '' })
      fetchData()
    } catch (error) {
      console.error('Error generating manager link:', error)
      showToast('Failed to generate manager link', 'error')
    } finally {
      setGeneratingManagerLink(false)
    }
  }

  // Copy existing manager survey link
  const copyManagerSurveyLink = (token: string) => {
    const baseUrl = window.location.origin
    const url = `${baseUrl}/manager-survey/${token}`
    navigator.clipboard.writeText(url)
    showToast('Manager survey link copied to clipboard')
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

  // Participant handlers (for project campaigns)
  const openAddParticipant = () => {
    setEditingParticipant(null)
    setParticipantModalOpen(true)
  }

  const openEditParticipant = (participant: Participant) => {
    setEditingParticipant(participant)
    setParticipantModalOpen(true)
  }

  const saveParticipant = async (data: {
    name: string
    email: string
    role: string
    team: string
    status: ParticipantStatus
    notes: string
  }) => {
    if (editingParticipant) {
      // Update existing participant
      const { error } = await supabase
        .from('participants')
        .update({
          name: data.name,
          email: data.email || null,
          role: data.role || null,
          team: data.team || null,
          status: data.status,
          notes: data.notes || null,
        })
        .eq('id', editingParticipant.id)

      if (error) {
        showToast('Failed to update participant', 'error')
        throw error
      }
      showToast('Participant updated')
    } else {
      // Create new participant
      const { error } = await supabase
        .from('participants')
        .insert({
          campaign_id: campaignId,
          name: data.name,
          email: data.email || null,
          role: data.role || null,
          team: data.team || null,
          status: data.status,
          notes: data.notes || null,
        })

      if (error) {
        showToast('Failed to add participant', 'error')
        throw error
      }
      showToast('Participant added')
    }
    fetchData()
  }

  const deleteParticipant = async (participantId: string) => {
    const { error } = await supabase
      .from('participants')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', participantId)

    if (error) {
      showToast('Failed to remove participant', 'error')
      throw error
    }
    showToast('Participant removed')
    fetchData()
  }

  const updateParticipantStatus = async (participantId: string, status: ParticipantStatus) => {
    const { error } = await supabase
      .from('participants')
      .update({ status })
      .eq('id', participantId)

    if (error) {
      showToast('Failed to update status', 'error')
      throw error
    }
    showToast('Status updated')
    fetchData()
  }

  // Generate participant survey link
  const generateParticipantSurveyLink = async (participant: Participant) => {
    if (!participant.email) {
      showToast('Participant needs an email to generate a survey link', 'error')
      return
    }

    try {
      // Check if participant already has a survey token
      if (participant.survey_token) {
        // Copy existing link
        const baseUrl = window.location.origin
        const url = `${baseUrl}/participant-survey/${participant.survey_token}`
        await navigator.clipboard.writeText(url)
        showToast('Survey link copied to clipboard!')
        return
      }

      // Generate cryptographic token
      const tokenBytes = new Uint8Array(32)
      crypto.getRandomValues(tokenBytes)
      const token = Array.from(tokenBytes).map(b => b.toString(16).padStart(2, '0')).join('')

      // Insert token into campaign_access_tokens
      const { error: tokenError } = await supabase
        .from('campaign_access_tokens')
        .insert({
          campaign_id: campaignId,
          token,
          token_type: 'participant',
          email: participant.email,
          name: participant.name,
          role: participant.role,
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
        })

      if (tokenError) {
        console.error('Error creating token:', tokenError)
        showToast('Failed to generate survey link', 'error')
        return
      }

      // Update participant with survey token
      const { error: updateError } = await supabase
        .from('participants')
        .update({ survey_token: token })
        .eq('id', participant.id)

      if (updateError) {
        console.error('Error updating participant:', updateError)
        // Don't show error, token was created successfully
      }

      // Copy to clipboard
      const baseUrl = window.location.origin
      const url = `${baseUrl}/participant-survey/${token}`
      await navigator.clipboard.writeText(url)
      showToast('Survey link generated and copied to clipboard!')

      // Refresh data
      fetchData()
    } catch (error) {
      console.error('Error generating survey link:', error)
      showToast('Failed to generate survey link', 'error')
    }
  }

  // Topic handlers
  const openAddTopic = () => {
    setEditingTopic(null)
    setTopicModalOpen(true)
  }

  const openEditTopic = (topic: Topic) => {
    setEditingTopic(topic)
    setTopicModalOpen(true)
  }

  const saveTopic = async (data: {
    name: string
    category: string
    suggested_by: string
  }) => {
    if (editingTopic) {
      // Update existing topic
      const { error } = await supabase
        .from('topics')
        .update({
          name: data.name,
          category: data.category || null,
          suggested_by: data.suggested_by || null,
        })
        .eq('id', editingTopic.id)

      if (error) {
        showToast('Failed to update topic', 'error')
        throw error
      }
      showToast('Topic updated')
    } else {
      // Create new topic
      const { error } = await supabase
        .from('topics')
        .insert({
          campaign_id: campaignId,
          name: data.name,
          category: data.category || null,
          suggested_by: data.suggested_by || null,
          captured: false,
        })

      if (error) {
        showToast('Failed to add topic', 'error')
        throw error
      }
      showToast('Topic added')
    }
    fetchData()
  }

  const deleteTopic = async (topicId: string) => {
    const { error } = await supabase
      .from('topics')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', topicId)

    if (error) {
      showToast('Failed to remove topic', 'error')
      throw error
    }
    showToast('Topic removed')
    fetchData()
  }

  const toggleTopicCaptured = async (topicId: string, captured: boolean) => {
    const { error } = await supabase
      .from('topics')
      .update({
        captured,
        captured_at: captured ? new Date().toISOString() : null,
        // Sync coverage_status with captured flag for consistency
        coverage_status: captured ? 'full' : 'not_discussed',
      })
      .eq('id', topicId)

    if (error) {
      showToast('Failed to update topic', 'error')
      throw error
    }
    showToast(captured ? 'Topic marked as captured' : 'Topic marked as not captured')
    fetchData()
  }

  // Generate topics using AI
  const generateTopics = async () => {
    try {
      // Optimistically update UI to show generating state
      setCampaign(prev => prev ? { ...prev, topics_generation_status: 'generating', topics_generation_started_at: new Date().toISOString() } : null)

      const response = await fetch(`/api/campaigns/${campaignId}/generate-topics`, {
        method: 'POST',
      })

      if (!response.ok) {
        const contentType = response.headers.get('content-type')
        if (contentType?.includes('application/json')) {
          const error = await response.json()
          throw new Error(error.error || 'Failed to generate topics')
        }
        throw new Error('Failed to generate topics')
      }

      const result = await response.json()
      showToast(`Generated ${result.topicsCreated || 0} topics and ${result.questionsCreated || 0} questions`)
      fetchData()
    } catch (error) {
      console.error('Error generating topics:', error)
      showToast(error instanceof Error ? error.message : 'Failed to generate topics', 'error')
      // Refresh to get actual status
      fetchData()
    }
  }

  // Generate sessions using AI
  const generateSessions = async () => {
    try {
      // Optimistically update UI to show generating state
      setCampaign(prev => prev ? { ...prev, sessions_generation_status: 'generating', sessions_generation_started_at: new Date().toISOString() } : null)

      const response = await fetch(`/api/campaigns/${campaignId}/generate-sessions`, {
        method: 'POST',
      })

      if (!response.ok) {
        const contentType = response.headers.get('content-type')
        if (contentType?.includes('application/json')) {
          const error = await response.json()
          throw new Error(error.error || 'Failed to generate sessions')
        }
        throw new Error('Failed to generate sessions')
      }

      const result = await response.json()
      showToast(`Generated ${result.sessionsCreated || 0} sessions`)
      fetchData()
    } catch (error) {
      console.error('Error generating sessions:', error)
      showToast(error instanceof Error ? error.message : 'Failed to generate sessions', 'error')
      // Refresh to get actual status
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

  // Campaign type helpers
  const isProjectCampaign = campaign.subject_type === 'project'
  const projectTypeLabels: Record<string, string> = {
    'product_feature': 'Product Feature',
    'team_process': 'Team Process',
  }

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
            <div className="flex items-start gap-4">
              {isProjectCampaign && (
                <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center flex-shrink-0">
                  <FolderSimple className="w-6 h-6 text-primary-foreground" weight="bold" />
                </div>
              )}
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-semibold">{campaign.expert_name}</h1>
                  {isProjectCampaign && campaign.project_type && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-secondary text-muted-foreground">
                      {projectTypeLabels[campaign.project_type] || campaign.project_type}
                    </span>
                  )}
                </div>
                <p className="text-muted-foreground">
                  {isProjectCampaign ? (
                    campaign.goal || 'Project campaign'
                  ) : (
                    campaign.expert_role
                  )}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">
                {isProjectCampaign ? 'Sessions' : 'Campaign Progress'}
              </p>
              <p className="text-lg font-semibold">
                {isProjectCampaign ? (
                  `${sessions.filter(s => s.status === 'completed').length}/${sessions.length}`
                ) : (
                  `${submittedCount}/${totalCount} submissions`
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Send Invitations Banner - Only show for expert campaigns */}
        {!isProjectCampaign && needsInvitations && (
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
            // Project: Overview, Participants, Topics, Sessions
            ...(isProjectCampaign ? [{ id: 'participants' as TabId, label: 'Participants', icon: UsersThree }] : []),
            // Expert: Overview, Context, Topics, Sessions
            ...(!isProjectCampaign ? [{ id: 'context' as TabId, label: 'Context', icon: Clipboard }] : []),
            { id: 'topics' as TabId, label: 'Topics', icon: Lightning },
            { id: 'sessions' as TabId, label: 'Sessions', icon: Calendar },
            { id: 'transcripts' as TabId, label: 'Transcripts', icon: Scroll },
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
            {isProjectCampaign ? 'Project Details' : 'Campaign Details'}
          </h2>
          <div className="border rounded-lg bg-card p-5 space-y-4">
            {isProjectCampaign ? (
              // Project campaign details
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Project Name</p>
                    <p className="font-medium">{campaign.expert_name}</p>
                  </div>
                  {campaign.project_type && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Project Type</p>
                      <p className="font-medium">{projectTypeLabels[campaign.project_type] || campaign.project_type}</p>
                    </div>
                  )}
                </div>
                {campaign.goal && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Description</p>
                    <p className="text-muted-foreground">{campaign.goal}</p>
                  </div>
                )}
                {campaign.capture_mode && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Capture Mode</p>
                    <p className="capitalize">{campaign.capture_mode}</p>
                  </div>
                )}
              </>
            ) : (
              // Expert campaign details
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Expert</p>
                    <p className="font-medium">{campaign.expert_name}</p>
                    <p className="text-sm text-muted-foreground">{campaign.expert_email}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Role</p>
                    <p className="font-medium">{campaign.expert_role}</p>
                  </div>
                </div>
                {campaign.departure_date && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Departure Date</p>
                    <p className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      {new Date(campaign.departure_date).toLocaleDateString()}
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
              </>
            )}
          </div>
        </section>
          </>
        )}

        {/* Sessions Tab */}
        {activeTab === 'sessions' && (
          <>
            {/* Interview Plan Section */}
            <section className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Calendar className="w-5 h-5" weight="bold" />
                  {isProjectCampaign ? 'Session Plan' : 'Interview Plan'}
                  <span className="text-sm font-normal text-muted-foreground">
                    ({sessions.filter(s => s.status === 'completed').length}/{sessions.length} completed)
                  </span>
                </h2>
                <Button
                  onClick={generateSessions}
                  disabled={isGeneratingSessions || topics.filter(t => !t.captured).length === 0}
                  variant="outline"
                  className="gap-2"
                >
                  {isGeneratingSessions ? (
                    <CircleNotch className="w-4 h-4 animate-spin" weight="bold" />
                  ) : (
                    <Sparkle className="w-4 h-4" weight="bold" />
                  )}
                  {isGeneratingSessions ? 'Planning...' : 'Plan with AI'}
                </Button>
              </div>

              {/* Generating state UI */}
              {isGeneratingSessions && (
                <div className="border rounded-lg bg-gradient-to-br from-blue-50 to-cyan-50 p-6 mb-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <Sparkle className="w-6 h-6 text-blue-600 animate-pulse" weight="fill" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-blue-900 mb-1">AI is planning your sessions...</h3>
                      <p className="text-sm text-blue-700 mb-3">
                        Organizing topics into logical sessions based on category and estimated discussion time.
                      </p>
                      <div className="flex items-center gap-2 text-xs text-blue-600">
                        <CircleNotch className="w-3.5 h-3.5 animate-spin" weight="bold" />
                        {sessionsGenerationStartedAt && (
                          <span>Started {new Date(sessionsGenerationStartedAt).toLocaleTimeString()}</span>
                        )}
                        <span className="text-blue-400">•</span>
                        <span>You can leave this page and come back</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="border rounded-lg bg-card overflow-hidden">
                {/* Add session form */}
                <div className="p-5 border-b bg-neutral-50/50 relative">
                  <SessionForm
                    campaignId={campaignId}
                    campaignType={isProjectCampaign ? 'project' : 'person'}
                    nextSessionNumber={sessions.length > 0 ? Math.max(...sessions.map(s => s.sessionNumber)) + 1 : 1}
                    participants={participants}
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

        {/* Participants Tab - Only for project campaigns */}
        {activeTab === 'participants' && isProjectCampaign && (
          <>
            <section className="mb-8">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <UsersThree className="w-5 h-5" weight="bold" />
                Project Participants
                <span className="text-sm font-normal text-muted-foreground">
                  ({participants.filter(p => p.status === 'complete').length}/{participants.length} interviewed)
                </span>
              </h2>
              <div className="border rounded-lg bg-card p-5">
                <ParticipantsList
                  participants={participants}
                  onAdd={openAddParticipant}
                  onEdit={openEditParticipant}
                  onDelete={deleteParticipant}
                  onStatusChange={updateParticipantStatus}
                  onGenerateSurveyLink={generateParticipantSurveyLink}
                />
              </div>
            </section>

            {/* Manager Survey Section */}
            <section className="mb-8">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Briefcase className="w-5 h-5" weight="bold" />
                Manager Input
              </h2>
              <div className="border rounded-lg bg-card p-5">
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                    <Briefcase className="w-6 h-6 text-amber-600" weight="bold" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium mb-1">Get Input from Managers</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Managers can suggest topics they think should be covered during knowledge capture sessions.
                      Their suggestions will be added to your topics list.
                    </p>
                    <Button variant="outline" onClick={() => setManagerModalOpen(true)}>
                      <Plus className="w-4 h-4 mr-1.5" />
                      Invite Manager
                    </Button>
                  </div>
                </div>

                {/* List of manager tokens */}
                {tokens.filter(t => t.token_type === 'manager').length > 0 && (
                  <div className="border-t pt-4 mt-4">
                    <h4 className="text-sm font-medium text-muted-foreground mb-3">Invited Managers</h4>
                    <div className="space-y-2">
                      {tokens.filter(t => t.token_type === 'manager').map(token => {
                        const status = getSubmissionStatus(token)
                        return (
                          <div key={token.id} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
                                <Briefcase className="w-4 h-4 text-amber-600" weight="bold" />
                              </div>
                              <div>
                                <p className="font-medium text-sm">{token.name || 'Manager'}</p>
                                <p className="text-xs text-muted-foreground">{token.email}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <StatusBadge status={status} />
                              {token.submitted_at && (
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Check className="w-3 h-3 text-emerald-500" weight="bold" />
                                  {new Date(token.submitted_at).toLocaleDateString()}
                                </span>
                              )}
                              <Button variant="ghost" size="sm" onClick={() => copyManagerSurveyLink(token.token)}>
                                <Copy className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            </section>
          </>
        )}

        {/* Topics Tab */}
        {activeTab === 'topics' && (
          <section className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Lightning className="w-5 h-5" weight="bold" />
                Topics to Capture
                <span className="text-sm font-normal text-muted-foreground">
                  ({topics.filter(t => t.captured).length}/{topics.length} captured)
                </span>
              </h2>
              <Button
                onClick={generateTopics}
                disabled={isGeneratingTopics}
                variant="outline"
                className="gap-2"
              >
                {isGeneratingTopics ? (
                  <CircleNotch className="w-4 h-4 animate-spin" weight="bold" />
                ) : (
                  <Sparkle className="w-4 h-4" weight="bold" />
                )}
                {isGeneratingTopics ? 'Generating...' : 'Generate with AI'}
              </Button>
            </div>

            {/* Generating state UI */}
            {isGeneratingTopics && (
              <div className="border rounded-lg bg-gradient-to-br from-violet-50 to-indigo-50 p-6 mb-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0">
                    <Sparkle className="w-6 h-6 text-violet-600 animate-pulse" weight="fill" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-violet-900 mb-1">AI is analyzing your campaign...</h3>
                    <p className="text-sm text-violet-700 mb-3">
                      Generating topics and interview questions based on expert assessment, collaborator feedback, and uploaded documents.
                    </p>
                    <div className="flex items-center gap-2 text-xs text-violet-600">
                      <CircleNotch className="w-3.5 h-3.5 animate-spin" weight="bold" />
                      {topicsGenerationStartedAt && (
                        <span>Started {new Date(topicsGenerationStartedAt).toLocaleTimeString()}</span>
                      )}
                      <span className="text-violet-400">•</span>
                      <span>You can leave this page and come back</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="border rounded-lg bg-card p-5">
              <TopicsList
                topics={topics}
                onAdd={openAddTopic}
                onEdit={openEditTopic}
                onDelete={deleteTopic}
                onToggleCaptured={toggleTopicCaptured}
              />
            </div>
          </section>
        )}

        {/* Context Tab - Only for expert campaigns */}
        {activeTab === 'context' && !isProjectCampaign && (
          <>
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
            {isProjectCampaign ? 'Session Guide' : 'Interviewer Guide'}
          </h2>
          <div className="border rounded-lg bg-card p-5">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center flex-shrink-0">
                <Book className="w-6 h-6 text-primary-foreground" weight="bold" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium mb-1">{isProjectCampaign ? 'Session' : 'Interview'} Preparation Guide</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {isProjectCampaign ? (
                    <>A shareable link that gives team members access to all the context they need - project background, session topics, and knowledge areas to capture - all in one place without requiring login.</>
                  ) : (
                    <>A shareable link that gives interviewers access to all the context they need - expert background, session topics, skills to capture, and collaborator insights - all in one place without requiring login. This guide auto-updates as more context is collected.</>
                  )}
                </p>
                <div className="flex items-center gap-3">
                  <Button
                    onClick={generateGuideLink}
                    disabled={generatingGuideLink}
                    variant="outline"
                    className="gap-2"
                  >
                    {generatingGuideLink ? (
                      <CircleNotch className="w-4 h-4 animate-spin" weight="bold" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                    Copy Link
                  </Button>
                  <a
                    href={`/guide/${campaign?.interviewer_guide_token}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
                  >
                    Open Guide
                    <ArrowSquareOut className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Expert Self-Assessment Section - Only show for expert campaigns */}
        {!isProjectCampaign && (
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
        )}

        {/* Collaborator Feedback Section */}
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

        {/* Transcripts Tab */}
        {activeTab === 'transcripts' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Scroll className="w-5 h-5" weight="bold" />
                Session Transcripts
                {sessionsWithTranscripts.length > 0 && (
                  <span className="text-sm font-normal text-muted-foreground">
                    ({sessionsWithTranscripts.length} session{sessionsWithTranscripts.length !== 1 ? 's' : ''})
                  </span>
                )}
              </h2>
              {sessionsWithTranscripts.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // Expand all or collapse all
                    if (expandedTranscripts.size === sessionsWithTranscripts.length) {
                      setExpandedTranscripts(new Set())
                    } else {
                      setExpandedTranscripts(new Set(sessionsWithTranscripts.map(s => s.id)))
                    }
                  }}
                >
                  {expandedTranscripts.size === sessionsWithTranscripts.length ? 'Collapse All' : 'Expand All'}
                </Button>
              )}
            </div>

            {loadingTranscripts ? (
              <div className="flex items-center justify-center py-12">
                <CircleNotch className="w-8 h-8 animate-spin text-muted-foreground" weight="bold" />
              </div>
            ) : sessionsWithTranscripts.length > 0 ? (
              <div className="space-y-4">
                {sessionsWithTranscripts.map((session) => {
                  const isExpanded = expandedTranscripts.has(session.id)
                  const sessionDate = new Date(session.scheduledAt)
                  const formattedDate = sessionDate.toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })

                  return (
                    <div key={session.id} className="border rounded-lg bg-card overflow-hidden">
                      {/* Session header */}
                      <button
                        onClick={() => toggleTranscriptExpanded(session.id)}
                        className="w-full p-4 flex items-center justify-between hover:bg-secondary/30 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                            <CheckCircle className="w-5 h-5 text-emerald-600" weight="fill" />
                          </div>
                          <div className="text-left">
                            <p className="font-medium">
                              {session.title || `Session ${session.sessionNumber}`}
                              {session.participantName && (
                                <span className="text-muted-foreground font-normal ml-2">
                                  with {session.participantName}
                                </span>
                              )}
                            </p>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Calendar className="w-3.5 h-3.5" />
                              <span>{formattedDate}</span>
                              <span>·</span>
                              <span>{session.transcriptLines.length} lines</span>
                            </div>
                          </div>
                        </div>
                        {isExpanded ? (
                          <CaretUp className="w-5 h-5 text-muted-foreground" weight="bold" />
                        ) : (
                          <CaretDown className="w-5 h-5 text-muted-foreground" weight="bold" />
                        )}
                      </button>

                      {/* Transcript content */}
                      {isExpanded && (
                        <div className="border-t bg-secondary/20">
                          <div className="p-4 max-h-[500px] overflow-y-auto">
                            <div className="space-y-3">
                              {session.transcriptLines.map((line, index) => (
                                <div key={line.id || index} className="flex gap-3">
                                  <span className="text-xs text-muted-foreground w-12 flex-shrink-0 pt-0.5">
                                    {formatTimestamp(line.timestamp_seconds)}
                                  </span>
                                  <div className="flex-1">
                                    <span className={cn(
                                      'text-xs font-medium',
                                      line.speaker === 'Expert' || line.speaker === 'Participant'
                                        ? 'text-primary'
                                        : 'text-muted-foreground'
                                    )}>
                                      {line.speaker}
                                    </span>
                                    <p className="text-sm mt-0.5">{line.text}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : sessions.some(s => s.status === 'completed') ? (
              <div className="border rounded-lg bg-card p-8 text-center text-muted-foreground">
                <Scroll className="w-10 h-10 mx-auto mb-3" weight="bold" />
                <p className="font-medium mb-1">No transcripts available</p>
                <p className="text-sm">
                  Completed sessions don&apos;t have any transcript data yet.
                </p>
              </div>
            ) : (
              <div className="border rounded-lg bg-card p-8 text-center text-muted-foreground">
                <Scroll className="w-10 h-10 mx-auto mb-3" weight="bold" />
                <p className="font-medium mb-1">No completed sessions</p>
                <p className="text-sm">
                  Transcripts will appear here once you complete interview sessions.
                </p>
              </div>
            )}
          </div>
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

      {/* Participant Modal - for project campaigns */}
      <ParticipantModal
        isOpen={participantModalOpen}
        onClose={() => setParticipantModalOpen(false)}
        onSave={saveParticipant}
        participant={editingParticipant}
      />

      {/* Topic Modal */}
      <TopicModal
        isOpen={topicModalOpen}
        onClose={() => setTopicModalOpen(false)}
        onSave={saveTopic}
        topic={editingTopic}
      />

      {/* Manager Survey Modal */}
      <Modal
        isOpen={managerModalOpen}
        onClose={() => setManagerModalOpen(false)}
        title="Invite Manager"
      >
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Generate a survey link for a manager to suggest topics. They&apos;ll be able to recommend
            what knowledge should be captured without being interviewed themselves.
          </p>
          <div>
            <label className="text-sm font-medium mb-1 block">Name</label>
            <input
              type="text"
              value={managerForm.name}
              onChange={e => setManagerForm(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20"
              placeholder="Manager's full name"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Email</label>
            <input
              type="email"
              value={managerForm.email}
              onChange={e => setManagerForm(prev => ({ ...prev, email: e.target.value }))}
              className="w-full px-3 py-2 border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20"
              placeholder="manager@example.com"
            />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setManagerModalOpen(false)}>Cancel</Button>
            <Button
              onClick={() => generateManagerSurveyLink(managerForm.name, managerForm.email)}
              disabled={generatingManagerLink || !managerForm.name.trim() || !managerForm.email.trim()}
            >
              {generatingManagerLink ? <CircleNotch className="w-4 h-4 mr-2 animate-spin" weight="bold" /> : null}
              Generate Link
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
