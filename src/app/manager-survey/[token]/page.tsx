'use client'

import { useEffect, useState, useCallback, use } from 'react'
import { Sparkle, CircleNotch, Check, FloppyDisk, Warning, PaperPlaneTilt, Plus, X, Lightning, CaretDown, CaretUp } from 'phosphor-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { ManagerSurveyData } from '@/lib/supabase/database.types'

interface CampaignData {
  id: string
  expert_name: string
  expert_role: string
  department?: string
  goal?: string
  subject_type?: string
  project_type?: string
}

interface ExistingTopic {
  id: string
  name: string
  category: string | null
  suggested_by: string | null
}

interface TokenInfo {
  tokenId: string
  campaignId: string
  managerEmail: string
  managerName: string | null
  submittedAt: string | null
  draftData: ManagerSurveyData | null
  campaign: CampaignData
  existingTopics: ExistingTopic[]
}

interface SuggestedTopic {
  name: string
  category?: string
  priority?: 'high' | 'medium' | 'low'
  reason?: string
}

type PageStatus = 'loading' | 'ready' | 'expired' | 'error' | 'submitted'

const priorityLabels: Record<string, { label: string; color: string }> = {
  high: { label: 'High Priority', color: 'bg-red-100 text-red-700' },
  medium: { label: 'Medium Priority', color: 'bg-amber-100 text-amber-700' },
  low: { label: 'Low Priority', color: 'bg-stone-100 text-stone-600' },
}

const categoryOptions = [
  'Process Knowledge',
  'Technical Skills',
  'Domain Expertise',
  'Relationships & Contacts',
  'Decision Making',
  'Troubleshooting',
  'Best Practices',
  'Other',
]

