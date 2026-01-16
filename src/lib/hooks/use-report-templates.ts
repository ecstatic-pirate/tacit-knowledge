'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface ReportTemplate {
  type: string
  name: string
  description: string
  requiresCampaign: boolean
  requiresSession: boolean
  estimatedTokens: number
}

export interface UseReportTemplatesReturn {
  templates: ReportTemplate[]
  isLoading: boolean
  error: string | null
  refresh: () => Promise<void>
}

export function useReportTemplates(): UseReportTemplatesReturn {
  const [templates, setTemplates] = useState<ReportTemplate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = useMemo(() => createClient(), [])

  const fetchTemplates = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Note: Using 'as any' because report_templates table types not yet generated
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error: fetchError } = await (supabase as any)
        .from('report_templates')
        .select('type, name, description, requires_campaign, requires_session, estimated_tokens')
        .is('deleted_at', null)
        .order('name', { ascending: true })

      if (fetchError) {
        throw fetchError
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mappedTemplates: ReportTemplate[] = ((data || []) as any[]).map(t => ({
        type: t.type,
        name: t.name,
        description: t.description || '',
        requiresCampaign: t.requires_campaign || false,
        requiresSession: t.requires_session || false,
        estimatedTokens: t.estimated_tokens || 2000,
      }))

      setTemplates(mappedTemplates)
    } catch (err) {
      console.error('Error fetching report templates:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch templates')
    } finally {
      setIsLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchTemplates()
  }, [fetchTemplates])

  return {
    templates,
    isLoading,
    error,
    refresh: fetchTemplates,
  }
}
