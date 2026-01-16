'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  FileText,
  Plus,
  CircleNotch,
  ChartLineUp,
  MagnifyingGlass,
  NotePencil,
  BookOpen,
  Sliders,
} from 'phosphor-react'
import { useToast } from '@/components/ui/toast'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/ui/page-header'
import { EmptyState } from '@/components/ui/empty-state'
import { LoadingState } from '@/components/ui/loading-state'
import { StatusBadge } from '@/components/ui/status-badge'
import { containers } from '@/lib/design-system'
import { useReports, type Report } from '@/lib/hooks/use-reports'
import { GenerateReportDialog } from '@/components/reports/generate-report-dialog'
import { ScheduleManager } from '@/components/reports/schedule-manager'
import { cn } from '@/lib/utils'

const templateIcons: Record<string, React.ComponentType<{ className?: string; weight?: 'bold' | 'regular' }>> = {
  progress_summary: ChartLineUp,
  knowledge_gap: MagnifyingGlass,
  session_summary: NotePencil,
  expert_brief: BookOpen,
}

export default function ReportsPage() {
  const router = useRouter()
  const { showToast } = useToast()
  const { reports, isLoading, refresh } = useReports()

  const [generateDialogOpen, setGenerateDialogOpen] = useState(false)
  const [scheduleManagerOpen, setScheduleManagerOpen] = useState(false)

  // Poll for generating reports
  useEffect(() => {
    const generatingReports = reports.filter(
      r => r.status === 'generating' || r.status === 'pending'
    )

    if (generatingReports.length > 0) {
      const interval = setInterval(() => {
        refresh()
      }, 5000)
      return () => clearInterval(interval)
    }
  }, [reports, refresh])

  const handleViewReport = useCallback((report: Report) => {
    router.push(`/reports/${report.id}`)
  }, [router])

  const handleReportGenerated = useCallback(async () => {
    showToast('Report generation started', 'success')
    // Refresh the list to show the new report
    await refresh()
  }, [showToast, refresh])

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Date unknown'
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  return (
    <div className={containers.pageContainer}>
      <div className={containers.wideContainer}>
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-8">
          <PageHeader
            title="Reports"
            subtitle="Generate and manage text-based reports from your knowledge capture campaigns"
          />
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setScheduleManagerOpen(true)}>
              <Sliders className="w-4 h-4 mr-2" weight="bold" />
              Schedules
            </Button>
            <Button onClick={() => setGenerateDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" weight="bold" />
              Generate Report
            </Button>
          </div>
        </div>

        {/* Reports List */}
        {isLoading ? (
          <LoadingState />
        ) : reports.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No reports yet"
            description="Generate your first report to get started. Reports provide summaries, gap analyses, and comprehensive knowledge briefs."
            action={
              <Button onClick={() => setGenerateDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" weight="bold" />
                Generate Your First Report
              </Button>
            }
          />
        ) : (
          <div className="border rounded-lg divide-y bg-card overflow-hidden">
            {reports.map(report => {
              const Icon = templateIcons[report.templateType || report.type] || FileText
              const isGenerating = report.status === 'generating' || report.status === 'pending'

              return (
                <div
                  key={report.id}
                  className={cn(
                    'flex items-center gap-4 p-4 transition-colors',
                    isGenerating ? 'opacity-75' : 'hover:bg-secondary/50 cursor-pointer'
                  )}
                  onClick={() => !isGenerating && handleViewReport(report)}
                >
                  <div className="w-10 h-10 rounded-md bg-secondary flex items-center justify-center flex-shrink-0">
                    {isGenerating ? (
                      <CircleNotch className="w-5 h-5 text-primary animate-spin" weight="bold" />
                    ) : (
                      <Icon className="w-5 h-5 text-muted-foreground" weight="bold" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{report.title}</p>
                    <div className="flex items-center gap-2 mt-0.5 text-sm text-muted-foreground">
                      {report.campaignName && (
                        <>
                          <span>{report.campaignName}</span>
                          <span className="text-border">|</span>
                        </>
                      )}
                      <span className="capitalize">
                        {report.templateType?.replace(/_/g, ' ') || report.type}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-sm text-muted-foreground">
                      {formatDate(report.generatedAt || report.createdAt)}
                    </div>
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
                    {!isGenerating && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleViewReport(report)
                        }}
                      >
                        View
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Dialogs */}
      <GenerateReportDialog
        isOpen={generateDialogOpen}
        onClose={() => setGenerateDialogOpen(false)}
        onReportGenerated={handleReportGenerated}
      />

      <ScheduleManager
        isOpen={scheduleManagerOpen}
        onClose={() => setScheduleManagerOpen(false)}
      />
    </div>
  )
}
