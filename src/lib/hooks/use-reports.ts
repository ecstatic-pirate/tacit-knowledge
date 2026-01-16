'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'

export type ReportStatus = 'pending' | 'generating' | 'completed' | 'failed'

export interface Report {
  id: string
  title: string
  type: string
  templateType: string | null
  status: ReportStatus
  preview: string | null
  contentMarkdown: string | null
  contentHtml: string | null
  fileUrl: string | null
  campaignId: string | null
  sessionId: string | null
  generatedAt: string | null
  generationDurationMs: number | null
  generationError: string | null
  createdAt: string | null
  metadata: Record<string, unknown> | null
  // Joined data
  campaignName?: string
  sessionNumber?: number
}

export interface UseReportsOptions {
  campaignId?: string
  limit?: number
}

export interface UseReportsReturn {
  reports: Report[]
  isLoading: boolean
  error: string | null
  refresh: () => Promise<void>
  getReport: (reportId: string) => Promise<Report | null>
  deleteReport: (reportId: string) => Promise<void>
}

export function useReports(options: UseReportsOptions = {}): UseReportsReturn {
  const { campaignId, limit = 50 } = options
  const [reports, setReports] = useState<Report[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = useMemo(() => createClient(), [])

  const fetchReports = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Note: Using 'as any' because reports table has new columns not yet in generated types
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let query = (supabase as any)
        .from('reports')
        .select(`
          id,
          title,
          type,
          template_type,
          status,
          preview,
          content_markdown,
          content_html,
          file_url,
          campaign_id,
          session_id,
          generated_at,
          generation_duration_ms,
          generation_error,
          created_at,
          metadata,
          campaigns (expert_name),
          sessions (session_number)
        `)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (campaignId) {
        query = query.eq('campaign_id', campaignId)
      }

      const { data, error: fetchError } = await query

      if (fetchError) {
        throw fetchError
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mappedReports: Report[] = ((data || []) as any[]).map(r => {
        const campaign = r.campaigns as { expert_name: string } | null
        const session = r.sessions as { session_number: number } | null

        return {
          id: r.id,
          title: r.title,
          type: r.type,
          templateType: r.template_type,
          status: (r.status || 'completed') as ReportStatus,
          preview: r.preview,
          contentMarkdown: r.content_markdown,
          contentHtml: r.content_html,
          fileUrl: r.file_url,
          campaignId: r.campaign_id,
          sessionId: r.session_id,
          generatedAt: r.generated_at,
          generationDurationMs: r.generation_duration_ms,
          generationError: r.generation_error,
          createdAt: r.created_at,
          metadata: r.metadata as Record<string, unknown> | null,
          campaignName: campaign?.expert_name,
          sessionNumber: session?.session_number,
        }
      })

      setReports(mappedReports)
    } catch (err) {
      console.error('Error fetching reports:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch reports')
    } finally {
      setIsLoading(false)
    }
  }, [supabase, campaignId, limit])

  const getReport = useCallback(async (reportId: string): Promise<Report | null> => {
    try {
      // Note: Using 'as any' because reports table has new columns not yet in generated types
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error: fetchError } = await (supabase as any)
        .from('reports')
        .select(`
          id,
          title,
          type,
          template_type,
          status,
          preview,
          content_markdown,
          content_html,
          file_url,
          campaign_id,
          session_id,
          generated_at,
          generation_duration_ms,
          generation_error,
          created_at,
          metadata,
          campaigns (expert_name),
          sessions (session_number)
        `)
        .eq('id', reportId)
        .is('deleted_at', null)
        .single()

      if (fetchError) {
        throw fetchError
      }

      if (!data) return null

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const reportData = data as any
      const campaign = reportData.campaigns as { expert_name: string } | null
      const session = reportData.sessions as { session_number: number } | null

      return {
        id: reportData.id,
        title: reportData.title,
        type: reportData.type,
        templateType: reportData.template_type,
        status: (reportData.status || 'completed') as ReportStatus,
        preview: reportData.preview,
        contentMarkdown: reportData.content_markdown,
        contentHtml: reportData.content_html,
        fileUrl: reportData.file_url,
        campaignId: reportData.campaign_id,
        sessionId: reportData.session_id,
        generatedAt: reportData.generated_at,
        generationDurationMs: reportData.generation_duration_ms,
        generationError: reportData.generation_error,
        createdAt: reportData.created_at,
        metadata: reportData.metadata as Record<string, unknown> | null,
        campaignName: campaign?.expert_name,
        sessionNumber: session?.session_number,
      }
    } catch (err) {
      console.error('Error fetching report:', err)
      return null
    }
  }, [supabase])

  const deleteReport = useCallback(async (reportId: string): Promise<void> => {
    // Optimistic update
    setReports(prev => prev.filter(r => r.id !== reportId))

    const { error: deleteError } = await supabase
      .from('reports')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', reportId)

    if (deleteError) {
      console.error('Error deleting report:', deleteError)
      // Revert on error
      await fetchReports()
      throw deleteError
    }
  }, [supabase, fetchReports])

  useEffect(() => {
    fetchReports()
  }, [fetchReports])

  return {
    reports,
    isLoading,
    error,
    refresh: fetchReports,
    getReport,
    deleteReport,
  }
}
