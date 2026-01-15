'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  ChartBar,
  ShareNetwork,
  ListChecks,
  TrendUp,
  Target,
  Folder,
  CalendarBlank,
} from 'phosphor-react';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingState } from '@/components/ui/loading-state';
import { StatusBadge } from '@/components/ui/status-badge';
import { containers } from '@/lib/design-system';
import { useCampaignReports, CampaignReportData } from '@/lib/hooks/use-campaign-reports';
import { ProgressReport } from '@/components/reports/progress-report';
import { CoverageBreakdown } from '@/components/reports/coverage-breakdown';
import { CampaignReportSummary } from '@/components/reports/campaign-report-summary';
import { ExportReportButton } from '@/components/reports/export-report-button';

type ReportView = 'overview' | 'progress' | 'coverage' | 'campaigns' | 'generated';
type TimeRange = 'week' | 'month' | 'all';

interface ReportsTabProps {
  onSaveSharing: () => void;
  onConfigureReporting: () => void;
  onViewReport: (title: string, reportId?: string) => void;
  onShareReport: (title: string) => void;
  onExportReport: (title: string) => void;
}

interface ReportItem {
  id: string;
  title: string;
  type: string;
  date: string;
  status: string;
  icon: React.ComponentType<{ className?: string }>;
  expertName?: string;
}

const typeIconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  summary: ListChecks,
  topics: ChartBar,
  graph: ShareNetwork,
  transcript: FileText,
  export: FileText,
};

const viewTabs: { id: ReportView; label: string; icon: React.ComponentType<{ className?: string; weight?: 'bold' | 'regular' }> }[] = [
  { id: 'overview', label: 'Overview', icon: ChartBar },
  { id: 'progress', label: 'Progress', icon: TrendUp },
  { id: 'coverage', label: 'Coverage', icon: Target },
  { id: 'campaigns', label: 'Campaigns', icon: Folder },
  { id: 'generated', label: 'Generated', icon: FileText },
];