export default function ManagerSurveyPage({ params }: { params: Promise<{ token: string }> }) {
  const resolvedParams = use(params)
  const { token } = resolvedParams

  const [status, setStatus] = useState<PageStatus>('loading')
  const [error, setError] = useState<string | null>(null)
  const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null)
  const [formData, setFormData] = useState<ManagerSurveyData>({
    suggested_topics: [],
    team_context: '',
    key_concerns: '',
    additional_notes: '',
  })
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // New topic form state
  const [showTopicForm, setShowTopicForm] = useState(false)
  const [newTopic, setNewTopic] = useState<SuggestedTopic>({
    name: '',
    category: undefined,
    priority: 'medium',
    reason: '',
  })

  // Existing topics section
  const [showExistingTopics, setShowExistingTopics] = useState(false)

  // Fetch token info on mount
  useEffect(() => {
    async function fetchTokenInfo() {
      try {
        const response = await fetch(`/api/public/manager-survey?token=${token}`)
        const data = await response.json()

        if (!response.ok) {
          if (response.status === 410) {
            setStatus('expired')
          } else {
            setError(data.error || 'Failed to load survey')
            setStatus('error')
          }
          return
        }

        setTokenInfo(data)

        // Load existing data (draft)
        const existingData = data.draftData || {}
        setFormData({
          suggested_topics: existingData.suggested_topics || [],
          team_context: existingData.team_context || '',
          key_concerns: existingData.key_concerns || '',
          additional_notes: existingData.additional_notes || '',
        })

        if (data.submittedAt) {
          setStatus('submitted')
        } else {
          setStatus('ready')
        }
      } catch {
        setError('Failed to connect to server')
        setStatus('error')
      }
    }

    fetchTokenInfo()
  }, [token])

  // Auto-save with debounce
  const saveDraft = useCallback(async () => {
    if (status !== 'ready' || saving) return

    setSaving(true)
    try {
      await fetch('/api/public/manager-survey', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, data: formData }),
      })
      setLastSaved(new Date())
    } catch (err) {
      console.error('Failed to save draft:', err)
    } finally {
      setSaving(false)
    }
  }, [token, formData, status, saving])

  // Debounced auto-save
  useEffect(() => {
    if (status !== 'ready') return

    const timer = setTimeout(() => {
      saveDraft()
    }, 2000)

    return () => clearTimeout(timer)
  }, [formData, status, saveDraft])

  // Submit feedback
  const handleSubmit = async () => {
    // Require at least one topic
    if (!formData.suggested_topics || formData.suggested_topics.length === 0) {
      setError('Please suggest at least one topic before submitting.')
      return
    }

    setSubmitting(true)
    setError(null)
    try {
      const response = await fetch('/api/public/manager-survey', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, data: formData, submit: true }),
      })

      if (response.ok) {
        setStatus('submitted')
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to submit')
      }
    } catch {
      setError('Failed to submit suggestions')
    } finally {
      setSubmitting(false)
    }
  }

  // Topic management
  const addTopic = () => {
    if (newTopic.name.trim()) {
      setFormData(prev => ({
        ...prev,
        suggested_topics: [
          ...(prev.suggested_topics || []),
          {
            name: newTopic.name.trim(),
            category: newTopic.category || undefined,
            priority: newTopic.priority || 'medium',
            reason: newTopic.reason?.trim() || undefined,
          },
        ],
      }))
      setNewTopic({ name: '', category: undefined, priority: 'medium', reason: '' })
      setShowTopicForm(false)
    }
  }

  const removeTopic = (index: number) => {
    setFormData(prev => ({
      ...prev,
      suggested_topics: prev.suggested_topics?.filter((_, i) => i !== index),
    }))
  }

  // Loading state
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <CircleNotch className="w-8 h-8 animate-spin mx-auto text-muted-foreground" weight="bold" />
          <p className="mt-4 text-muted-foreground">Loading your survey...</p>
        </div>
      </div>
    )
  }

  // Expired state
  if (status === 'expired') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-6">
            <Warning className="w-8 h-8 text-amber-600" weight="bold" />
          </div>
          <h1 className="text-2xl font-semibold mb-3">Link Expired</h1>
          <p className="text-muted-foreground">
            This survey link has expired. Please contact the organization to request a new link.
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
          <p className="text-muted-foreground">{error || 'Unable to load the survey. Please try again later.'}</p>
        </div>
      </div>
    )
  }

  // Success state
  if (status === 'submitted') {
    const topicCount = formData.suggested_topics?.length || 0
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
            <Check className="w-8 h-8 text-green-600" weight="bold" />
          </div>
          <h1 className="text-2xl font-semibold mb-3">Suggestions Submitted</h1>
          <p className="text-muted-foreground mb-6">
            Thank you for your input! Your {topicCount} suggested topic{topicCount !== 1 ? 's' : ''} will help guide the knowledge capture sessions for{' '}
            <strong className="text-foreground">{tokenInfo?.campaign?.expert_name || 'this project'}</strong>.
          </p>
          <p className="text-sm text-muted-foreground">
            You can close this page. If you need to make changes, use the same link to return.
          </p>
        </div>
      </div>
    )
  }

  const isProjectCampaign = tokenInfo?.campaign?.subject_type === 'project'
  const campaignTitle = isProjectCampaign
    ? tokenInfo?.campaign?.expert_name
    : `${tokenInfo?.campaign?.expert_name}'s knowledge`

  // Main form
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-primary text-primary-foreground flex items-center justify-center">
              <Sparkle className="w-4 h-4" weight="fill" />
            </div>
            <span className="font-serif font-bold text-xl">Tacit</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            {saving ? (
              <span className="flex items-center gap-1.5">
                <CircleNotch className="w-3.5 h-3.5 animate-spin" weight="bold" />
                Saving...
              </span>
            ) : lastSaved ? (
              <span className="flex items-center gap-1.5">
                <FloppyDisk className="w-3.5 h-3.5" weight="bold" />
                Saved
              </span>
            ) : null}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 max-w-3xl mx-auto px-4 py-12 w-full">
        {/* Intro section */}
        <div className="mb-12">
          <p className="text-sm text-muted-foreground mb-2 uppercase tracking-wider">Manager Input</p>
          <h1 className="text-3xl font-semibold mb-4">
            Hi {tokenInfo?.managerName || 'there'},
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            As a manager, your perspective on what knowledge is most important to capture is invaluable.
            Please suggest topics that should be covered when documenting{' '}
            <strong className="text-foreground">{campaignTitle}</strong>.
          </p>
          {tokenInfo?.campaign?.goal && (
            <div className="mt-6 p-4 bg-muted/50 rounded-lg border border-border/40">
              <p className="text-sm font-medium mb-1">Campaign Goal</p>
              <p className="text-muted-foreground">{tokenInfo.campaign.goal}</p>
            </div>
          )}
        </div>

        {/* Existing Topics Section */}
        {tokenInfo?.existingTopics && tokenInfo.existingTopics.length > 0 && (
          <section className="mb-10">
            <button
              onClick={() => setShowExistingTopics(!showExistingTopics)}
              className="w-full flex items-center justify-between p-4 bg-secondary/50 rounded-lg border border-border/40 hover:bg-secondary/70 transition-colors"
            >
              <span className="flex items-center gap-2">
                <Lightning className="w-5 h-5 text-muted-foreground" weight="bold" />
                <span className="font-medium">Existing Topics ({tokenInfo.existingTopics.length})</span>
                <span className="text-sm text-muted-foreground">- Topics already identified</span>
              </span>
              {showExistingTopics ? (
                <CaretUp className="w-4 h-4 text-muted-foreground" />
              ) : (
                <CaretDown className="w-4 h-4 text-muted-foreground" />
              )}
            </button>
            {showExistingTopics && (
              <div className="mt-3 p-4 bg-secondary/30 rounded-lg border border-border/40">
                <div className="flex flex-wrap gap-2">
                  {tokenInfo.existingTopics.map(topic => (
                    <div
                      key={topic.id}
                      className="px-3 py-1.5 rounded-full text-sm bg-background border border-border"
                    >
                      {topic.name}
                      {topic.category && (
                        <span className="text-xs text-muted-foreground ml-1">({topic.category})</span>
                      )}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  These topics have already been identified. Feel free to suggest additional topics that should be covered.
                </p>
              </div>
            )}
          </section>
        )}

        {/* Form sections */}
        <div className="space-y-10">
          {/* Suggested Topics */}
          <section>
            <label className="block mb-3">
              <span className="text-lg font-medium">Suggest Topics to Cover</span>
              <span className="block text-sm text-muted-foreground mt-1">
                What knowledge areas should be documented? Add topics you think are important for your team.
              </span>
            </label>

            {/* List of suggested topics */}
            <div className="space-y-2 mb-4">
              {formData.suggested_topics?.map((topic, index) => (
                <div key={index} className="flex items-start gap-2 p-4 bg-muted/50 rounded-lg border border-border/40">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{topic.name}</span>
                      {topic.priority && (
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${priorityLabels[topic.priority]?.color || 'bg-stone-100 text-stone-600'}`}>
                          {priorityLabels[topic.priority]?.label || topic.priority}
                        </span>
                      )}
                    </div>
                    {topic.category && (
                      <p className="text-sm text-muted-foreground">{topic.category}</p>
                    )}
                    {topic.reason && (
                      <p className="text-sm text-muted-foreground mt-1 italic">&quot;{topic.reason}&quot;</p>
                    )}
                  </div>
                  <button
                    onClick={() => removeTopic(index)}
                    className="p-1.5 hover:bg-background rounded transition-colors flex-shrink-0"
                  >
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add topic form */}
            {showTopicForm ? (
              <div className="p-4 bg-secondary/50 rounded-lg border border-border/40 space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Topic Name *</label>
                  <Input
                    placeholder="e.g., Production deployment process"
                    value={newTopic.name}
                    onChange={(e) => setNewTopic(prev => ({ ...prev, name: e.target.value }))}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTopic())}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Category</label>
                    <select
                      value={newTopic.category || ''}
                      onChange={(e) => setNewTopic(prev => ({ ...prev, category: e.target.value || undefined }))}
                      className="w-full px-3 py-2 border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="">Select category...</option>
                      {categoryOptions.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Priority</label>
                    <select
                      value={newTopic.priority || 'medium'}
                      onChange={(e) => setNewTopic(prev => ({ ...prev, priority: e.target.value as 'high' | 'medium' | 'low' }))}
                      className="w-full px-3 py-2 border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="high">High Priority</option>
                      <option value="medium">Medium Priority</option>
                      <option value="low">Low Priority</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">Why is this important? (optional)</label>
                  <Input
                    placeholder="e.g., We lose time every release because only one person knows this"
                    value={newTopic.reason || ''}
                    onChange={(e) => setNewTopic(prev => ({ ...prev, reason: e.target.value }))}
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <Button onClick={addTopic} disabled={!newTopic.name.trim()}>
                    <Plus className="w-4 h-4 mr-1.5" />
                    Add Topic
                  </Button>
                  <Button variant="outline" onClick={() => setShowTopicForm(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <Button variant="outline" onClick={() => setShowTopicForm(true)}>
                <Plus className="w-4 h-4 mr-1.5" />
                Add Topic
              </Button>
            )}
          </section>

          {/* Team Context */}
          <section>
            <label className="block mb-3">
              <span className="text-lg font-medium">Team Context (optional)</span>
              <span className="block text-sm text-muted-foreground mt-1">
                Help us understand your team&apos;s relationship to this knowledge. Who relies on it? How is it used?
              </span>
            </label>
            <textarea
              className="w-full min-h-[120px] px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-y"
              placeholder="Our team depends on this knowledge for... The main people who need access are..."
              value={formData.team_context}
              onChange={(e) => setFormData(prev => ({ ...prev, team_context: e.target.value }))}
            />
          </section>

          {/* Key Concerns */}
          <section>
            <label className="block mb-3">
              <span className="text-lg font-medium">Key Concerns (optional)</span>
              <span className="block text-sm text-muted-foreground mt-1">
                What keeps you up at night about knowledge gaps? What risks do you see if certain knowledge isn&apos;t captured?
              </span>
            </label>
            <textarea
              className="w-full min-h-[120px] px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-y"
              placeholder="I'm concerned that... If we lose this knowledge..."
              value={formData.key_concerns}
              onChange={(e) => setFormData(prev => ({ ...prev, key_concerns: e.target.value }))}
            />
          </section>

          {/* Additional Notes */}
          <section>
            <label className="block mb-3">
              <span className="text-lg font-medium">Anything else? (optional)</span>
              <span className="block text-sm text-muted-foreground mt-1">
                Share any other thoughts or context that might help guide the knowledge capture process.
              </span>
            </label>
            <textarea
              className="w-full min-h-[100px] px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-y"
              placeholder="Additional context, timeline concerns, specific people to involve..."
              value={formData.additional_notes}
              onChange={(e) => setFormData(prev => ({ ...prev, additional_notes: e.target.value }))}
            />
          </section>
        </div>

        {/* Error display */}
        {error && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Submit section */}
        <div className="mt-12 pt-8 border-t border-border/40">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                Your progress is saved automatically. Submit when ready.
              </p>
              {formData.suggested_topics && formData.suggested_topics.length > 0 && (
                <p className="text-sm text-foreground mt-1">
                  {formData.suggested_topics.length} topic{formData.suggested_topics.length !== 1 ? 's' : ''} suggested
                </p>
              )}
            </div>
            <Button
              onClick={handleSubmit}
              disabled={submitting || !formData.suggested_topics?.length}
              size="lg"
            >
              {submitting ? (
                <>
                  <CircleNotch className="w-4 h-4 mr-2 animate-spin" weight="bold" />
                  Submitting...
                </>
              ) : (
                <>
                  <PaperPlaneTilt className="w-4 h-4 mr-2" weight="bold" />
                  Submit Suggestions
                </>
              )}
            </Button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 mt-auto">
        <div className="max-w-3xl mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          <p>Tacit Knowledge Capture Platform</p>
        </div>
      </footer>
    </div>
  )
}
