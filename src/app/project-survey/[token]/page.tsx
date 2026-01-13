'use client'

import { useEffect, useState, useCallback, use } from 'react'
import { Sparkle, CircleNotch, Check, FloppyDisk, Warning, PaperPlaneTilt, Plus, X } from 'phosphor-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FileUpload } from '@/components/prepare/file-upload'

interface ProjectSurveyData {
  responsibilities?: string
  undocumented_knowledge?: string
  critical_knowledge?: string
  questions_for_team?: string[]
  additional_context?: string
}

interface CampaignData {
  id: string
  expert_name: string // In project context, this is the project name
  expert_role?: string
  goal?: string
  subject_type: string
}

interface TokenInfo {
  tokenId: string
  campaignId: string
  contributorEmail: string
  contributorName: string | null
  contributorRole: string | null
  submittedAt: string | null
  draftData: ProjectSurveyData | null
  existingResponse: ProjectSurveyData | null
  campaign: CampaignData
}

type PageStatus = 'loading' | 'ready' | 'expired' | 'error' | 'submitted'

export default function ProjectSurveyPage({ params }: { params: Promise<{ token: string }> }) {
  const resolvedParams = use(params)
  const { token } = resolvedParams

  const [status, setStatus] = useState<PageStatus>('loading')
  const [error, setError] = useState<string | null>(null)
  const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null)
  const [formData, setFormData] = useState<ProjectSurveyData>({
    responsibilities: '',
    undocumented_knowledge: '',
    critical_knowledge: '',
    questions_for_team: [],
    additional_context: '',
  })
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Input state for questions array
  const [newQuestion, setNewQuestion] = useState('')

  // Fetch token info on mount
  useEffect(() => {
    async function fetchTokenInfo() {
      try {
        const response = await fetch(`/api/public/project-survey?token=${token}`)
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
          responsibilities: existingData.responsibilities || '',
          undocumented_knowledge: existingData.undocumented_knowledge || '',
          critical_knowledge: existingData.critical_knowledge || '',
          questions_for_team: existingData.questions_for_team || [],
          additional_context: existingData.additional_context || '',
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
      await fetch('/api/public/project-survey', {
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
      const response = await fetch('/api/public/project-survey', {
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

  // Question array handlers
  const addQuestion = () => {
    if (newQuestion.trim()) {
      setFormData(prev => ({
        ...prev,
        questions_for_team: [...(prev.questions_for_team || []), newQuestion.trim()],
      }))
      setNewQuestion('')
    }
  }

  const removeQuestion = (index: number) => {
    setFormData(prev => ({
      ...prev,
      questions_for_team: prev.questions_for_team?.filter((_, i) => i !== index),
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
          <h1 className="text-2xl font-semibold mb-3">Survey Submitted</h1>
          <p className="text-muted-foreground mb-6">
            Thank you for sharing your knowledge about <strong>{tokenInfo?.campaign?.expert_name || 'the project'}</strong>. Your input will help guide knowledge capture sessions.
          </p>
          <p className="text-sm text-muted-foreground">
            You can close this page. If you need to make changes, use the same link to return.
          </p>
        </div>
      </div>
    )
  }

  const projectName = tokenInfo?.campaign?.expert_name || 'the project'

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
          <p className="text-sm text-muted-foreground mb-2 uppercase tracking-wider">Project Knowledge Survey</p>
          <h1 className="text-3xl font-semibold mb-4">
            Hi {tokenInfo?.contributorName || 'there'},
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            You&apos;ve been identified as someone with valuable knowledge about{' '}
            <strong className="text-foreground">{projectName}</strong>.
            Help us understand what institutional knowledge exists and should be captured.
          </p>
          {tokenInfo?.campaign?.goal && (
            <div className="mt-6 p-4 bg-muted/50 rounded-lg border border-border/40">
              <p className="text-sm font-medium mb-1">Project Description</p>
              <p className="text-muted-foreground">{tokenInfo.campaign.goal}</p>
            </div>
          )}
        </div>

        {/* Form sections */}
        <div className="space-y-10">
          {/* Responsibilities */}
          <section>
            <label className="block mb-3">
              <span className="text-lg font-medium">What&apos;s your involvement with {projectName}?</span>
              <span className="block text-sm text-muted-foreground mt-1">
                Describe your role and what aspects you work on or know about.
              </span>
            </label>
            <textarea
              className="w-full min-h-[120px] px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-y"
              placeholder="I'm the primary developer for the authentication module. I also handle deployments and have worked on the API integration layer..."
              value={formData.responsibilities}
              onChange={(e) => setFormData(prev => ({ ...prev, responsibilities: e.target.value }))}
            />
          </section>

          {/* Undocumented knowledge */}
          <section>
            <label className="block mb-3">
              <span className="text-lg font-medium">What knowledge exists only in people&apos;s heads?</span>
              <span className="block text-sm text-muted-foreground mt-1">
                What do you know about this project that isn&apos;t written down anywhere?
              </span>
            </label>
            <textarea
              className="w-full min-h-[160px] px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-y"
              placeholder="The reason we use that specific caching strategy is because of a performance issue we hit 2 years ago. There's also a manual workaround we have to do when..."
              value={formData.undocumented_knowledge}
              onChange={(e) => setFormData(prev => ({ ...prev, undocumented_knowledge: e.target.value }))}
            />
          </section>

          {/* Critical knowledge */}
          <section>
            <label className="block mb-3">
              <span className="text-lg font-medium">What knowledge would be lost if the team changed?</span>
              <span className="block text-sm text-muted-foreground mt-1">
                If key people left, what would be hardest for newcomers to figure out?
              </span>
            </label>
            <textarea
              className="w-full min-h-[160px] px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-y"
              placeholder="How to troubleshoot the monthly reconciliation process - it requires understanding the legacy system quirks. Also, the relationship with the external vendor and their undocumented API behaviors..."
              value={formData.critical_knowledge}
              onChange={(e) => setFormData(prev => ({ ...prev, critical_knowledge: e.target.value }))}
            />
          </section>

          {/* Questions for the team */}
          <section>
            <label className="block mb-3">
              <span className="text-lg font-medium">What should we ask team members about?</span>
              <span className="block text-sm text-muted-foreground mt-1">
                Suggest topics or questions that would help capture the most important knowledge.
              </span>
            </label>
            <div className="space-y-2">
              {formData.questions_for_team?.map((question, index) => (
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
                  placeholder="How do you handle edge cases in the payment flow?"
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

          {/* Additional context */}
          <section>
            <label className="block mb-3">
              <span className="text-lg font-medium">Anything else we should know?</span>
              <span className="block text-sm text-muted-foreground mt-1">
                Share any other context that would help with knowledge capture.
              </span>
            </label>
            <textarea
              className="w-full min-h-[120px] px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-y"
              placeholder="Any historical context, upcoming changes, or concerns about knowledge gaps..."
              value={formData.additional_context}
              onChange={(e) => setFormData(prev => ({ ...prev, additional_context: e.target.value }))}
            />
          </section>

          {/* Supporting Documents */}
          <section>
            <label className="block mb-3">
              <span className="text-lg font-medium">Supporting documents (optional)</span>
              <span className="block text-sm text-muted-foreground mt-1">
                Upload any documents, screenshots, or materials that contain relevant knowledge.
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
