'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'

export type TriggerType = 'cron' | 'event' | 'manual'
export type EventTrigger = 'session_completed' | 'campaign_completed'

export interface ReportRecipient {
  email: string
  name: string
  deliveryMethod: 'email' | 'in_app'
}

export interface ReportSchedule {
  id: string
  campaignId: string | null
  templateType: string
  name: string
  triggerType: TriggerType
  cronExpression: string | null
  eventTrigger: EventTrigger | null
  enabled: boolean
  recipients: ReportRecipient[]
  nextRunAt: string | null
  lastRunAt: string | null
  runCount: number
  createdAt: string
  updatedAt: string
  // Joined data
  campaignName?: string
}

export interface CreateScheduleInput {
  campaignId?: string
  templateType: string
  name: string
  triggerType: TriggerType
  cronExpression?: string
  eventTrigger?: EventTrigger
  enabled?: boolean
  recipients?: ReportRecipient[]
}

export interface UpdateScheduleInput {
  name?: string
  triggerType?: TriggerType
  cronExpression?: string
  eventTrigger?: EventTrigger
  enabled?: boolean
  recipients?: ReportRecipient[]
}

export interface UseReportSchedulesOptions {
  campaignId?: string
}

export interface UseReportSchedulesReturn {
  schedules: ReportSchedule[]
  isLoading: boolean
  error: string | null
  refresh: () => Promise<void>
  createSchedule: (input: CreateScheduleInput) => Promise<ReportSchedule>
  updateSchedule: (id: string, input: UpdateScheduleInput) => Promise<ReportSchedule>
  deleteSchedule: (id: string) => Promise<void>
  toggleSchedule: (id: string, enabled: boolean) => Promise<void>
}

export function useReportSchedules(options: UseReportSchedulesOptions = {}): UseReportSchedulesReturn {
  const { campaignId } = options
  const [schedules, setSchedules] = useState<ReportSchedule[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = useMemo(() => createClient(), [])

  const fetchSchedules = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Note: Using 'as any' because report_schedules table types not yet generated
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let query = (supabase as any)
        .from('report_schedules')
        .select(`
          id,
          campaign_id,
          template_type,
          name,
          trigger_type,
          cron_expression,
          event_trigger,
          enabled,
          recipients,
          next_run_at,
          last_run_at,
          run_count,
          created_at,
          updated_at,
          campaigns (expert_name)
        `)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })

      if (campaignId) {
        query = query.eq('campaign_id', campaignId)
      }

      const { data, error: fetchError } = await query

      if (fetchError) {
        throw fetchError
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mappedSchedules: ReportSchedule[] = ((data || []) as any[]).map(s => {
        const campaign = s.campaigns as { expert_name: string } | null

        return {
          id: s.id,
          campaignId: s.campaign_id,
          templateType: s.template_type,
          name: s.name,
          triggerType: s.trigger_type as TriggerType,
          cronExpression: s.cron_expression,
          eventTrigger: s.event_trigger as EventTrigger | null,
          enabled: s.enabled,
          recipients: (s.recipients || []) as ReportRecipient[],
          nextRunAt: s.next_run_at,
          lastRunAt: s.last_run_at,
          runCount: s.run_count || 0,
          createdAt: s.created_at,
          updatedAt: s.updated_at,
          campaignName: campaign?.expert_name,
        }
      })

      setSchedules(mappedSchedules)
    } catch (err) {
      console.error('Error fetching schedules:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch schedules')
    } finally {
      setIsLoading(false)
    }
  }, [supabase, campaignId])

  const createSchedule = useCallback(async (input: CreateScheduleInput): Promise<ReportSchedule> => {
    const response = await fetch('/api/reports/schedules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        campaignId: input.campaignId,
        templateType: input.templateType,
        name: input.name,
        triggerType: input.triggerType,
        cronExpression: input.cronExpression,
        eventTrigger: input.eventTrigger,
        enabled: input.enabled ?? true,
        recipients: input.recipients ?? [],
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
      throw new Error(errorData.error || 'Failed to create schedule')
    }

    const { schedule } = await response.json()

    // Refresh list
    await fetchSchedules()

    return {
      id: schedule.id,
      campaignId: schedule.campaign_id,
      templateType: schedule.template_type,
      name: schedule.name,
      triggerType: schedule.trigger_type,
      cronExpression: schedule.cron_expression,
      eventTrigger: schedule.event_trigger,
      enabled: schedule.enabled,
      recipients: schedule.recipients || [],
      nextRunAt: schedule.next_run_at,
      lastRunAt: schedule.last_run_at,
      runCount: schedule.run_count || 0,
      createdAt: schedule.created_at,
      updatedAt: schedule.updated_at,
    }
  }, [fetchSchedules])

  const updateSchedule = useCallback(async (id: string, input: UpdateScheduleInput): Promise<ReportSchedule> => {
    const response = await fetch(`/api/reports/schedules/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: input.name,
        triggerType: input.triggerType,
        cronExpression: input.cronExpression,
        eventTrigger: input.eventTrigger,
        enabled: input.enabled,
        recipients: input.recipients,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
      throw new Error(errorData.error || 'Failed to update schedule')
    }

    const { schedule } = await response.json()

    // Optimistic update
    setSchedules(prev => prev.map(s =>
      s.id === id
        ? {
            ...s,
            name: schedule.name,
            triggerType: schedule.trigger_type,
            cronExpression: schedule.cron_expression,
            eventTrigger: schedule.event_trigger,
            enabled: schedule.enabled,
            recipients: schedule.recipients || [],
            updatedAt: schedule.updated_at,
          }
        : s
    ))

    return {
      id: schedule.id,
      campaignId: schedule.campaign_id,
      templateType: schedule.template_type,
      name: schedule.name,
      triggerType: schedule.trigger_type,
      cronExpression: schedule.cron_expression,
      eventTrigger: schedule.event_trigger,
      enabled: schedule.enabled,
      recipients: schedule.recipients || [],
      nextRunAt: schedule.next_run_at,
      lastRunAt: schedule.last_run_at,
      runCount: schedule.run_count || 0,
      createdAt: schedule.created_at,
      updatedAt: schedule.updated_at,
    }
  }, [])

  const deleteSchedule = useCallback(async (id: string): Promise<void> => {
    // Optimistic update
    setSchedules(prev => prev.filter(s => s.id !== id))

    const response = await fetch(`/api/reports/schedules/${id}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      // Revert on error
      await fetchSchedules()
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
      throw new Error(errorData.error || 'Failed to delete schedule')
    }
  }, [fetchSchedules])

  const toggleSchedule = useCallback(async (id: string, enabled: boolean): Promise<void> => {
    // Optimistic update
    setSchedules(prev => prev.map(s =>
      s.id === id ? { ...s, enabled } : s
    ))

    const response = await fetch(`/api/reports/schedules/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled }),
    })

    if (!response.ok) {
      // Revert on error
      await fetchSchedules()
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
      throw new Error(errorData.error || 'Failed to toggle schedule')
    }
  }, [fetchSchedules])

  useEffect(() => {
    fetchSchedules()
  }, [fetchSchedules])

  return {
    schedules,
    isLoading,
    error,
    refresh: fetchSchedules,
    createSchedule,
    updateSchedule,
    deleteSchedule,
    toggleSchedule,
  }
}
