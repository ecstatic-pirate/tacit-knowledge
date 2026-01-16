'use client'

import { useState, useCallback } from 'react'

export interface GenerateReportInput {
  templateType: string
  campaignId?: string
  sessionId?: string
  timePeriod?: string
}

export interface GenerateReportResult {
  success: boolean
  reportId?: string
  title?: string
  preview?: string
  generationDurationMs?: number
  error?: string
}

export interface UseGenerateReportReturn {
  generate: (input: GenerateReportInput) => Promise<GenerateReportResult>
  isGenerating: boolean
  error: string | null
  reset: () => void
}

export function useGenerateReport(): UseGenerateReportReturn {
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generate = useCallback(async (input: GenerateReportInput): Promise<GenerateReportResult> => {
    setIsGenerating(true)
    setError(null)

    try {
      const response = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateType: input.templateType,
          campaignId: input.campaignId,
          sessionId: input.sessionId,
          timePeriod: input.timePeriod,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        const errorMessage = data.error || 'Failed to generate report'
        setError(errorMessage)
        return {
          success: false,
          error: errorMessage,
        }
      }

      return {
        success: true,
        reportId: data.reportId,
        title: data.title,
        preview: data.preview,
        generationDurationMs: data.generationDurationMs,
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate report'
      setError(errorMessage)
      return {
        success: false,
        error: errorMessage,
      }
    } finally {
      setIsGenerating(false)
    }
  }, [])

  const reset = useCallback(() => {
    setIsGenerating(false)
    setError(null)
  }, [])

  return {
    generate,
    isGenerating,
    error,
    reset,
  }
}
