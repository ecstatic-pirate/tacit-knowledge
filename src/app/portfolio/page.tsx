'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  ChartBar,
  Rocket,
  Warning,
  CheckCircle,
  Wrench,
  Stack,
  ArrowsClockwise,
  Plugs,
  Globe,
  Buildings,
  ClockCounterClockwise,
  FunnelSimple,
} from 'phosphor-react'
import { useApp } from '@/context/app-context'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { PageHeader } from '@/components/ui/page-header'
import { StatusBadge } from '@/components/ui/status-badge'
import { LoadingState } from '@/components/ui/loading-state'
import {
  components,
  containers,
  spacing,
  typography,
  sectionHeader,
} from '@/lib/design-system'
import {
  getMaturityInfo,
  MATURITY_STAGES,
  REGIONS,
  INITIATIVE_TYPES,
  type InitiativeStatus,
  type InitiativeType,
} from '@/lib/initiative-helpers'

interface CheckInActivity {
  id: string
  campaignName: string
  guestName: string
  submittedAt: string
}

interface RecentUpdate {
  id: string
  name: string
  updatedAt: string
}

type ActivityItem = {
  id: string
  label: string
  time: string
  sortTime: number
}

function timeAgo(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diff = now - then
  const minutes = Math.floor(diff / 60000)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

const INITIATIVE_ICONS: Record<string, React.ComponentType<{ className?: string; weight?: 'thin' | 'light' | 'regular' | 'bold' | 'fill' | 'duotone' }>> = {
  tool: Wrench,
  platform: Stack,
  process: ArrowsClockwise,
  integration: Plugs,
}

export default function PortfolioPage() {
  const { campaigns } = useApp()
  const supabase = useMemo(() => createClient(), [])

  const [selectedRegion, setSelectedRegion] = useState<string>('all')
  const [checkIns, setCheckIns] = useState<CheckInActivity[]>([])
  const [recentUpdates, setRecentUpdates] = useState<RecentUpdate[]>([])
  const [activityLoading, setActivityLoading] = useState(true)

  // Filter campaigns by region
  const filtered = useMemo(() => {
    if (selectedRegion === 'all') return campaigns
    return campaigns.filter(c => c.region === selectedRegion)
  }, [campaigns, selectedRegion])

  // Stats
  const stats = useMemo(() => ({
    total: filtered.length,
    onTrack: filtered.filter(c => c.status === 'on-track').length,
    needsAttention: filtered.filter(c => c.status === 'keep-track').length,
    atRisk: filtered.filter(c => c.status === 'danger').length,
  }), [filtered])

  // By Initiative Type
  const byType = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const c of filtered) {
      const t = c.initiativeType || 'unknown'
      counts[t] = (counts[t] || 0) + 1
    }
    return counts
  }, [filtered])

  // By Maturity Stage
  const byMaturity = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const c of filtered) {
      const s = c.initiativeStatus || 'planned'
      counts[s] = (counts[s] || 0) + 1
    }
    return counts
  }, [filtered])

  // By Region
  const byRegion = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const c of filtered) {
      const r = c.region || 'Unassigned'
      counts[r] = (counts[r] || 0) + 1
    }
    return counts
  }, [filtered])

  // By Business Unit
  const byBusinessUnit = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const c of filtered) {
      const bu = c.businessUnit || 'Unassigned'
      counts[bu] = (counts[bu] || 0) + 1
    }
    return counts
  }, [filtered])

  // Health Matrix: maturity stage x health status
  const healthMatrix = useMemo(() => {
    const matrix: Record<string, Record<string, number>> = {}
    const stages = ['planned', 'active', 'scaling', 'retired'] as const
    const statuses = ['on-track', 'keep-track', 'danger'] as const
    for (const stage of stages) {
      matrix[stage] = {}
      for (const status of statuses) {
        matrix[stage][status] = 0
      }
    }
    for (const c of filtered) {
      const stage = c.initiativeStatus || 'planned'
      const status = c.status || 'on-track'
      if (matrix[stage]) {
        matrix[stage][status] = (matrix[stage][status] || 0) + 1
      }
    }
    return matrix
  }, [filtered])

  // Fetch activity data
  useEffect(() => {
    let isMounted = true

    async function fetchActivity() {
      setActivityLoading(true)

      const [checkInRes, updatesRes] = await Promise.all([
        supabase
          .from('campaign_access_tokens')
          .select('id, name, submitted_at, campaigns(expert_name)')
          .eq('token_type', 'check_in')
          .not('submitted_at', 'is', null)
          .order('submitted_at', { ascending: false })
          .limit(10),
        supabase
          .from('campaigns')
          .select('id, expert_name, updated_at')
          .is('deleted_at', null)
          .order('updated_at', { ascending: false })
          .limit(10),
      ])

      if (!isMounted) return

      if (checkInRes.data) {
        setCheckIns(
          checkInRes.data.map((r: Record<string, unknown>) => ({
            id: r.id as string,
            campaignName: (r.campaigns as { expert_name: string } | null)?.expert_name || 'Unknown',
            guestName: (r.name as string) || 'Unknown',
            submittedAt: r.submitted_at as string,
          }))
        )
      }

      if (updatesRes.data) {
        setRecentUpdates(
          updatesRes.data.map((r: Record<string, unknown>) => ({
            id: r.id as string,
            name: (r.expert_name as string) || 'Unknown',
            updatedAt: r.updated_at as string,
          }))
        )
      }

      setActivityLoading(false)
    }

    fetchActivity()
    return () => { isMounted = false }
  }, [supabase])

  // Merge activity feed
  const activityFeed = useMemo((): ActivityItem[] => {
    const items: ActivityItem[] = []

    for (const ci of checkIns) {
      items.push({
        id: `ci-${ci.id}`,
        label: `${ci.campaignName} — Check-in received from ${ci.guestName}`,
        time: timeAgo(ci.submittedAt),
        sortTime: new Date(ci.submittedAt).getTime(),
      })
    }

    for (const u of recentUpdates) {
      items.push({
        id: `up-${u.id}`,
        label: `${u.name} — Initiative updated`,
        time: timeAgo(u.updatedAt),
        sortTime: new Date(u.updatedAt).getTime(),
      })
    }

    items.sort((a, b) => b.sortTime - a.sortTime)
    return items.slice(0, 10)
  }, [checkIns, recentUpdates])

  const maturityOrder: InitiativeStatus[] = ['planned', 'active', 'scaling', 'retired']
  const healthStatuses = [
    { key: 'on-track', label: 'On Track', variant: 'success' as const },
    { key: 'keep-track', label: 'Attention', variant: 'warning' as const },
    { key: 'danger', label: 'At Risk', variant: 'error' as const },
  ]

  return (
    <div className={containers.pageContainer}>
      <div className={containers.wideContainer}>
        <PageHeader
          title="Portfolio"
          subtitle="Portfolio-wide view of all AI initiatives across the organization."
          className="mb-6"
        />

        {/* Region Filter */}
        <div className={cn('flex items-center gap-3', spacing.marginBottomSection)}>
          <FunnelSimple className="w-4 h-4 text-muted-foreground" weight="bold" />
          <select
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value)}
            className="border rounded-lg bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20"
          >
            <option value="all">All Regions</option>
            {REGIONS.map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
          {selectedRegion !== 'all' && (
            <span className="text-xs text-muted-foreground">
              Showing {filtered.length} of {campaigns.length} initiatives
            </span>
          )}
        </div>

        {/* Top Stats */}
        <div className={cn('grid gap-4 sm:grid-cols-2 lg:grid-cols-4', spacing.marginBottomSection)}>
          <div className={components.card}>
            <div className="flex items-center justify-between">
              <p className={typography.label}>Total Initiatives</p>
              <ChartBar className="w-4 h-4 text-muted-foreground" weight="bold" />
            </div>
            <div className="mt-4 text-2xl font-semibold">{stats.total}</div>
          </div>
          <div className={components.card}>
            <div className="flex items-center justify-between">
              <p className={typography.label}>On Track</p>
              <CheckCircle className="w-4 h-4 text-emerald-600" weight="bold" />
            </div>
            <div className="mt-4 text-2xl font-semibold text-emerald-700">{stats.onTrack}</div>
          </div>
          <div className={components.card}>
            <div className="flex items-center justify-between">
              <p className={typography.label}>Needs Attention</p>
              <Warning className="w-4 h-4 text-amber-600" weight="bold" />
            </div>
            <div className="mt-4 text-2xl font-semibold text-amber-700">{stats.needsAttention}</div>
          </div>
          <div className={components.card}>
            <div className="flex items-center justify-between">
              <p className={typography.label}>At Risk</p>
              <Warning className="w-4 h-4 text-red-600" weight="bold" />
            </div>
            <div className="mt-4 text-2xl font-semibold text-red-700">{stats.atRisk}</div>
          </div>
        </div>

        {/* Two-column layout for type + maturity */}
        <div className={cn('grid gap-6 lg:grid-cols-2', spacing.marginBottomSection)}>
          {/* By Initiative Type */}
          <section className={components.card}>
            <div className={sectionHeader.container}>
              <h3 className="text-sm font-semibold tracking-wide text-foreground font-sans">By Initiative Type</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {(Object.keys(INITIATIVE_TYPES) as InitiativeType[]).map(type => {
                const Icon = INITIATIVE_ICONS[type]
                const count = byType[type] || 0
                return (
                  <div key={type} className="flex items-center gap-3 p-3 rounded-lg border">
                    {Icon && <Icon className="w-5 h-5 text-muted-foreground" weight="bold" />}
                    <div>
                      <p className="text-sm font-medium">{INITIATIVE_TYPES[type].label}</p>
                      <p className="text-lg font-semibold">{count}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>

          {/* By Maturity Stage (Funnel) */}
          <section className={components.card}>
            <div className={sectionHeader.container}>
              <h3 className="text-sm font-semibold tracking-wide text-foreground font-sans">Lifecycle Stages</h3>
            </div>
            <div className="space-y-3">
              {maturityOrder.map((stage, idx) => {
                const info = MATURITY_STAGES[stage]
                const count = byMaturity[stage] || 0
                const maxCount = Math.max(...Object.values(byMaturity), 1)
                const widthPct = Math.max(10, (count / maxCount) * 100)
                return (
                  <div key={stage}>
                    <div className="flex items-center justify-between mb-1">
                      <span className={cn('text-sm font-medium', info.color)}>{info.label}</span>
                      <span className="text-sm font-semibold">{count}</span>
                    </div>
                    <div className="w-full h-6 rounded bg-secondary overflow-hidden">
                      <div
                        className={cn('h-full rounded transition-all', info.bgColor, 'border', info.borderColor)}
                        style={{ width: `${widthPct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        </div>

        {/* By Region */}
        <section className={cn(components.card, spacing.marginBottomSection)}>
          <div className={sectionHeader.container}>
            <h3 className="text-sm font-semibold tracking-wide text-foreground font-sans">By Region</h3>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {Object.entries(byRegion)
              .sort((a, b) => b[1] - a[1])
              .map(([region, count]) => (
                <div key={region} className="flex items-center gap-3 p-3 rounded-lg border">
                  <Globe className="w-5 h-5 text-muted-foreground" weight="bold" />
                  <div>
                    <p className="text-sm font-medium">{region}</p>
                    <p className="text-lg font-semibold">{count}</p>
                  </div>
                </div>
              ))}
            {Object.keys(byRegion).length === 0 && (
              <p className="text-sm text-muted-foreground col-span-3">No regional data available.</p>
            )}
          </div>
        </section>

        {/* By Business Unit */}
        <section className={cn(components.card, spacing.marginBottomSection)}>
          <div className={sectionHeader.container}>
            <h3 className="text-sm font-semibold tracking-wide text-foreground font-sans">By Business Unit</h3>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Object.entries(byBusinessUnit)
              .sort((a, b) => b[1] - a[1])
              .map(([unit, count]) => (
                <div key={unit} className="flex items-center gap-3 p-3 rounded-lg border">
                  <Buildings className="w-5 h-5 text-muted-foreground" weight="bold" />
                  <div>
                    <p className="text-sm font-medium">{unit}</p>
                    <p className="text-lg font-semibold">{count}</p>
                  </div>
                </div>
              ))}
            {Object.keys(byBusinessUnit).length === 0 && (
              <p className="text-sm text-muted-foreground col-span-3">No business unit data available.</p>
            )}
          </div>
        </section>

        {/* Health Matrix */}
        <section className={cn(components.card, spacing.marginBottomSection)}>
          <div className={sectionHeader.container}>
            <h3 className="text-sm font-semibold tracking-wide text-foreground font-sans">Health Matrix</h3>
            <p className="text-xs text-muted-foreground mt-1">Maturity stage vs. health status</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Stage</th>
                  {healthStatuses.map(s => (
                    <th key={s.key} className="text-center py-2 px-3 font-medium text-muted-foreground">{s.label}</th>
                  ))}
                  <th className="text-center py-2 pl-3 font-medium text-muted-foreground">Total</th>
                </tr>
              </thead>
              <tbody>
                {maturityOrder.map(stage => {
                  const info = MATURITY_STAGES[stage]
                  const row = healthMatrix[stage] || {}
                  const total = Object.values(row).reduce((sum, v) => sum + v, 0)
                  return (
                    <tr key={stage} className="border-t">
                      <td className={cn('py-2.5 pr-4 font-medium', info.color)}>{info.label}</td>
                      {healthStatuses.map(s => {
                        const count = row[s.key] || 0
                        return (
                          <td key={s.key} className="text-center py-2.5 px-3">
                            {count > 0 ? (
                              <StatusBadge variant={s.variant}>{count}</StatusBadge>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                        )
                      })}
                      <td className="text-center py-2.5 pl-3 font-semibold">{total}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* Activity Feed */}
        <section className={components.card}>
          <div className={sectionHeader.container}>
            <h3 className="text-sm font-semibold tracking-wide text-foreground font-sans">Recent Activity</h3>
          </div>
          {activityLoading ? (
            <LoadingState className="py-6" />
          ) : activityFeed.length === 0 ? (
            <p className="text-sm text-muted-foreground">No recent activity.</p>
          ) : (
            <div className="space-y-3">
              {activityFeed.map(item => (
                <div key={item.id} className="flex items-start justify-between gap-4 py-2 border-b last:border-b-0">
                  <div className="flex items-start gap-3">
                    <ClockCounterClockwise className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" weight="bold" />
                    <p className="text-sm">{item.label}</p>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">{item.time}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
