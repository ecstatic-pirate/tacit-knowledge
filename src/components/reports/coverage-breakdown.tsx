'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { StatusBadge } from '@/components/ui/status-badge';
import { CampaignReportData } from '@/lib/hooks/use-campaign-reports';
import { Target, CheckCircle, Warning, XCircle, Folder, UserCircle } from 'phosphor-react';
import { cn } from '@/lib/utils';

interface CoverageBreakdownProps {
  campaigns: CampaignReportData[];
  className?: string;
}

export function CoverageBreakdown({ campaigns, className }: CoverageBreakdownProps) {
  // Filter campaigns that have topics
  const campaignsWithTopics = campaigns.filter(c => c.totalTopics > 0);

  // Calculate overall stats
  const totalTopics = campaignsWithTopics.reduce((sum, c) => sum + c.totalTopics, 0);
  const totalCovered = campaignsWithTopics.reduce((sum, c) => sum + c.coveredTopics, 0);
  const totalMentioned = campaignsWithTopics.reduce((sum, c) => sum + c.mentionedTopics, 0);
  const totalNotDiscussed = campaignsWithTopics.reduce(
    (sum, c) => sum + c.notDiscussedTopics,
    0
  );
  const overallCoverage =
    totalTopics > 0 ? Math.round((totalCovered / totalTopics) * 100) : 0;

  // Sort campaigns by coverage percentage (ascending - show needing attention first)
  const sortedCampaigns = [...campaignsWithTopics].sort(
    (a, b) => a.coveragePercentage - b.coveragePercentage
  );

  return (
    <div className={cn('space-y-6', className)}>
      {/* Overall Coverage Summary */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Target className="w-4 h-4" weight="bold" />
              Overall Topic Coverage
            </h3>
            <span className="text-lg font-bold">{overallCoverage}%</span>
          </div>
        </CardHeader>
        <CardContent>
          <Progress
            value={overallCoverage}
            variant={
              overallCoverage >= 75
                ? 'success'
                : overallCoverage >= 50
                ? 'warning'
                : 'danger'
            }
            size="lg"
            className="mb-4"
          />

          <div className="grid grid-cols-3 gap-4">
            <CoverageStatBox
              icon={CheckCircle}
              label="Covered"
              count={totalCovered}
              total={totalTopics}
              variant="success"
            />
            <CoverageStatBox
              icon={Warning}
              label="Mentioned"
              count={totalMentioned}
              total={totalTopics}
              variant="warning"
            />
            <CoverageStatBox
              icon={XCircle}
              label="Not Discussed"
              count={totalNotDiscussed}
              total={totalTopics}
              variant="error"
            />
          </div>
        </CardContent>
      </Card>

      {/* Per-Campaign Coverage */}
      <Card>
        <CardHeader className="pb-2">
          <h3 className="text-sm font-semibold">Coverage by Campaign</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Sorted by coverage percentage (lowest first)
          </p>
        </CardHeader>
        <CardContent>
          {sortedCampaigns.length > 0 ? (
            <div className="divide-y">
              {sortedCampaigns.map((campaign) => {
                const CampaignIcon =
                  campaign.subjectType === 'project' ? Folder : UserCircle;

                // StatusBadge uses 'error', Progress uses 'danger'
                const badgeVariant: 'success' | 'warning' | 'error' =
                  campaign.coveragePercentage >= 75
                    ? 'success'
                    : campaign.coveragePercentage >= 50
                    ? 'warning'
                    : 'error';

                const progressVariant: 'success' | 'warning' | 'danger' =
                  campaign.coveragePercentage >= 75
                    ? 'success'
                    : campaign.coveragePercentage >= 50
                    ? 'warning'
                    : 'danger';

                return (
                  <div key={campaign.id} className="py-4 first:pt-0 last:pb-0">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="p-1.5 bg-secondary rounded shrink-0">
                        <CampaignIcon
                          className="w-4 h-4 text-muted-foreground"
                          weight="bold"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-medium truncate">{campaign.name}</p>
                          <StatusBadge variant={badgeVariant}>
                            {campaign.coveragePercentage}%
                          </StatusBadge>
                        </div>
                        <p className="text-xs text-muted-foreground">{campaign.role}</p>
                      </div>
                    </div>

                    <div className="ml-9">
                      <Progress
                        value={campaign.coveragePercentage}
                        variant={progressVariant}
                        size="sm"
                        className="mb-2"
                      />

                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                          {campaign.coveredTopics} covered
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-amber-500" />
                          {campaign.mentionedTopics} mentioned
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-red-500" />
                          {campaign.notDiscussedTopics} pending
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No campaigns with mapped topics yet
            </div>
          )}
        </CardContent>
      </Card>

      {/* Campaigns Without Topics */}
      {campaigns.filter(c => c.totalTopics === 0).length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <h3 className="text-sm font-semibold text-muted-foreground">
              Campaigns Awaiting Topic Mapping
            </h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {campaigns
                .filter(c => c.totalTopics === 0)
                .map((campaign) => {
                  const CampaignIcon =
                    campaign.subjectType === 'project' ? Folder : UserCircle;

                  return (
                    <div
                      key={campaign.id}
                      className="flex items-center gap-3 py-2 px-3 bg-secondary/30 rounded-lg"
                    >
                      <CampaignIcon
                        className="w-4 h-4 text-muted-foreground"
                        weight="bold"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{campaign.name}</p>
                        <p className="text-xs text-muted-foreground">{campaign.role}</p>
                      </div>
                      <StatusBadge variant="default">No topics</StatusBadge>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

interface CoverageStatBoxProps {
  icon: React.ComponentType<{ className?: string; weight?: 'bold' | 'regular' }>;
  label: string;
  count: number;
  total: number;
  variant: 'success' | 'warning' | 'error';
}

function CoverageStatBox({ icon: Icon, label, count, total, variant }: CoverageStatBoxProps) {
  const bgColor = {
    success: 'bg-emerald-50',
    warning: 'bg-amber-50',
    error: 'bg-red-50',
  }[variant];

  const iconColor = {
    success: 'text-emerald-600',
    warning: 'text-amber-600',
    error: 'text-red-600',
  }[variant];

  const percentage = total > 0 ? Math.round((count / total) * 100) : 0;

  return (
    <div className={cn('rounded-lg p-4 text-center', bgColor)}>
      <Icon className={cn('w-5 h-5 mx-auto mb-2', iconColor)} weight="bold" />
      <div className="text-xl font-bold">{count}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-xs font-medium mt-1">{percentage}%</div>
    </div>
  );
}
