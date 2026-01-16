'use client'

import { use, useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Download,
  Printer,
  CircleNotch,
  FileText,
} from 'phosphor-react'
import { createClient } from '@/lib/supabase/client'
import { useApp } from '@/context/app-context'
import { Button } from '@/components/ui/button'
import { LoadingState } from '@/components/ui/loading-state'
import { EmptyState } from '@/components/ui/empty-state'
import { ReportContent } from '@/components/reports/report-content'
import { ShareToggle } from '@/components/reports/share-toggle'
import type { Report } from '@/lib/hooks/use-reports'

export default function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { isLoading: authLoading } = useApp()
  const supabase = useMemo(() => createClient(), [])

  const [report, setReport] = useState<Report | null>(null)
  const [shareToken, setShareToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDownloading, setIsDownloading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch report
  const fetchReport = useCallback(async () => {
    if (authLoading) return

    setIsLoading(true)
    setError(null)

    try {
      // Fetch report with campaign join
      // Note: Using 'as any' because reports has columns not yet in generated types
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: reportData, error: reportError } = await (supabase as any)
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
        .eq('id', id)
        .is('deleted_at', null)
        .single()

      if (reportError) {
        if (reportError.code === 'PGRST116') {
          setError('Report not found')
        } else {
          throw reportError
        }
        return
      }

      // Fetch share token if exists
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: tokenData } = await (supabase as any)
        .from('report_share_tokens')
        .select('token')
        .eq('report_id', id)
        .is('revoked_at', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (tokenData) {
        setShareToken(tokenData.token)
      }

      // Map to Report type
      const campaign = reportData.campaigns as { expert_name: string } | null
      const session = reportData.sessions as { session_number: number } | null

      setReport({
        id: reportData.id,
        title: reportData.title,
        type: reportData.type,
        templateType: reportData.template_type,
        status: reportData.status as Report['status'],
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
        metadata: reportData.metadata,
        campaignName: campaign?.expert_name,
        sessionNumber: session?.session_number,
      })
    } catch (err) {
      console.error('Error fetching report:', err)
      setError('Failed to load report')
    } finally {
      setIsLoading(false)
    }
  }, [id, supabase, authLoading])

  useEffect(() => {
    fetchReport()
  }, [fetchReport])

  // Poll for generating reports
  useEffect(() => {
    if (!report) return
    if (report.status !== 'generating' && report.status !== 'pending') return

    const interval = setInterval(() => {
      fetchReport()
    }, 5000)

    return () => clearInterval(interval)
  }, [report, fetchReport])

  // Download handler
  const handleDownload = async () => {
    if (!report?.contentMarkdown) return

    setIsDownloading(true)
    try {
      const blob = new Blob([report.contentMarkdown], { type: 'text/markdown' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${report.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.md`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } finally {
      setIsDownloading(false)
    }
  }

  // Print handler
  const handlePrint = () => {
    window.print()
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-6 py-12">
          <LoadingState />
        </div>
      </div>
    )
  }

  // Error state
  if (error || !report) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-6 py-12">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/reports')}
            className="mb-8"
          >
            <ArrowLeft className="w-4 h-4 mr-2" weight="bold" />
            Back to Reports
          </Button>
          <EmptyState
            icon={FileText}
            title={error || 'Report not found'}
            description="The report you're looking for doesn't exist or you don't have permission to view it."
            action={
              <Button onClick={() => router.push('/reports')}>
                View All Reports
              </Button>
            }
          />
        </div>
      </div>
    )
  }

  const canDownload = report.status === 'completed' && report.contentMarkdown

  return (
    <div className="min-h-screen bg-background print:bg-white">
      {/* Sticky Header - Hidden when printing */}
      <div className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 print:hidden">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            {/* Back Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/reports')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" weight="bold" />
              Back to Reports
            </Button>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {/* Share */}
              <ShareToggle
                reportId={report.id}
                initialToken={shareToken}
              />

              {/* Print */}
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrint}
              >
                <Printer className="w-4 h-4 mr-2" weight="bold" />
                Print
              </Button>

              {/* Download */}
              {canDownload && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownload}
                  disabled={isDownloading}
                >
                  {isDownloading ? (
                    <CircleNotch className="w-4 h-4 mr-2 animate-spin" weight="bold" />
                  ) : (
                    <Download className="w-4 h-4 mr-2" weight="bold" />
                  )}
                  Download
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-12 print:py-0 print:px-0 print:max-w-none">
        <ReportContent
          report={report}
          variant="full-page"
          showHeader={true}
        />
      </main>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          @page {
            margin: 1in;
          }
        }
      `}</style>
    </div>
  )
}
