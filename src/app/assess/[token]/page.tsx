'use client'

import { useEffect, useState, useCallback, use } from 'react'
import { Sparkle, CircleNotch, Check, FloppyDisk, Warning, PaperPlaneTilt, Plus, X } from 'phosphor-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FileUpload } from '@/components/prepare/file-upload'

interface SelfAssessmentData {
  what_you_know?: string
  questions_people_ask?: string[]
  what_will_break?: string
  topics_to_cover?: string[]
  doc_links?: string[]
}

interface CampaignData {
  id: string
  expert_name: string
  expert_role: string
  department?: string
  goal?: string
  self_assessment?: SelfAssessmentData
}

interface TokenInfo {
  tokenId: string
  email: string
  name: string | null
  submittedAt: string | null
  draftData: SelfAssessmentData | null
  campaign: CampaignData
}

type PageStatus = 'loading' | 'ready' | 'expired' | 'error' | 'submitted'

export default function ExpertAssessmentPage({ params }: { params: Promise<{ token: string }> }) {
  const resolvedParams = use(params)
  const { token } = resolvedParams

  const [status, setStatus] = useState<PageStatus>('loading')
  const [error, setError] = useState<string | null>(null)
  const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null)
  const [formData, setFormData] = useState<SelfAssessmentData>({
    what_you_know: '',
    questions_people_ask: [],
    what_will_break: '',
    topics_to_cover: [],
    doc_links: [],
  })
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Input states for array fields
  const [newQuestion, setNewQuestion] = useState('')
  const [newTopic, setNewTopic] = useState('')
  const [newDocLink, setNewDocLink] = useState('')

  // Fetch token info on mount
  useEffect(() => {
    async function fetchTokenInfo() {
      try {
        const response = await fetch(`/api/public/assess?token=${token}`)
        const data = await response.json()

        if (!response.ok) {
          if (response.status === 410) {
            setStatus('expired')
          } else {
            setError(data.error || 'Failed to load assessment')
            setStatus('error')
          }
          return
        }

        setTokenInfo(data)

        // Load existing data (draft or campaign self_assessment)
        const existingData = data.draftData || data.campaign?.self_assessment || {}
        setFormData({
          what_you_know: existingData.what_you_know || '',
          questions_people_ask: existingData.questions_people_ask || [],
          what_will_break: existingData.what_will_break || '',
          topics_to_cover: existingData.topics_to_cover || [],
          doc_links: existingData.doc_links || [],
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
      await fetch('/api/public/assess', {
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

  // Submit assessment
  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      const response = await fetch('/api/public/assess', {
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
      setError('Failed to submit assessment')
    } finally {
      setSubmitting(false)
    }
  }

  // Array field handlers
  const addQuestion = () => {
    if (newQuestion.trim()) {
      setFormData(prev => ({
        ...prev,
        questions_people_ask: [...(prev.questions_people_ask || []), newQuestion.trim()],
      }))
      setNewQuestion('')
    }
  }

  const removeQuestion = (index: number) => {
    setFormData(prev => ({
      ...prev,
      questions_people_ask: prev.questions_people_ask?.filter((_, i) => i !== index),
    }))
  }

  const addTopic = () => {
    if (newTopic.trim()) {
      setFormData(prev => ({
        ...prev,
        topics_to_cover: [...(prev.topics_to_cover || []), newTopic.trim()],
      }))
      setNewTopic('')
    }
  }

  const removeTopic = (index: number) => {
    setFormData(prev => ({
      ...prev,
      topics_to_cover: prev.topics_to_cover?.filter((_, i) => i !== index),
    }))
  }

  const addDocLink = () => {
    if (newDocLink.trim()) {
      setFormData(prev => ({
        ...prev,
        doc_links: [...(prev.doc_links || []), newDocLink.trim()],
      }))
      setNewDocLink('')
    }
  }

  const removeDocLink = (index: number) => {
    setFormData(prev => ({
      ...prev,
      doc_links: prev.doc_links?.filter((_, i) => i !== index),
    }))
  }

  // Loading state
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <CircleNotch className="w-8 h-8 animate-spin mx-auto text-muted-foreground" weight="bold" />
          <p className="mt-4 text-muted-foreground">Loading your assessment...</p>
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
            This assessment link has expired. Please contact your organization to request a new link.
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
          <p className="text-muted-foreground">{error || 'Unable to load the assessment. Please try again later.'}</p>
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
          <h1 className="text-2xl font-semibold mb-3">Assessment Submitted</h1>
          <p className="text-muted-foreground mb-6">
            Thank you for completing your self-assessment. Your responses have been saved and will help guide the knowledge capture sessions.
          </p>
          <p className="text-sm text-muted-foreground">
            You can close this page. If you need to make changes, use the same link to return.
          </p>
        </div>
      </div>
    )
  }

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
          <p className="text-sm text-muted-foreground mb-2 uppercase tracking-wider">Expert Self-Assessment</p>
          <h1 className="text-3xl font-semibold mb-4">
            Hi {tokenInfo?.name || tokenInfo?.campaign?.expert_name || 'there'},
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            We&apos;re preparing to capture your expertise as <strong className="text-foreground">{tokenInfo?.campaign?.expert_role || 'a specialist'}</strong>.
            Your self-reflection helps us ask better questions and focus on what matters most.
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
          {/* What You Know */}
          <section>
            <label className="block mb-3">
              <span className="text-lg font-medium">What do you know that others don&apos;t?</span>
              <span className="block text-sm text-muted-foreground mt-1">
                Think about the knowledge that exists only in your head - things you&apos;ve learned through experience that aren&apos;t written down anywhere.
              </span>
            </label>
            <textarea
              className="w-full min-h-[160px] px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-y"
              placeholder="I know how to handle edge cases in our billing system that aren't documented anywhere. I also understand the historical reasons why we built certain features the way we did..."
              value={formData.what_you_know}
              onChange={(e) => setFormData(prev => ({ ...prev, what_you_know: e.target.value }))}
            />
          </section>

          {/* Questions People Ask */}
          <section>
            <label className="block mb-3">
              <span className="text-lg font-medium">What questions do people frequently ask you?</span>
              <span className="block text-sm text-muted-foreground mt-1">
                List the things colleagues regularly come to you for help with.
              </span>
            </label>
            <div className="space-y-2">
              {formData.questions_people_ask?.map((question, index) => (
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
                  placeholder="How do I configure the deployment pipeline?"
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

          {/* What Will Break */}
          <section>
            <label className="block mb-3">
              <span className="text-lg font-medium">What might become challenging without your expertise?</span>
              <span className="block text-sm text-muted-foreground mt-1">
                Be honest about the processes, relationships, or knowledge that depend on your involvement.
              </span>
            </label>
            <textarea
              className="w-full min-h-[160px] px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-y"
              placeholder="The vendor relationship with Acme Corp relies on my personal contact there. The monthly reconciliation process has edge cases that only I know how to handle..."
              value={formData.what_will_break}
              onChange={(e) => setFormData(prev => ({ ...prev, what_will_break: e.target.value }))}
            />
          </section>

          {/* Topics to Cover */}
          <section>
            <label className="block mb-3">
              <span className="text-lg font-medium">What topics should we definitely cover?</span>
              <span className="block text-sm text-muted-foreground mt-1">
                List specific areas of knowledge you think are most important to capture.
              </span>
            </label>
            <div className="space-y-2">
              {formData.topics_to_cover?.map((topic, index) => (
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
                  placeholder="Customer escalation procedures"
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

          {/* Relevant Documents */}
          <section>
            <label className="block mb-3">
              <span className="text-lg font-medium">Any existing documentation?</span>
              <span className="block text-sm text-muted-foreground mt-1">
                Upload documents or share links to wikis and resources relevant to your role.
              </span>
            </label>

            {/* File Upload */}
            <div className="mb-4">
              <FileUpload
                token={token}
                compact
                showAnalyzeButton={false}
              />
            </div>

            {/* Document Links */}
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Or add links to existing resources:</p>
              {formData.doc_links?.map((link, index) => (
                <div key={index} className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg border border-border/40">
                  <span className="flex-1 truncate text-sm">{link}</span>
                  <button
                    onClick={() => removeDocLink(index)}
                    className="p-1 hover:bg-background rounded transition-colors"
                  >
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
              ))}
              <div className="flex gap-2">
                <Input
                  placeholder="https://docs.company.com/process-guide"
                  value={newDocLink}
                  onChange={(e) => setNewDocLink(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addDocLink())}
                />
                <Button variant="outline" size="icon" onClick={addDocLink}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
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
                  Submit Assessment
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
