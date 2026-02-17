'use client'

import { useEffect, useState, use } from 'react'
import { CircleNotch, Check, Warning, ArrowSquareOut } from 'phosphor-react'
import { Button } from '@/components/ui/button'
import { getCheckInTemplate, type CheckInTemplate } from '@/lib/check-in-questions'

interface CampaignInfo {
  id: string
  name: string
  initiativeStatus: string | null
}

interface TokenInfo {
  id: string
  name: string | null
  email: string
}

interface RelatedInitiative {
  id: string
  name: string
  reason: string
}

type PageStatus = 'loading' | 'ready' | 'expired' | 'submitted' | 'error'

export default function CheckInPage({ params }: { params: Promise<{ token: string }> }) {
  const resolvedParams = use(params)
  const { token } = resolvedParams

  const [status, setStatus] = useState<PageStatus>('loading')
  const [error, setError] = useState<string | null>(null)
  const [campaign, setCampaign] = useState<CampaignInfo | null>(null)
  const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null)
  const [template, setTemplate] = useState<CheckInTemplate | null>(null)
  const [responses, setResponses] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [relatedInitiatives, setRelatedInitiatives] = useState<RelatedInitiative[]>([])

  // Fetch check-in data on mount
  useEffect(() => {
    async function fetchCheckInData() {
      try {
        const response = await fetch(`/api/public/check-in?token=${token}`)
        const data = await response.json()

        if (!response.ok) {
          if (response.status === 410) {
            setStatus('expired')
            setError(data.error)
          } else {
            setError(data.error || 'Failed to load check-in')
            setStatus('error')
          }
          return
        }

        setCampaign(data.campaign)
        setTokenInfo(data.token)

        const checkInTemplate = getCheckInTemplate(data.campaign.initiativeStatus || undefined)
        setTemplate(checkInTemplate)

        // Initialize responses with empty strings
        const initialResponses: Record<string, string> = {}
        checkInTemplate.questions.forEach(q => {
          initialResponses[q.id] = ''
        })
        setResponses(initialResponses)

        setStatus('ready')
      } catch {
        setError('Failed to load check-in')
        setStatus('error')
      }
    }

    fetchCheckInData()
  }, [token])

  const handleSubmit = async () => {
    if (!template) return

    // Validate required fields
    const missingRequired = template.questions
      .filter(q => q.required && !responses[q.id]?.trim())
      .map(q => q.question)

    if (missingRequired.length > 0) {
      setError('Please fill in all required fields')
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const response = await fetch('/api/public/check-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, responses }),
      })

      if (response.ok) {
        const data = await response.json()
        if (data.relatedInitiatives) {
          setRelatedInitiatives(data.relatedInitiatives)
        }
        setStatus('submitted')
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to submit check-in')
      }
    } catch {
      setError('Failed to submit check-in')
    } finally {
      setSubmitting(false)
    }
  }

  // Loading state
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <CircleNotch className="w-8 h-8 animate-spin text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Loading check-in...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (status === 'error') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md">
          <Warning className="w-10 h-10 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-semibold mb-2">Unable to Load Check-in</h1>
          <p className="text-muted-foreground">{error || 'Something went wrong. Please try again later.'}</p>
        </div>
      </div>
    )
  }

  // Expired state
  if (status === 'expired') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md">
          <Warning className="w-10 h-10 text-amber-500 mx-auto mb-4" />
          <h1 className="text-xl font-semibold mb-2">Check-in Unavailable</h1>
          <p className="text-muted-foreground">{error || 'This check-in link has expired or has already been submitted.'}</p>
        </div>
      </div>
    )
  }

  // Submitted state
  if (status === 'submitted') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6">
            <Check className="w-8 h-8 text-emerald-600" weight="bold" />
          </div>
          <h1 className="text-2xl font-bold font-serif mb-2">Thank you for your check-in!</h1>
          <p className="text-muted-foreground">
            Your update for <span className="font-medium text-foreground">{campaign?.name}</span> has been recorded.
          </p>

          {relatedInitiatives.length > 0 && (
            <div className="mt-8 text-left">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 text-center">
                You might want to connect with...
              </h3>
              <div className="space-y-2">
                {relatedInitiatives.map(ri => (
                  <a
                    key={ri.id}
                    href={`/campaigns/${ri.id}`}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-secondary/50 transition-colors"
                  >
                    <div>
                      <p className="text-sm font-medium">{ri.name}</p>
                      <p className="text-xs text-muted-foreground">{ri.reason}</p>
                    </div>
                    <ArrowSquareOut className="w-4 h-4 text-muted-foreground flex-shrink-0" weight="bold" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Ready state - render form
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-8 md:px-6 md:py-12">
        {/* Header */}
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
            Check-in
          </p>
          <h1 className="text-3xl font-bold font-serif mb-2">{campaign?.name}</h1>
          {tokenInfo?.name && (
            <p className="text-muted-foreground">
              Welcome, {tokenInfo.name}
            </p>
          )}
        </div>

        {/* Template info */}
        {template && (
          <div className="border rounded-lg bg-card p-5 mb-8">
            <h2 className="text-lg font-semibold mb-1">{template.label}</h2>
            <p className="text-sm text-muted-foreground">{template.description}</p>
          </div>
        )}

        {/* Error banner */}
        {error && (
          <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">
            {error}
          </div>
        )}

        {/* Questions */}
        {template && (
          <div className="space-y-6">
            {template.questions.map(question => (
              <div key={question.id} className="space-y-2">
                <label className="block text-sm font-medium">
                  {question.question}
                  {question.required && <span className="text-red-500 ml-1">*</span>}
                </label>

                {question.type === 'select' && question.options ? (
                  <div className="space-y-2">
                    {question.options.map(option => (
                      <label
                        key={option}
                        className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                          responses[question.id] === option
                            ? 'border-foreground bg-secondary'
                            : 'hover:bg-secondary/50'
                        }`}
                      >
                        <input
                          type="radio"
                          name={question.id}
                          value={option}
                          checked={responses[question.id] === option}
                          onChange={() => setResponses(prev => ({ ...prev, [question.id]: option }))}
                          className="sr-only"
                        />
                        <div
                          className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                            responses[question.id] === option
                              ? 'border-foreground'
                              : 'border-muted-foreground/30'
                          }`}
                        >
                          {responses[question.id] === option && (
                            <div className="w-2 h-2 rounded-full bg-foreground" />
                          )}
                        </div>
                        <span className="text-sm">{option}</span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <textarea
                    value={responses[question.id] || ''}
                    onChange={e => setResponses(prev => ({ ...prev, [question.id]: e.target.value }))}
                    placeholder="Type your response..."
                    rows={3}
                    className="w-full px-4 py-3 border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20 resize-none"
                  />
                )}
              </div>
            ))}

            {/* Submit button */}
            <div className="pt-4">
              <Button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full"
              >
                {submitting ? (
                  <>
                    <CircleNotch className="w-4 h-4 animate-spin mr-2" />
                    Submitting...
                  </>
                ) : (
                  'Submit Check-in'
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
