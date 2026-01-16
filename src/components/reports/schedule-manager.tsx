'use client'

import { useState } from 'react'
import {
  CalendarBlank,
  Clock,
  Plus,
  Trash,
  ToggleLeft,
  ToggleRight,
  CircleNotch,
  Bell,
} from 'phosphor-react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { useReportSchedules, type ReportSchedule, type CreateScheduleInput } from '@/lib/hooks/use-report-schedules'
import { useReportTemplates } from '@/lib/hooks/use-report-templates'
import { useApp } from '@/context/app-context'
import { cn } from '@/lib/utils'

interface ScheduleManagerProps {
  isOpen: boolean
  onClose: () => void
  campaignId?: string
}

const frequencyLabels: Record<string, string> = {
  weekly: 'Every Friday',
  biweekly: 'Every other Friday',
  monthly: 'First of the month',
  daily: 'Daily',
}

const eventLabels: Record<string, string> = {
  session_completed: 'After each session',
  campaign_completed: 'When campaign completes',
}

export function ScheduleManager({ isOpen, onClose, campaignId }: ScheduleManagerProps) {
  const { campaigns } = useApp()
  const { templates } = useReportTemplates()
  const { schedules, isLoading, createSchedule, deleteSchedule, toggleSchedule } = useReportSchedules({
    campaignId,
  })

  const [showCreateForm, setShowCreateForm] = useState(false)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [formData, setFormData] = useState<{
    templateType: string
    name: string
    triggerType: 'cron' | 'event'
    cronExpression: string
    eventTrigger: string
    selectedCampaign: string
  }>({
    templateType: '',
    name: '',
    triggerType: 'cron',
    cronExpression: 'weekly',
    eventTrigger: 'session_completed',
    selectedCampaign: campaignId || '',
  })

  const handleCreate = async () => {
    if (!formData.templateType || !formData.name) {
      setError('Please fill in all required fields')
      return
    }

    setCreating(true)
    setError(null)

    try {
      const input: CreateScheduleInput = {
        templateType: formData.templateType,
        name: formData.name,
        triggerType: formData.triggerType,
        cronExpression: formData.triggerType === 'cron' ? formData.cronExpression : undefined,
        eventTrigger: formData.triggerType === 'event' ? formData.eventTrigger as 'session_completed' | 'campaign_completed' : undefined,
        campaignId: formData.selectedCampaign || campaignId,
        enabled: true,
        recipients: [],
      }

      await createSchedule(input)
      setShowCreateForm(false)
      setFormData({
        templateType: '',
        name: '',
        triggerType: 'cron',
        cronExpression: 'weekly',
        eventTrigger: 'session_completed',
        selectedCampaign: campaignId || '',
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create schedule')
    } finally {
      setCreating(false)
    }
  }

  const handleToggle = async (schedule: ReportSchedule) => {
    try {
      await toggleSchedule(schedule.id, !schedule.enabled)
    } catch (err) {
      console.error('Failed to toggle schedule:', err)
    }
  }

  const handleDelete = async (scheduleId: string) => {
    if (!confirm('Are you sure you want to delete this schedule?')) return

    try {
      await deleteSchedule(scheduleId)
    } catch (err) {
      console.error('Failed to delete schedule:', err)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Automated Reporting">
      <div className="space-y-6">
        <p className="text-sm text-muted-foreground">
          Set up automatic reports to be generated and shared with stakeholders.
        </p>

        {/* Existing Schedules */}
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <CircleNotch className="w-5 h-5 animate-spin text-muted-foreground" weight="bold" />
          </div>
        ) : schedules.length > 0 ? (
          <div className="space-y-3">
            {schedules.map(schedule => (
              <div
                key={schedule.id}
                className={cn(
                  'flex items-center gap-4 p-4 rounded-lg border',
                  schedule.enabled ? 'bg-card' : 'bg-muted/50 opacity-60'
                )}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm truncate">{schedule.name}</span>
                    {schedule.campaignName && (
                      <span className="text-xs text-muted-foreground">
                        ({schedule.campaignName})
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                    {schedule.triggerType === 'cron' ? (
                      <>
                        <Clock className="w-3 h-3" weight="bold" />
                        <span>{frequencyLabels[schedule.cronExpression || 'weekly'] || schedule.cronExpression}</span>
                      </>
                    ) : (
                      <>
                        <Bell className="w-3 h-3" weight="bold" />
                        <span>{eventLabels[schedule.eventTrigger || ''] || 'Event-based'}</span>
                      </>
                    )}
                    {schedule.runCount > 0 && (
                      <>
                        <span className="text-border">|</span>
                        <span>{schedule.runCount} runs</span>
                      </>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleToggle(schedule)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  {schedule.enabled ? (
                    <ToggleRight className="w-6 h-6 text-primary" weight="fill" />
                  ) : (
                    <ToggleLeft className="w-6 h-6" weight="bold" />
                  )}
                </button>
                <button
                  onClick={() => handleDelete(schedule.id)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash className="w-4 h-4" weight="bold" />
                </button>
              </div>
            ))}
          </div>
        ) : !showCreateForm ? (
          <div className="text-center py-8">
            <CalendarBlank className="w-10 h-10 text-muted-foreground mx-auto mb-3" weight="bold" />
            <p className="text-sm text-muted-foreground">No automated reports configured yet.</p>
          </div>
        ) : null}

        {/* Create Form */}
        {showCreateForm ? (
          <div className="space-y-4 p-4 rounded-lg border bg-secondary/20">
            <h3 className="font-medium text-sm">New Schedule</h3>

            {/* Name */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Weekly Progress Summary"
                className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>

            {/* Report Type */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Report Type</label>
              <select
                value={formData.templateType}
                onChange={e => setFormData(prev => ({ ...prev, templateType: e.target.value }))}
                className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="">Select a report type...</option>
                {templates.map(t => (
                  <option key={t.type} value={t.type}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Campaign (if not preselected) */}
            {!campaignId && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Campaign (optional)</label>
                <select
                  value={formData.selectedCampaign}
                  onChange={e => setFormData(prev => ({ ...prev, selectedCampaign: e.target.value }))}
                  className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="">All campaigns</option>
                  {campaigns.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Trigger Type */}
            <div className="space-y-2">
              <label className="text-sm font-medium">When to generate</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, triggerType: 'cron' }))}
                  className={cn(
                    'flex-1 py-2 px-3 rounded-md border text-sm transition-colors',
                    formData.triggerType === 'cron'
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:bg-secondary/50'
                  )}
                >
                  On a schedule
                </button>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, triggerType: 'event' }))}
                  className={cn(
                    'flex-1 py-2 px-3 rounded-md border text-sm transition-colors',
                    formData.triggerType === 'event'
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:bg-secondary/50'
                  )}
                >
                  After an event
                </button>
              </div>
            </div>

            {/* Cron/Event specific fields */}
            {formData.triggerType === 'cron' ? (
              <div className="space-y-2">
                <label className="text-sm font-medium">Frequency</label>
                <select
                  value={formData.cronExpression}
                  onChange={e => setFormData(prev => ({ ...prev, cronExpression: e.target.value }))}
                  className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="weekly">Weekly (every Friday)</option>
                  <option value="biweekly">Bi-weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="daily">Daily</option>
                </select>
              </div>
            ) : (
              <div className="space-y-2">
                <label className="text-sm font-medium">Trigger event</label>
                <select
                  value={formData.eventTrigger}
                  onChange={e => setFormData(prev => ({ ...prev, eventTrigger: e.target.value }))}
                  className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="session_completed">After each session completes</option>
                  <option value="campaign_completed">When campaign completes</option>
                </select>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                {error}
              </div>
            )}

            {/* Form actions */}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setShowCreateForm(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleCreate} disabled={creating}>
                {creating ? (
                  <CircleNotch className="w-4 h-4 mr-2 animate-spin" weight="bold" />
                ) : null}
                Create Schedule
              </Button>
            </div>
          </div>
        ) : (
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setShowCreateForm(true)}
          >
            <Plus className="w-4 h-4 mr-2" weight="bold" />
            Add Schedule
          </Button>
        )}

        {/* Close button */}
        <div className="flex justify-end pt-2 border-t">
          <Button onClick={onClose}>Done</Button>
        </div>
      </div>
    </Modal>
  )
}
