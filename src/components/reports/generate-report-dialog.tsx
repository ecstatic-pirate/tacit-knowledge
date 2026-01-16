'use client'

import { useState, useMemo } from 'react'
import {
  FileText,
  CircleNotch,
  ChartLineUp,
  MagnifyingGlass,
  NotePencil,
  BookOpen,
} from 'phosphor-react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { useReportTemplates } from '@/lib/hooks/use-report-templates'
import { useGenerateReport } from '@/lib/hooks/use-generate-report'
import { useApp } from '@/context/app-context'
import { cn } from '@/lib/utils'

interface GenerateReportDialogProps {
  isOpen: boolean
  onClose: () => void
  onReportGenerated: (reportId: string) => void
  preselectedCampaignId?: string
  preselectedSessionId?: string
}

const templateIcons: Record<string, React.ComponentType<{ className?: string; weight?: 'bold' | 'regular' }>> = {
  progress_summary: ChartLineUp,
  knowledge_gap: MagnifyingGlass,
  session_summary: NotePencil,
  expert_brief: BookOpen,
}

export function GenerateReportDialog({
  isOpen,
  onClose,
  onReportGenerated,
  preselectedCampaignId,
  preselectedSessionId,
}: GenerateReportDialogProps) {
  const { campaigns } = useApp()
  const { templates, isLoading: templatesLoading } = useReportTemplates()
  const { generate, isGenerating } = useGenerateReport()

  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [selectedCampaign, setSelectedCampaign] = useState<string | null>(
    preselectedCampaignId || null
  )
  const [error, setError] = useState<string | null>(null)

  // Get the selected template object
  const template = useMemo(
    () => templates.find(t => t.type === selectedTemplate),
    [templates, selectedTemplate]
  )

  // Filter templates based on whether session is preselected
  const availableTemplates = useMemo(() => {
    if (preselectedSessionId) {
      return templates
    }
    return templates.filter(t => !t.requiresSession)
  }, [templates, preselectedSessionId])

  const handleGenerate = async () => {
    if (!selectedTemplate) {
      setError('Please select a report type')
      return
    }

    if (template?.requiresCampaign && !selectedCampaign && !preselectedCampaignId) {
      setError('Please select a campaign')
      return
    }

    setError(null)

    const result = await generate({
      templateType: selectedTemplate,
      campaignId: selectedCampaign || preselectedCampaignId,
      sessionId: preselectedSessionId,
    })

    if (result.success && result.reportId) {
      onReportGenerated(result.reportId)
      handleClose()
    } else {
      setError(result.error || 'Failed to generate report')
    }
  }

  const handleClose = () => {
    setSelectedTemplate(null)
    setSelectedCampaign(preselectedCampaignId || null)
    setError(null)
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Generate Report">
      <div className="space-y-6">
        {/* Report Type Selection */}
        <div className="space-y-3">
          <label className="text-sm font-medium">Report Type</label>
          {templatesLoading ? (
            <div className="flex items-center justify-center py-8">
              <CircleNotch className="w-5 h-5 animate-spin text-muted-foreground" weight="bold" />
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {availableTemplates.map(t => {
                const Icon = templateIcons[t.type] || FileText
                const isSelected = selectedTemplate === t.type

                return (
                  <button
                    key={t.type}
                    type="button"
                    onClick={() => setSelectedTemplate(t.type)}
                    className={cn(
                      'flex flex-col items-start gap-2 p-4 rounded-lg border text-left transition-colors',
                      isSelected
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-foreground/20 hover:bg-secondary/50'
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="w-5 h-5 text-muted-foreground" weight="bold" />
                      <span className="font-medium text-sm">{t.name}</span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {t.description}
                    </p>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Campaign Selection (if required and not preselected) */}
        {template?.requiresCampaign && !preselectedCampaignId && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Campaign</label>
            <select
              value={selectedCampaign || ''}
              onChange={e => setSelectedCampaign(e.target.value || null)}
              className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="">Select a campaign...</option>
              {campaigns.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.role})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Preview info */}
        {preselectedCampaignId && (
          <div className="p-3 rounded-lg bg-secondary/50 text-sm">
            <span className="text-muted-foreground">Campaign: </span>
            <span className="font-medium">
              {campaigns.find(c => c.id === preselectedCampaignId)?.name || 'Selected campaign'}
            </span>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={handleClose} disabled={isGenerating}>
            Cancel
          </Button>
          <Button onClick={handleGenerate} disabled={!selectedTemplate || isGenerating}>
            {isGenerating ? (
              <>
                <CircleNotch className="w-4 h-4 mr-2 animate-spin" weight="bold" />
                Generating...
              </>
            ) : (
              <>
                <FileText className="w-4 h-4 mr-2" weight="bold" />
                Generate Report
              </>
            )}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
