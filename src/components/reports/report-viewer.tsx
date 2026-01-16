'use client'

import { useState } from 'react'
import {
  CalendarCheck,
  Clock,
  Download,
  User,
  CircleNotch,
  FileText,
  Warning,
} from 'phosphor-react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/ui/status-badge'
import type { Report } from '@/lib/hooks/use-reports'
import { cn } from '@/lib/utils'

interface ReportViewerProps {
  report: Report | null
  isOpen: boolean
  onClose: () => void
}

export function ReportViewer({ report, isOpen, onClose }: ReportViewerProps) {
  const [isDownloading, setIsDownloading] = useState(false)

  if (!report) return null

  const formattedDate = report.generatedAt
    ? new Date(report.generatedAt).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : report.createdAt
    ? new Date(report.createdAt).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Date unknown'

  const formattedDuration = report.generationDurationMs
    ? `${(report.generationDurationMs / 1000).toFixed(1)}s`
    : null

  const handleDownload = async () => {
    if (!report.contentMarkdown) return

    setIsDownloading(true)
    try {
      // Create a blob with the markdown content
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

  const isLoading = report.status === 'generating' || report.status === 'pending'
  const isFailed = report.status === 'failed'

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={report.title}>
      <div className="space-y-6">
        {/* Header info */}
        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground pb-4 border-b">
          <div className="flex items-center gap-1">
            <CalendarCheck className="w-4 h-4" weight="bold" />
            <span>{formattedDate}</span>
          </div>
          <div className="w-1 h-1 rounded-full bg-border" />
          <div className="flex items-center gap-1">
            <FileText className="w-4 h-4" weight="bold" />
            <span className="capitalize">{report.type?.replace(/_/g, ' ') || 'Report'}</span>
          </div>
          {report.campaignName && (
            <>
              <div className="w-1 h-1 rounded-full bg-border" />
              <div className="flex items-center gap-1">
                <User className="w-4 h-4" weight="bold" />
                <span>{report.campaignName}</span>
              </div>
            </>
          )}
          {formattedDuration && (
            <>
              <div className="w-1 h-1 rounded-full bg-border" />
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" weight="bold" />
                <span>Generated in {formattedDuration}</span>
              </div>
            </>
          )}
          <div className="ml-auto">
            <StatusBadge
              variant={
                report.status === 'completed'
                  ? 'success'
                  : report.status === 'generating' || report.status === 'pending'
                  ? 'warning'
                  : 'error'
              }
            >
              {report.status === 'completed'
                ? 'Ready'
                : report.status === 'generating'
                ? 'Generating'
                : report.status === 'pending'
                ? 'Pending'
                : 'Failed'}
            </StatusBadge>
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <CircleNotch className="w-8 h-8 animate-spin text-primary mb-4" weight="bold" />
            <p className="text-sm font-medium">Generating your report...</p>
            <p className="text-xs text-muted-foreground mt-1">
              This may take a minute
            </p>
          </div>
        ) : isFailed ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Warning className="w-8 h-8 text-destructive mb-4" weight="bold" />
            <p className="text-sm font-medium">Report generation failed</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-md">
              {report.generationError || 'An unknown error occurred'}
            </p>
          </div>
        ) : report.contentHtml ? (
          <div
            className={cn(
              'prose prose-stone dark:prose-invert max-w-none',
              'prose-headings:font-semibold prose-headings:tracking-tight',
              'prose-h1:text-xl prose-h2:text-lg prose-h3:text-base',
              'prose-p:leading-relaxed prose-p:text-sm',
              'prose-li:text-sm',
              'prose-ul:my-2 prose-ol:my-2',
              'max-h-[60vh] overflow-y-auto px-1'
            )}
            dangerouslySetInnerHTML={{ __html: report.contentHtml }}
          />
        ) : report.preview ? (
          <div className="bg-secondary/20 p-6 rounded-lg">
            <h3 className="font-semibold mb-3 text-sm">Summary</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {report.preview}
            </p>
          </div>
        ) : (
          <div className="bg-secondary/20 p-6 rounded-lg border border-dashed text-center py-12">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" weight="bold" />
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              No content available for this report.
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          {report.contentMarkdown && !isLoading && !isFailed && (
            <Button variant="outline" onClick={handleDownload} disabled={isDownloading}>
              {isDownloading ? (
                <CircleNotch className="w-4 h-4 mr-2 animate-spin" weight="bold" />
              ) : (
                <Download className="w-4 h-4 mr-2" weight="bold" />
              )}
              Download
            </Button>
          )}
          <Button onClick={onClose}>Close</Button>
        </div>
      </div>
    </Modal>
  )
}
