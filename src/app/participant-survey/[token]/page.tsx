'use client'

import { useEffect, useState, useCallback, use } from 'react'
import { Sparkle, CircleNotch, Check, FloppyDisk, Warning, PaperPlaneTilt, Plus, X } from 'phosphor-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface ParticipantSurveyData {
  areas_of_expertise?: string[]
  knowledge_to_capture?: string
  questions_for_others?: string[]
  additional_notes?: string
}

interface CampaignData {
  id: string
  expert_name: string
  expert_role: string
  department?: string
  goal?: string
  subject_type?: string
  project_type?: string
}

interface ParticipantData {
  id: string
  name: string
  email: string | null
  role: string | null
  team: string | null
}

interface TokenInfo {
  tokenId: string
  campaignId: string
  participantEmail: string
  participantName: string | null
  participantRole: string | null
  submittedAt: string | null
  draftData: ParticipantSurveyData | null
  existingResponse: ParticipantSurveyData | null
  participant: ParticipantData | null
  campaign: CampaignData
}

type PageStatus = 'loading' | 'ready' | 'expired' | 'error' | 'submitted'

export default function ParticipantSurveyPage({ params }: { params: Promise<{ token: string }> }) {
  const resolvedParams = use(params)
  const { token } = resolvedParams

  const [status, setStatus] = useState<PageStatus>('loading')
  const [error, setError] = useState<string | null>(null)
  const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null)
  const [formData, setFormData] = useState<ParticipantSurveyData>({
    areas_of_expertise: [],
    knowledge_to_capture: '',
    questions_for_others: [],
    additional_notes: '',
  })
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Input states for array fields
  const [newExpertise, setNewExpertise] = useState('')
  const [newQuestion, setNewQuestion] = useState('')

  // Fetch token info on mount
  useEffect(() => {
    async function fetchTokenInfo() {
      try {
        const response = await fetch(`/api/public/participant-survey?token=${token}`)
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
          areas_of_expertise: existingData.areas_of_expertise || [],
          knowledge_to_capture: existingData.knowledge_to_capture || '',
          questions_for_others: existingData.questions_for_others || [],
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
      await fetch('/api/public/participant-survey', {
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

  // Submit survey
  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      const response = await fetch('/api/public/participant-survey', {
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
      setError('Failed to submit survey')
    } finally {
      setSubmitting(false)
    }
  }

  // Array field handlers
  const addExpertise = () => {
    if (newExpertise.trim()) {
      setFormData(prev => ({
        ...prev,
        areas_of_expertise: [...(prev.areas_of_expertise || []), newExpertise.trim()],
      }))
      setNewExpertise('')
    }
  }

  const removeExpertise = (index: number) => {
    setFormData(prev => ({
      ...prev,
      areas_of_expertise: prev.areas_of_expertise?.filter((_, i) => i !== index),
    }))
  }

  const addQuestion = () => {
    if (newQuestion.trim()) {
      setFormData(prev => ({
        ...prev,
        questions_for_others: [...(prev.questions_for_others || []), newQuestion.trim()],
      }))
      setNewQuestion('')
    }
  }

  const removeQuestion = (index: number) => {
    setFormData(prev => ({
      ...prev,
      questions_for_others: prev.questions_for_others?.filter((_, i) => i !== index),
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
            This survey link has expired. Please contact your organization to request a new link.
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
    const projectName = tokenInfo?.campaign?.expert_name || 'the project'
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
            <Check className="w-8 h-8 text-green-600" weight="bold" />
          </div>
          <h1 className="text-2xl font-semibold mb-3">Survey Submitted</h1>
          <p className="text-muted-foreground mb-6">
            Thank you for sharing your expertise about {projectName}. Your input will help guide the knowledge capture sessions.
          </p>
          <p className="text-sm text-muted-foreground">
            You can close this page. If you need to make changes, use the same link to return.
          </p>
        </div>
      </div>
    )
  }

  const projectName = tokenInfo?.campaign?.expert_name || 'the project'
  const participantName = tokenInfo?.participantName || tokenInfo?.participant?.name || 'there'

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
          <p className="text-sm text-muted-foreground mb-2 uppercase tracking-wider">Participant Survey</p>
          <h1 className="text-3xl font-semibold mb-4">
            Hi {participantName},
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            We&apos;re capturing knowledge about <strong className="text-foreground">{projectName}</strong>.
            Your expertise is valuable - please share what you know so we can ask the right questions during interviews.
          </p>
          {tokenInfo?.campaign?.goal && (
            <div className="mt-6 p-4 bg-muted/50 rounded-lg border border-border/40">
              <p className="text-sm font-medium mb-1">Project Goal</p>
              <p className="text-muted-foreground">{tokenInfo.campaign.goal}</p>
            </div>
          )}
        </div>

        {/* Form sections */}
        <div className="space-y-10">
          {/* Areas of expertise */}
          <section>
            <label className="block mb-3">
              <span className="text-lg font-medium">What topics or areas do you know best?</span>
              <span className="block text-sm text-muted-foreground mt-1">
                List the specific areas where you have deep knowledge related to this project.
              </span>
            </label>
            <div className="space-y-2">
              {formData.areas_of_expertise?.map((item, index) => (
                <div key={index} className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg border border-border/40">
                  <span className="flex-1">{item}</span>
                  <button
                    onClick={() => removeExpertise(index)}
                    className="p-1 hover:bg-background rounded transition-colors"
                  >
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
              ))}
              <div className="flex gap-2">
                <Input
                  placeholder="API integrations, deployment pipeline, customer onboarding..."
                  value={newExpertise}
                  onChange={(e) => setNewExpertise(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addExpertise())}
                />
                <Button variant="outline" size="icon" onClick={addExpertise}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </section>

          {/* Knowledge to capture */}
          <section>
            <label className="block mb-3">
              <span className="text-lg font-medium">What specific knowledge should we capture from you?</span>
              <span className="block text-sm text-muted-foreground mt-1">
                Describe the knowledge that exists primarily in your head that would be valuable to document.
              </span>
            </label>
            <textarea
              className="w-full min-h-[160px] px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-y"
              placeholder="I know how the legacy payment system integrates with our new API. I also understand why we made certain architectural decisions during the v2 migration that aren't documented anywhere..."
              value={formData.knowledge_to_capture}
              onChange={(e) => setFormData(prev => ({ ...prev, knowledge_to_capture: e.target.value }))}
            />
          </section>

          {/* Questions for others */}
          <section>
            <label className="block mb-3">
              <span className="text-lg font-medium">What questions should we ask other team members?</span>
              <span className="block text-sm text-muted-foreground mt-1">
                Suggest questions that would help capture important knowledge from others on the team.
              </span>
            </label>
            <div className="space-y-2">
              {formData.questions_for_others?.map((question, index) => (
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
                  placeholder="How does the authentication flow work? What happens when..."
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
                  Submit Survey
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
