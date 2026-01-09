'use client'

import { useEffect, useState, use } from 'react'
import {
  Sparkle,
  CircleNotch,
  Warning,
  User,
  Briefcase,
  Target,
  Lightning,
  Calendar,
  Lightbulb,
  ChatCircleText,
  CaretDown,
  CaretUp,
  CheckCircle,
  Clock,
} from 'phosphor-react'
import { cn } from '@/lib/utils'

interface Skill {
  id: string
  name: string
  category: string | null
  captured: boolean
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
}

interface SelfAssessment {
  what_you_know?: string
  questions_people_ask?: string[]
  what_will_break?: string
  topics_to_cover?: string[]
}

interface CollaboratorInsight {
  name: string
  role: string
  what_they_ask_about?: string[]
  what_will_be_hard?: string
  wish_was_documented?: string
  specific_questions?: string[]
}

interface GuideData {
  campaign: {
    id: string
    expert_name: string
    expert_role: string
    department?: string
    goal?: string
    years_experience?: number
  }
  skills: Skill[]
  sessions: Session[]
  selfAssessment: SelfAssessment | null
  collaboratorInsights: CollaboratorInsight[]
}

type PageStatus = 'loading' | 'ready' | 'error' | 'not_found'

export default function InterviewerGuidePage({ params }: { params: Promise<{ token: string }> }) {
  const resolvedParams = use(params)
  const { token } = resolvedParams

  const [status, setStatus] = useState<PageStatus>('loading')
  const [error, setError] = useState<string | null>(null)
  const [guideData, setGuideData] = useState<GuideData | null>(null)
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    selfAssessment: true,
    collaborators: true,
  })

  const toggleSection = (id: string) => {
    setExpandedSections(prev => ({ ...prev, [id]: !prev[id] }))
  }

  // Fetch guide data on mount
  useEffect(() => {
    async function fetchGuideData() {
      try {
        const response = await fetch(`/api/public/guide?token=${token}`)
        const data = await response.json()

        if (!response.ok) {
          if (response.status === 404) {
            setStatus('not_found')
          } else {
            setError(data.error || 'Failed to load guide')
            setStatus('error')
          }
          return
        }

        setGuideData(data)
        setStatus('ready')
      } catch {
        setError('Failed to connect to server')
        setStatus('error')
      }
    }

    fetchGuideData()
  }, [token])

  const formatDate = (isoString: string) => {
    if (!isoString) return 'Not scheduled'
    const date = new Date(isoString)
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
  }

  const getStatusStyle = (sessionStatus: string) => {
    switch (sessionStatus) {
      case 'completed':
        return 'bg-green-100 text-green-700'
      case 'in_progress':
        return 'bg-amber-100 text-amber-700'
      default:
        return 'bg-blue-100 text-blue-700'
    }
  }

  // Loading state
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <CircleNotch className="w-8 h-8 animate-spin mx-auto text-muted-foreground" weight="bold" />
          <p className="mt-4 text-muted-foreground">Loading interviewer guide...</p>
        </div>
      </div>
    )
  }

  // Not found state
  if (status === 'not_found') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-6">
            <Warning className="w-8 h-8 text-amber-600" weight="bold" />
          </div>
          <h1 className="text-2xl font-semibold mb-3">Guide Not Found</h1>
          <p className="text-muted-foreground">
            This interviewer guide link is invalid or has been removed. Please contact the campaign owner for a new link.
          </p>
        </div>
      </div>
    )
  }

  // Error state
  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-6">
            <Warning className="w-8 h-8 text-red-600" weight="bold" />
          </div>
          <h1 className="text-2xl font-semibold mb-3">Something went wrong</h1>
          <p className="text-muted-foreground">{error || 'Unable to load the guide. Please try again later.'}</p>
        </div>
      </div>
    )
  }

  if (!guideData) return null

  const { campaign, skills, sessions, selfAssessment, collaboratorInsights } = guideData

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-primary text-primary-foreground flex items-center justify-center">
              <Sparkle className="w-4 h-4" weight="fill" />
            </div>
            <span className="font-serif font-bold text-xl">Tacit</span>
          </div>
          <span className="text-sm text-muted-foreground">Interviewer Guide</span>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 max-w-4xl mx-auto px-4 py-12 w-full">
        {/* Expert Overview */}
        <section className="mb-12">
          <div className="flex items-start gap-6 mb-6">
            <div className="w-20 h-20 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground flex-shrink-0">
              <User className="w-10 h-10" weight="bold" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1 uppercase tracking-wider">Expert Profile</p>
              <h1 className="text-3xl font-semibold mb-1">{campaign.expert_name}</h1>
              <p className="text-lg text-muted-foreground flex items-center gap-2">
                <Briefcase className="w-5 h-5" />
                {campaign.expert_role}
                {campaign.department && <span>· {campaign.department}</span>}
              </p>
              {campaign.years_experience && (
                <p className="text-sm text-muted-foreground mt-2">
                  {campaign.years_experience} years of experience
                </p>
              )}
            </div>
          </div>

          {campaign.goal && (
            <div className="p-5 bg-muted/50 rounded-xl border border-border/40">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-5 h-5 text-primary" weight="bold" />
                <span className="font-medium">Campaign Goal</span>
              </div>
              <p className="text-muted-foreground">{campaign.goal}</p>
            </div>
          )}
        </section>

        {/* Skills to Capture */}
        {skills.length > 0 && (
          <section className="mb-10">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Lightning className="w-5 h-5" weight="bold" />
              Skills to Capture
            </h2>
            <div className="p-5 bg-card rounded-xl border border-border/40">
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

        {/* Interview Sessions */}
        {sessions.length > 0 && (
          <section className="mb-10">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5" weight="bold" />
              Interview Sessions
            </h2>
            <div className="space-y-4">
              {sessions.map(session => {
                const isExpanded = expandedSections[`session-${session.id}`]
                const hasTopics = session.aiSuggestedTopics && session.aiSuggestedTopics.length > 0

                return (
                  <div
                    key={session.id}
                    className={cn(
                      'rounded-xl border transition-all',
                      session.status === 'completed'
                        ? 'bg-green-50 border-green-200'
                        : 'bg-card border-border/40'
                    )}
                  >
                    <button
                      onClick={() => toggleSection(`session-${session.id}`)}
                      className="w-full p-4 flex items-center gap-4 text-left"
                    >
                      <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-bold flex-shrink-0">
                        {session.sessionNumber}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium">
                          {session.title || `Session ${session.sessionNumber}`}
                        </div>
                        <div className="text-sm text-muted-foreground flex items-center gap-2 mt-0.5">
                          <Clock className="w-3.5 h-3.5" />
                          {formatDate(session.scheduledAt)}
                          <span>· {session.durationMinutes} min</span>
                        </div>
                      </div>
                      <div
                        className={cn(
                          'px-2.5 py-1 rounded-full text-xs font-medium flex-shrink-0',
                          getStatusStyle(session.status)
                        )}
                      >
                        {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
                      </div>
                      <div className="text-muted-foreground">
                        {isExpanded ? (
                          <CaretUp className="w-5 h-5" weight="bold" />
                        ) : (
                          <CaretDown className="w-5 h-5" weight="bold" />
                        )}
                      </div>
                    </button>

                    {isExpanded && hasTopics && (
                      <div className="px-4 pb-4 border-t border-border/40">
                        <div className="mt-4 space-y-3">
                          {session.aiSuggestedTopics!.map((topic, idx) => (
                            <div key={idx} className="p-4 bg-muted/50 rounded-lg">
                              <div className="font-medium text-foreground">{topic.topic}</div>
                              {topic.description && (
                                <p className="text-sm text-muted-foreground mt-1">{topic.description}</p>
                              )}
                              {topic.questions && topic.questions.length > 0 && (
                                <div className="mt-3">
                                  <div className="text-xs font-medium text-muted-foreground mb-2">
                                    Suggested Questions:
                                  </div>
                                  <ul className="space-y-1.5">
                                    {topic.questions.map((q, qIdx) => (
                                      <li key={qIdx} className="text-sm text-foreground flex items-start gap-2">
                                        <span className="text-primary font-bold">?</span>
                                        {q}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* Self Assessment Insights */}
        {selfAssessment && Object.keys(selfAssessment).length > 0 && (
          <section className="mb-10">
            <button
              onClick={() => toggleSection('selfAssessment')}
              className="w-full flex items-center justify-between mb-4"
            >
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Lightbulb className="w-5 h-5" weight="bold" />
                Expert Self-Assessment
              </h2>
              <div className="text-muted-foreground">
                {expandedSections.selfAssessment ? (
                  <CaretUp className="w-5 h-5" weight="bold" />
                ) : (
                  <CaretDown className="w-5 h-5" weight="bold" />
                )}
              </div>
            </button>

            {expandedSections.selfAssessment && (
              <div className="p-5 bg-card rounded-xl border border-border/40 space-y-5">
                {selfAssessment.what_you_know && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">What They Know Best</p>
                    <p className="text-foreground">{selfAssessment.what_you_know}</p>
                  </div>
                )}

                {selfAssessment.questions_people_ask && selfAssessment.questions_people_ask.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Questions People Ask Them</p>
                    <ul className="space-y-1.5">
                      {selfAssessment.questions_people_ask.map((q, i) => (
                        <li key={i} className="text-foreground flex items-start gap-2">
                          <span className="text-primary">•</span>
                          {q}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {selfAssessment.what_will_break && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">What Might Be Challenging</p>
                    <p className="text-foreground">{selfAssessment.what_will_break}</p>
                  </div>
                )}

                {selfAssessment.topics_to_cover && selfAssessment.topics_to_cover.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Topics They Want to Cover</p>
                    <div className="flex flex-wrap gap-2">
                      {selfAssessment.topics_to_cover.map((topic, i) => (
                        <span key={i} className="px-3 py-1.5 bg-secondary rounded-full text-sm">{topic}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>
        )}

        {/* Collaborator Insights */}
        {collaboratorInsights.length > 0 && (
          <section className="mb-10">
            <button
              onClick={() => toggleSection('collaborators')}
              className="w-full flex items-center justify-between mb-4"
            >
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <ChatCircleText className="w-5 h-5" weight="bold" />
                Collaborator Insights
                <span className="text-sm font-normal text-muted-foreground">
                  ({collaboratorInsights.length} response{collaboratorInsights.length !== 1 ? 's' : ''})
                </span>
              </h2>
              <div className="text-muted-foreground">
                {expandedSections.collaborators ? (
                  <CaretUp className="w-5 h-5" weight="bold" />
                ) : (
                  <CaretDown className="w-5 h-5" weight="bold" />
                )}
              </div>
            </button>

            {expandedSections.collaborators && (
              <div className="space-y-4">
                {collaboratorInsights.map((collab, index) => (
                  <div key={index} className="p-5 bg-card rounded-xl border border-border/40">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                        <User className="w-5 h-5 text-muted-foreground" weight="bold" />
                      </div>
                      <div>
                        <p className="font-medium">{collab.name}</p>
                        <p className="text-sm text-muted-foreground">{collab.role}</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {collab.what_they_ask_about && collab.what_they_ask_about.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground mb-2">What They Ask About</p>
                          <ul className="space-y-1">
                            {collab.what_they_ask_about.map((q, i) => (
                              <li key={i} className="text-foreground text-sm flex items-start gap-2">
                                <span className="text-primary">•</span>
                                {q}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {collab.what_will_be_hard && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground mb-2">What Would Be Hard</p>
                          <p className="text-sm text-foreground">{collab.what_will_be_hard}</p>
                        </div>
                      )}

                      {collab.wish_was_documented && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground mb-2">Wish Was Documented</p>
                          <p className="text-sm text-foreground">{collab.wish_was_documented}</p>
                        </div>
                      )}

                      {collab.specific_questions && collab.specific_questions.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground mb-2">Specific Questions</p>
                          <ul className="space-y-1.5">
                            {collab.specific_questions.map((q, i) => (
                              <li key={i} className="text-sm text-foreground flex items-start gap-2">
                                <span className="text-primary font-bold">?</span>
                                {q}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* No content message */}
        {!selfAssessment && collaboratorInsights.length === 0 && sessions.length === 0 && skills.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p>No additional information has been gathered yet.</p>
            <p className="text-sm mt-2">Check back later as the campaign progresses.</p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 mt-auto">
        <div className="max-w-4xl mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          <p>Tacit Knowledge Capture Platform</p>
        </div>
      </footer>
    </div>
  )
}
