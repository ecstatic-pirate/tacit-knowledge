'use client'

import { useEffect, useState, useCallback, use } from 'react'
import { Sparkle, CircleNotch, Check, FloppyDisk, Warning, PaperPlaneTilt, Plus, X } from 'phosphor-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FileUpload } from '@/components/prepare/file-upload'

interface CollaboratorSurveyData {
  what_they_ask_about?: string[]
  what_will_be_hard?: string
  wish_was_documented?: string
  specific_questions?: string[]
  additional_notes?: string
}

interface CampaignData {
  id: string
  expert_name: string
  expert_role: string
  department?: string
  goal?: string
}

interface TokenInfo {
  tokenId: string
  campaignId: string
  collaboratorEmail: string
  collaboratorName: string | null
  collaboratorRole: string | null
  submittedAt: string | null
  draftData: CollaboratorSurveyData | null
  existingResponse: CollaboratorSurveyData | null
  campaign: CampaignData
}

type PageStatus = 'loading' | 'ready' | 'expired' | 'error' | 'submitted'

const roleLabels: Record<string, string> = {
  successor: 'Successor',
  teammate: 'Teammate',
  partner: 'Partner',
  manager: 'Manager',
  report: 'Direct Report',
}

export default function CollaboratorFeedbackPage({ params }: { params: Promise<{ token: string }> }) {
  const resolvedParams = use(params)
  const { token } = resolvedParams

  const [status, setStatus] = useState<PageStatus>('loading')
  const [error, setError] = useState<string | null>(null)
  const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null)
  const [formData, setFormData] = useState<CollaboratorSurveyData>({
    what_they_ask_about: [],
    what_will_be_hard: '',
    wish_was_documented: '',
    specific_questions: [],
    additional_notes: '',
  })
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Input states for array fields
  const [newTopic, setNewTopic] = useState('')
  const [newQuestion, setNewQuestion] = useState('')

  // Fetch token info on mount
  useEffect(() => {
    async function fetchTokenInfo() {
      try {
        const response = await fetch(`/api/public/feedback?token=${token}`)
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

        // Load existing data (draft or existing response)
        const existingData = data.draftData || data.existingResponse || {}
        setFormData({
          what_they_ask_about: existingData.what_they_ask_about || [],
          what_will_be_hard: existingData.what_will_be_hard || '',
          wish_was_documented: existingData.wish_was_documented || '',
          specific_questions: existingData.specific_questions || [],
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
      await fetch('/api/public/feedback', {
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
    setSubmitting(true)
    try {
      const response = await fetch('/api/public/feedback', {
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
      setError('Failed to submit feedback')
    } finally {
      setSubmitting(false)
    }
  }

  // Array field handlers
  const addTopic = () => {
    if (newTopic.trim()) {
      setFormData(prev => ({
        ...prev,
        what_they_ask_about: [...(prev.what_they_ask_about || []), newTopic.trim()],
      }))
      setNewTopic('')
    }
  }

  const removeTopic = (index: number) => {
    setFormData(prev => ({
      ...prev,
      what_they_ask_about: prev.what_they_ask_about?.filter((_, i) => i !== index),
    }))
  }

  const addQuestion = () => {
    if (newQuestion.trim()) {
      setFormData(prev => ({
        ...prev,
        specific_questions: [...(prev.specific_questions || []), newQuestion.trim()],
      }))
      setNewQuestion('')
    }
  }

  const removeQuestion = (index: number) => {
    setFormData(prev => ({
      ...prev,
      specific_questions: prev.specific_questions?.filter((_, i) => i !== index),
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
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
            <Check className="w-8 h-8 text-green-600" weight="bold" />
          </div>
          <h1 className="text-2xl font-semibold mb-3">Feedback Submitted</h1>
          <p className="text-muted-foreground mb-6">
            Thank you for your input about {tokenInfo?.campaign?.expert_name}. Your perspective will help guide the knowledge capture sessions.
          </p>
          <p className="text-sm text-muted-foreground">
            You can close this page. If you need to make changes, use the same link to return.
          </p>
        </div>
      </div>
    )
  }

  const roleLabel = tokenInfo?.collaboratorRole ? roleLabels[tokenInfo.collaboratorRole] || tokenInfo.collaboratorRole : 'Collaborator'

  // Main form
  return (
    <div className="min-h-screen bg-background">
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
      <main className="max-w-3xl mx-auto px-4 py-12">
        {/* Intro section */}
        <div className="mb-12">
          <p className="text-sm text-muted-foreground mb-2 uppercase tracking-wider">Collaborator Input</p>
          <h1 className="text-3xl font-semibold mb-4">
            Hi {tokenInfo?.collaboratorName || 'there'},
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            As {tokenInfo?.collaboratorName ? `${roleLabel.toLowerCase()} to` : 'someone who works with'}{' '}
            <strong className="text-foreground">{tokenInfo?.campaign?.expert_name || 'the expert'}</strong>,
            your perspective is valuable. Help us understand what knowledge is most important to capture.
          </p>
          {tokenInfo?.campaign?.goal && (
            <div className="mt-6 p-4 bg-muted/50 rounded-lg border border-border/40">
              <p className="text-sm font-medium mb-1">Campaign Goal</p>
              <p className="text-muted-foreground">{tokenInfo.campaign.goal}</p>
            </div>
          )}
        </div>

        {/* Form sections */}
        <div className="space-y-10">
          {/* What do you ask about */}
          <section>
            <label className="block mb-3">
              <span className="text-lg font-medium">What do you often ask {tokenInfo?.campaign?.expert_name?.split(' ')[0] || 'them'} about?</span>
              <span className="block text-sm text-muted-foreground mt-1">
                List the topics or areas where you typically seek their expertise.
              </span>
            </label>
            <div className="space-y-2">
              {formData.what_they_ask_about?.map((topic, index) => (
                <div key={index} className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg border border-border/40">
                  <span className="flex-1">{topic}</span>
                  <button
                    onClick={() => removeTopic(index)}
                    className="p-1 hover:bg-background rounded transition-colors"
                  >
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
              ))}
              <div className="flex gap-2">
                <Input
                  placeholder="Legacy system migrations, customer escalations..."
                  value={newTopic}
                  onChange={(e) => setNewTopic(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTopic())}
                />
                <Button variant="outline" size="icon" onClick={addTopic}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </section>

          {/* What will be hard to replace */}
          <section>
            <label className="block mb-3">
              <span className="text-lg font-medium">What will be hardest to capture or replace?</span>
              <span className="block text-sm text-muted-foreground mt-1">
                From your perspective, what aspects of their knowledge or skills would be most difficult to transfer?
              </span>
            </label>
            <textarea
              className="w-full min-h-[160px] px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-y"
              placeholder="Their ability to quickly diagnose production issues comes from years of experience with the system. They know all the edge cases and can spot patterns that others miss..."
              value={formData.what_will_be_hard}
              onChange={(e) => setFormData(prev => ({ ...prev, what_will_be_hard: e.target.value }))}
            />
          </section>

          {/* What should be documented */}
          <section>
            <label className="block mb-3">
              <span className="text-lg font-medium">What do you wish was documented?</span>
              <span className="block text-sm text-muted-foreground mt-1">
                What knowledge or processes would you love to have written down?
              </span>
            </label>
            <textarea
              className="w-full min-h-[160px] px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-y"
              placeholder="I wish there was documentation on how they handle the quarterly compliance audit. Also, their process for onboarding enterprise clients..."
              value={formData.wish_was_documented}
              onChange={(e) => setFormData(prev => ({ ...prev, wish_was_documented: e.target.value }))}
            />
          </section>

          {/* Specific questions */}
          <section>
            <label className="block mb-3">
              <span className="text-lg font-medium">Any specific questions for the interview?</span>
              <span className="block text-sm text-muted-foreground mt-1">
                Suggest questions you&apos;d like us to ask during the knowledge capture sessions.
              </span>
            </label>
            <div className="space-y-2">
              {formData.specific_questions?.map((question, index) => (
                <div key={index} className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg border border-border/40">
                  <span className="flex-1">{question}</span>
                  <button
                    onClick={() => removeQuestion(index)}
                    className="p-1 hover:bg-background rounded transition-colors"
                  >
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
              ))}
              <div className="flex gap-2">
                <Input
                  placeholder="How do you decide when to escalate an issue?"
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addQuestion())}
                />
                <Button variant="outline" size="icon" onClick={addQuestion}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </section>

          {/* Additional notes */}
          <section>
            <label className="block mb-3">
              <span className="text-lg font-medium">Anything else?</span>
              <span className="block text-sm text-muted-foreground mt-1">
                Share any other thoughts that might help with the knowledge capture process.
              </span>
            </label>
            <textarea
              className="w-full min-h-[120px] px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-y"
              placeholder="Any additional context, concerns, or suggestions..."
              value={formData.additional_notes}
              onChange={(e) => setFormData(prev => ({ ...prev, additional_notes: e.target.value }))}
            />
          </section>

          {/* Supporting Documents */}
          <section>
            <label className="block mb-3">
              <span className="text-lg font-medium">Supporting documents (optional)</span>
              <span className="block text-sm text-muted-foreground mt-1">
                Upload any documents, screenshots, or materials that would help illustrate what needs to be captured.
              </span>
            </label>
            <FileUpload
              token={token}
              compact
              showAnalyzeButton={false}
            />
          </section>
        </div>

        {/* Submit section */}
        <div className="mt-12 pt-8 border-t border-border/40">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Your progress is saved automatically. Submit when ready.
            </p>
            <Button onClick={handleSubmit} disabled={submitting} size="lg">
              {submitting ? (
                <>
                  <CircleNotch className="w-4 h-4 mr-2 animate-spin" weight="bold" />
                  Submitting...
                </>
              ) : (
                <>
                  <PaperPlaneTilt className="w-4 h-4 mr-2" weight="bold" />
                  Submit Feedback
                </>
              )}
            </Button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 mt-16">
        <div className="max-w-3xl mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          <p>Tacit Knowledge Capture Platform</p>
        </div>
      </footer>
    </div>
  )
}
