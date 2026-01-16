'use client'

import ReactMarkdown from 'react-markdown'
import {
  CalendarCheck,
  User,
  FileText,
  CircleNotch,
  Warning,
} from 'phosphor-react'
import type { Report } from '@/lib/hooks/use-reports'
import { cn } from '@/lib/utils'

interface ReportContentProps {
  report: Report
  variant?: 'full-page' | 'embedded'
  showHeader?: boolean
  className?: string
}

export function ReportContent({
  report,
  variant = 'full-page',
  showHeader = true,
  className,
}: ReportContentProps) {
  const isLoading = report.status === 'generating' || report.status === 'pending'
  const isFailed = report.status === 'failed'

  const formattedDate = report.generatedAt
    ? new Date(report.generatedAt).toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : report.createdAt
    ? new Date(report.createdAt).toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Date unknown'

  // Loading state
  if (isLoading) {
    return (
      <div className={cn('flex flex-col items-center justify-center py-24 text-center', className)}>
        <CircleNotch className="w-10 h-10 animate-spin text-primary mb-6" weight="bold" />
        <h2 className="text-xl font-semibold font-serif mb-2">Generating your report...</h2>
        <p className="text-muted-foreground">
          This may take a minute. The page will update automatically.
        </p>
      </div>
    )
  }

  // Failed state
  if (isFailed) {
    return (
      <div className={cn('flex flex-col items-center justify-center py-24 text-center', className)}>
        <Warning className="w-10 h-10 text-destructive mb-6" weight="bold" />
        <h2 className="text-xl font-semibold font-serif mb-2">Report generation failed</h2>
        <p className="text-muted-foreground max-w-md">
          {report.generationError || 'An unknown error occurred while generating this report.'}
        </p>
      </div>
    )
  }

  // No content state
  if (!report.contentMarkdown && !report.contentHtml && !report.preview) {
    return (
      <div className={cn('flex flex-col items-center justify-center py-24 text-center', className)}>
        <FileText className="w-10 h-10 text-muted-foreground/50 mb-6" weight="bold" />
        <h2 className="text-xl font-semibold font-serif mb-2">No content available</h2>
        <p className="text-muted-foreground">
          This report doesn't have any content yet.
        </p>
      </div>
    )
  }

  return (
    <article className={cn('space-y-8', className)}>
      {/* Report Header */}
      {showHeader && (
        <header className="border-b pb-8">
          <h1 className="text-4xl font-bold font-serif tracking-tight mb-4">
            {report.title}
          </h1>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <CalendarCheck className="w-4 h-4" weight="bold" />
              <span>{formattedDate}</span>
            </div>

            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4" weight="bold" />
              <span className="capitalize">{report.templateType?.replace(/_/g, ' ') || report.type?.replace(/_/g, ' ') || 'Report'}</span>
            </div>

            {report.campaignName && (
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" weight="bold" />
                <span>{report.campaignName}</span>
              </div>
            )}
          </div>
        </header>
      )}

      {/* Report Content - Beautiful Typography */}
      <div
        className={cn(
          // Base prose styling
          'prose prose-stone dark:prose-invert max-w-none',

          // Headings - Serif font, proper hierarchy
          'prose-headings:font-serif prose-headings:font-semibold prose-headings:tracking-tight',
          'prose-h1:text-3xl prose-h1:mt-12 prose-h1:mb-6',
          'prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4 prose-h2:border-b prose-h2:pb-2',
          'prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3',
          'prose-h4:text-lg prose-h4:mt-6 prose-h4:mb-2',

          // Paragraphs - Generous line height
          'prose-p:text-base prose-p:leading-[1.8] prose-p:text-foreground/90',
          'prose-p:my-4',

          // Lists
          'prose-li:text-base prose-li:leading-[1.8]',
          'prose-ul:my-4 prose-ol:my-4',
          'prose-li:my-1',

          // Strong/emphasis
          'prose-strong:text-foreground prose-strong:font-semibold',
          'prose-em:text-foreground/80',

          // Blockquotes
          'prose-blockquote:border-l-4 prose-blockquote:border-primary/30',
          'prose-blockquote:pl-6 prose-blockquote:italic',
          'prose-blockquote:text-muted-foreground',

          // Code blocks
          'prose-pre:bg-secondary/50 prose-pre:text-foreground prose-pre:rounded-lg',
          'prose-code:text-foreground prose-code:bg-secondary/50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm',
          'prose-code:before:content-none prose-code:after:content-none',

          // Links
          'prose-a:text-primary prose-a:underline prose-a:underline-offset-2',

          // Tables
          'prose-table:border prose-table:border-border',
          'prose-th:bg-secondary/30 prose-th:px-4 prose-th:py-2',
          'prose-td:px-4 prose-td:py-2 prose-td:border prose-td:border-border',

          // Full page variant gets more generous spacing
          variant === 'full-page' && [
            'prose-lg',
            'prose-p:text-lg prose-p:leading-[1.9]',
            'prose-li:text-lg',
          ]
        )}
      >
        {report.contentMarkdown ? (
          <ReactMarkdown>{report.contentMarkdown}</ReactMarkdown>
        ) : report.contentHtml ? (
          <div dangerouslySetInnerHTML={{ __html: report.contentHtml }} />
        ) : report.preview ? (
          <p className="text-lg leading-relaxed">{report.preview}</p>
        ) : null}
      </div>
    </article>
  )
}
