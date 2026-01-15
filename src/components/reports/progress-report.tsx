'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { StatCard } from '@/components/ui/stat-card';
import { Progress } from '@/components/ui/progress';
import {
  CalendarBlank,
  TrendUp,
  CheckCircle,
  Target,
  Users,
  ChartLineUp,
} from 'phosphor-react';
import { cn } from '@/lib/utils';
import { CampaignReportData, ProgressTimelineEntry } from '@/lib/hooks/use-campaign-reports';

type TimeRange = 'week' | 'month' | 'all';

interface ProgressReportProps {
  campaigns: CampaignReportData[];
  progressTimeline: ProgressTimelineEntry[];
  timeRange: TimeRange;
  onTimeRangeChange: (range: TimeRange) => void;
  className?: string;
}

export function ProgressReport({
  campaigns,
  progressTimeline,
  timeRange,
  onTimeRangeChange,
  className,
}: ProgressReportProps) {
  // Calculate summary stats
  const activeCampaigns = campaigns.filter(c => !c.completedAt).length;
  const completedCampaigns = campaigns.filter(c => c.completedAt).length;
  const totalSessionsCompleted = campaigns.reduce((sum, c) => sum + c.completedSessions, 0);
  const totalTopicsCovered = campaigns.reduce((sum, c) => sum + c.coveredTopics, 0);

  // Get stats for the selected time range
  const now = new Date();
  const rangeStart =
    timeRange === 'week'
      ? new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      : timeRange === 'month'
      ? new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      : null;

  const timelineInRange = rangeStart
    ? progressTimeline.filter(entry => new Date(entry.date) >= rangeStart)
    : progressTimeline;

  const sessionsInRange = timelineInRange.reduce((sum, e) => sum + e.sessionsCompleted, 0);
  const topicsInRange = timelineInRange.reduce((sum, e) => sum + e.topicsCovered, 0);

  // Average coverage across campaigns with topics
  const campaignsWithTopics = campaigns.filter(c => c.totalTopics > 0);
  const averageCoverage =
    campaignsWithTopics.length > 0
      ? Math.round(
          campaignsWithTopics.reduce((sum, c) => sum + c.coveragePercentage, 0) /
          campaignsWithTopics.length
        )
      : 0;

  const timeRangeLabel =
    timeRange === 'week'
      ? 'This Week'
      : timeRange === 'month'
      ? 'This Month'
      : 'All Time';

  return (
    <div className={cn('space-y-6', className)}>
      {/* Time Range Selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold font-serif">Progress Summary</h2>
        <div className="flex items-center gap-1 p-1 bg-secondary rounded-lg">
          <TimeRangeButton
            label="Week"
            active={timeRange === 'week'}
            onClick={() => onTimeRangeChange('week')}
          />
          <TimeRangeButton
            label="Month"
            active={timeRange === 'month'}
            onClick={() => onTimeRangeChange('month')}
          />
          <TimeRangeButton
            label="All"
            active={timeRange === 'all'}
            onClick={() => onTimeRangeChange('all')}
          />
        </div>
      </div>

      {/* Summary Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          variant="primary"
          label="Active Campaigns"
          value={activeCampaigns}
          subtitle={`${completedCampaigns} completed`}
          icon={Users}
        />
        <StatCard
          variant="success"
          label={`Sessions ${timeRangeLabel}`}
          value={sessionsInRange}
          subtitle={`${totalSessionsCompleted} total`}
          icon={CheckCircle}
        />
        <StatCard
          variant="warning"
          label={`Topics ${timeRangeLabel}`}
          value={topicsInRange}
          subtitle={`${totalTopicsCovered} total covered`}
          icon={Target}
        />
        <StatCard
          variant="purple"
          label="Avg Coverage"
          value={`${averageCoverage}%`}
          subtitle="across campaigns"
          icon={ChartLineUp}
        />
      </div>

      {/* Activity Timeline */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <TrendUp className="w-4 h-4" weight="bold" />
              Activity Timeline
            </h3>
            <span className="text-xs text-muted-foreground">{timeRangeLabel}</span>
          </div>
        </CardHeader>
        <CardContent>
          {timelineInRange.length > 0 ? (
            <div className="space-y-3">
              {/* Simple bar chart representation */}
              <div className="flex items-end gap-1 h-24">
                {timelineInRange.slice(-14).map((entry, index) => {
                  const maxSessions = Math.max(
                    ...timelineInRange.slice(-14).map(e => e.sessionsCompleted),
                    1
                  );
                  const height = (entry.sessionsCompleted / maxSessions) * 100;
                  const date = new Date(entry.date);
                  const dayLabel = date.toLocaleDateString('en-US', { weekday: 'short' });

                  return (
                    <div
                      key={entry.date}
                      className="flex-1 flex flex-col items-center gap-1"
                    >
                      <div
                        className={cn(
                          'w-full rounded-t transition-all',
                          entry.sessionsCompleted > 0 ? 'bg-primary' : 'bg-secondary'
                        )}
                        style={{ height: `${Math.max(height, 4)}%` }}
                        title={`${entry.date}: ${entry.sessionsCompleted} sessions`}
                      />
                      <span className="text-[10px] text-muted-foreground">
                        {index % 2 === 0 ? dayLabel.charAt(0) : ''}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Summary row */}
              <div className="flex items-center justify-between pt-2 border-t text-sm">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    <span className="text-muted-foreground">Sessions</span>
                  </div>
                </div>
                <div className="text-muted-foreground">
                  {sessionsInRange} session{sessionsInRange !== 1 ? 's' : ''} completed
                </div>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No activity in the selected time range
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top Campaigns by Activity */}
      <Card>
        <CardHeader className="pb-2">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <CalendarBlank className="w-4 h-4" weight="bold" />
            Campaign Progress
          </h3>
        </CardHeader>
        <CardContent>
          {campaigns.length > 0 ? (
            <div className="space-y-4">
              {campaigns
                .filter(c => !c.completedAt)
                .slice(0, 5)
                .map((campaign) => {
                  const progress =
                    campaign.totalSessions > 0
                      ? Math.round(
                          (campaign.completedSessions / campaign.totalSessions) * 100
                        )
                      : 0;

                  return (
                    <div key={campaign.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{campaign.name}</p>
                          <p className="text-xs text-muted-foreground">{campaign.role}</p>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                          <span className="text-muted-foreground">
                            {campaign.completedSessions}/{campaign.totalSessions} sessions
                          </span>
                          <span className="font-medium w-12 text-right">{progress}%</span>
                        </div>
                      </div>
                      <Progress value={progress} size="sm" />
                    </div>
                  );
                })}

              {campaigns.filter(c => !c.completedAt).length === 0 && (
                <div className="py-4 text-center text-sm text-muted-foreground">
                  No active campaigns
                </div>
              )}
            </div>
          ) : (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No campaigns found
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

interface TimeRangeButtonProps {
  label: string;
  active: boolean;
  onClick: () => void;
}

function TimeRangeButton({ label, active, onClick }: TimeRangeButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
        active
          ? 'bg-background text-foreground shadow-sm'
          : 'text-muted-foreground hover:text-foreground'
      )}
    >
      {label}
    </button>
  );
}