export function ReportsTab({
  onViewReport,
}: ReportsTabProps) {
  const [activeView, setActiveView] = useState<ReportView>('overview');
  const [timeRange, setTimeRange] = useState<TimeRange>('month');
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [generatedReports, setGeneratedReports] = useState<ReportItem[]>([]);
  const [generatedReportsLoading, setGeneratedReportsLoading] = useState(true);

  const supabase = useMemo(() => createClient(), []);

  // Fetch campaign report data
  const {
    campaigns,
    isLoading,
    progressTimeline,
    totalCampaigns,
    activeCampaigns,
    totalSessionsCompleted,
  } = useCampaignReports({ timeRange });

  // Fetch generated reports from database
  useEffect(() => {
    async function fetchGeneratedReports() {
      setGeneratedReportsLoading(true);
      try {
        const { data, error } = await supabase
          .from('reports')
          .select(`
            id,
            title,
            type,
            status,
            created_at,
            campaigns (expert_name)
          `)
          .is('deleted_at', null)
          .order('created_at', { ascending: false })
          .limit(20);

        if (error) {
          console.error('Error fetching reports:', error);
          setGeneratedReports([]);
          return;
        }

        if (!data || data.length === 0) {
          setGeneratedReports([]);
          return;
        }

        const mappedReports: ReportItem[] = data.map((report) => {
          const campaign = report.campaigns as { expert_name: string } | null;
          const date = report.created_at ? new Date(report.created_at) : new Date();
          const formattedDate = date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          });

          return {
            id: report.id,
            title: report.title,
            type: report.type,
            date: formattedDate,
            status: report.status || 'ready',
            icon: typeIconMap[report.type] || FileText,
            expertName: campaign?.expert_name,
          };
        });

        setGeneratedReports(mappedReports);
      } finally {
        setGeneratedReportsLoading(false);
      }
    }

    if (activeView === 'generated') {
      fetchGeneratedReports();
    }
  }, [supabase, activeView]);

  const selectedCampaign = selectedCampaignId
    ? campaigns.find((c) => c.id === selectedCampaignId)
    : null;

  return (
    <div className={containers.pageContainer}>
      <div className={containers.wideContainer}>
        {/* Header with Export Button */}
        <div className="flex items-start justify-between gap-4 mb-8">
          <PageHeader
            title="Reports"
            subtitle={
              totalCampaigns === 0
                ? 'Track progress and coverage across your knowledge capture campaigns'
                : `${activeCampaigns} active campaign${activeCampaigns !== 1 ? 's' : ''} with ${totalSessionsCompleted} sessions completed`
            }
          />
          <ExportReportButton
            campaigns={campaigns}
            selectedCampaignId={selectedCampaignId || undefined}
          />
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 p-1 bg-secondary/50 rounded-lg mb-6 overflow-x-auto">
          {viewTabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveView(tab.id);
                  if (tab.id !== 'campaigns') {
                    setSelectedCampaignId(null);
                  }
                }}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap',
                  activeView === tab.id
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Icon className="w-4 h-4" weight="bold" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        {isLoading ? (
          <LoadingState />
        ) : (
          <>
            {/* Overview View */}
            {activeView === 'overview' && (
              <div className="space-y-6">
                <ProgressReport
                  campaigns={campaigns}
                  progressTimeline={progressTimeline}
                  timeRange={timeRange}
                  onTimeRangeChange={setTimeRange}
                />
              </div>
            )}

            {/* Progress View */}
            {activeView === 'progress' && (
              <ProgressReport
                campaigns={campaigns}
                progressTimeline={progressTimeline}
                timeRange={timeRange}
                onTimeRangeChange={setTimeRange}
              />
            )}

            {/* Coverage View */}
            {activeView === 'coverage' && (
              <CoverageBreakdown campaigns={campaigns} />
            )}

            {/* Campaigns View */}
            {activeView === 'campaigns' && (
              <div className="space-y-6">
                {selectedCampaign ? (
                  <div className="space-y-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedCampaignId(null)}
                      className="gap-1 -ml-2"
                    >
                      <span className="text-muted-foreground">{'<-'}</span>
                      Back to all campaigns
                    </Button>
                    <CampaignReportSummary campaign={selectedCampaign} />
                  </div>
                ) : campaigns.length === 0 ? (
                  <EmptyState
                    icon={Folder}
                    title="No campaigns yet"
                    description="Create your first campaign to start tracking progress and generating reports."
                  />
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {campaigns.map((campaign) => (
                      <CampaignCard
                        key={campaign.id}
                        campaign={campaign}
                        onClick={() => setSelectedCampaignId(campaign.id)}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Generated Reports View */}
            {activeView === 'generated' && (
              <>
                {generatedReportsLoading ? (
                  <LoadingState />
                ) : generatedReports.length === 0 ? (
                  <EmptyState
                    icon={FileText}
                    title="No reports yet"
                    description="Reports are automatically generated after you complete and process capture sessions with your experts."
                  />
                ) : (
                  <div className="border rounded-lg divide-y bg-card overflow-hidden">
                    {generatedReports.map((report) => {
                      const IconComponent = report.icon;
                      return (
                        <div
                          key={report.id}
                          className="flex items-center gap-4 p-4 hover:bg-secondary/50 cursor-pointer transition-colors"
                          onClick={() => onViewReport(report.title, report.id)}
                        >
                          <div className="w-9 h-9 rounded-md bg-secondary flex items-center justify-center">
                            <IconComponent className="w-4 h-4 text-muted-foreground" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{report.title}</p>
                            <p className="text-sm text-muted-foreground">
                              {report.expertName && `${report.expertName} · `}
                              <span className="capitalize">{report.type}</span>
                            </p>
                          </div>
                          <div className="text-sm text-muted-foreground">{report.date}</div>
                          <StatusBadge
                            variant={
                              report.status === 'ready'
                                ? 'success'
                                : report.status === 'processing'
                                ? 'warning'
                                : 'error'
                            }
                          >
                            {report.status === 'ready'
                              ? 'Ready'
                              : report.status === 'processing'
                              ? 'Processing'
                              : 'Failed'}
                          </StatusBadge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              onViewReport(report.title, report.id);
                            }}
                          >
                            View
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// Campaign Card Component
interface CampaignCardProps {
  campaign: CampaignReportData;
  onClick: () => void;
}

function CampaignCard({ campaign, onClick }: CampaignCardProps) {
  const coverageVariant =
    campaign.coveragePercentage >= 75
      ? 'success'
      : campaign.coveragePercentage >= 50
      ? 'warning'
      : campaign.totalTopics > 0
      ? 'error'
      : 'default';

  const sessionProgress =
    campaign.totalSessions > 0
      ? Math.round((campaign.completedSessions / campaign.totalSessions) * 100)
      : 0;

  return (
    <div
      onClick={onClick}
      className="border rounded-lg p-4 bg-card hover:border-foreground/20 cursor-pointer transition-colors"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold truncate">{campaign.name}</h3>
          <p className="text-sm text-muted-foreground">{campaign.role}</p>
        </div>
        {campaign.totalTopics > 0 && (
          <StatusBadge variant={coverageVariant}>
            {campaign.coveragePercentage}%
          </StatusBadge>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="flex items-center gap-2">
          <CalendarBlank className="w-4 h-4 text-muted-foreground" weight="bold" />
          <span className="text-muted-foreground">
            {campaign.completedSessions}/{campaign.totalSessions} sessions
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-muted-foreground" weight="bold" />
          <span className="text-muted-foreground">
            {campaign.coveredTopics}/{campaign.totalTopics || 0} topics
          </span>
        </div>
      </div>

      {/* Mini progress bar */}
      <div className="mt-3 h-1.5 bg-secondary rounded-full overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full transition-all',
            sessionProgress >= 75
              ? 'bg-emerald-500'
              : sessionProgress >= 50
              ? 'bg-amber-500'
              : 'bg-primary'
          )}
          style={{ width: `${sessionProgress}%` }}
        />
      </div>
    </div>
  );
}
