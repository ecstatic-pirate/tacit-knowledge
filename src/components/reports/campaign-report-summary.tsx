'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { StatusBadge } from '@/components/ui/status-badge';
import { CampaignReportData } from '@/lib/hooks/use-campaign-reports';
import {
  Calendar,
  Clock,
  Users,
  Target,
  UserCircle,
  Folder,
} from 'phosphor-react';
import { cn } from '@/lib/utils';

interface CampaignReportSummaryProps {
  campaign: CampaignReportData;
  onExport?: () => void;
  className?: string;
}

export function CampaignReportSummary({
  campaign,
  className,
}: CampaignReportSummaryProps) {
  const formattedCreatedAt = campaign.createdAt
    ? new Date(campaign.createdAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'N/A';

  const statusVariant =
    campaign.status === 'on_track' || campaign.status === 'active'
      ? 'success'
      : campaign.status === 'keep_track'
      ? 'warning'
      : campaign.status === 'danger' || campaign.status === 'at_risk'
      ? 'error'
      : campaign.completedAt
      ? 'success'
      : 'default';

  const statusLabel =
    campaign.completedAt
      ? 'Completed'
      : campaign.status === 'on_track' || campaign.status === 'active'
      ? 'On Track'
      : campaign.status === 'keep_track'
      ? 'Keep Track'
      : campaign.status === 'danger' || campaign.status === 'at_risk'
      ? 'At Risk'
      : 'Active';

  const sessionProgress =
    campaign.totalSessions > 0
      ? Math.round((campaign.completedSessions / campaign.totalSessions) * 100)
      : 0;

  const CampaignIcon = campaign.subjectType === 'project' ? Folder : UserCircle;

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-secondary rounded-lg shrink-0">
              <CampaignIcon className="w-5 h-5 text-muted-foreground" weight="bold" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">{campaign.name}</h3>
              <p className="text-sm text-muted-foreground">{campaign.role}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge variant={statusVariant}>{statusLabel}</StatusBadge>
          </div>
        </div>

        <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" weight="bold" />
            <span>Created {formattedCreatedAt}</span>
          </div>
          <div className="flex items-center gap-1 capitalize">
            <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
            {campaign.subjectType} campaign
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Session Summary */}
        <div>
          <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4" weight="bold" />
            Session Summary
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <MetricBox
              label="Completed"
              value={campaign.completedSessions}
              total={campaign.totalSessions}
              variant="success"
            />
            <MetricBox
              label="Scheduled"
              value={campaign.scheduledSessions}
              variant="default"
            />
            <MetricBox
              label="In Progress"
              value={campaign.inProgressSessions}
              variant="warning"
            />
            <MetricBox
              label="Avg Duration"
              value={`${campaign.averageDurationMinutes || 0}m`}
              variant="default"
            />
          </div>
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
              <span>Session Progress</span>
              <span>
                {campaign.completedSessions} / {campaign.totalSessions} sessions
              </span>
            </div>
            <Progress
              value={sessionProgress}
              variant={sessionProgress >= 75 ? 'success' : sessionProgress >= 50 ? 'warning' : 'default'}
              size="sm"
            />
          </div>
        </div>

        {/* Topic Coverage */}
        <div>
          <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
            <Target className="w-4 h-4" weight="bold" />
            Topic Coverage
          </h4>
          {campaign.totalTopics > 0 ? (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <MetricBox
                  label="Total Topics"
                  value={campaign.totalTopics}
                  variant="default"
                />
                <MetricBox
                  label="Covered"
                  value={campaign.coveredTopics}
                  variant="success"
                />
                <MetricBox
                  label="Mentioned"
                  value={campaign.mentionedTopics}
                  variant="warning"
                />
                <MetricBox
                  label="Not Discussed"
                  value={campaign.notDiscussedTopics}
                  variant="error"
                />
              </div>
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                  <span>Coverage</span>
                  <span>{campaign.coveragePercentage}%</span>
                </div>
                <Progress
                  value={campaign.coveragePercentage}
                  variant={
                    campaign.coveragePercentage >= 75
                      ? 'success'
                      : campaign.coveragePercentage >= 50
                      ? 'warning'
                      : 'danger'
                  }
                  size="sm"
                />
              </div>
            </>
          ) : (
            <div className="text-sm text-muted-foreground py-4 text-center bg-secondary/30 rounded-lg">
              No topics mapped yet
            </div>
          )}
        </div>

        {/* Participant Status (for project campaigns) */}
        {campaign.subjectType === 'project' && campaign.participantCount > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
              <Users className="w-4 h-4" weight="bold" />
              Participant Status
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <MetricBox
                label="Total Participants"
                value={campaign.participantCount}
                variant="default"
              />
              <MetricBox
                label="Interviewed"
                value={campaign.interviewedParticipants}
                total={campaign.participantCount}
                variant="success"
              />
            </div>
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                <span>Interview Progress</span>
                <span>
                  {campaign.interviewedParticipants} / {campaign.participantCount} participants
                </span>
              </div>
              <Progress
                value={
                  campaign.participantCount > 0
                    ? Math.round(
                        (campaign.interviewedParticipants / campaign.participantCount) * 100
                      )
                    : 0
                }
                variant="success"
                size="sm"
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface MetricBoxProps {
  label: string;
  value: string | number;
  total?: number;
  variant?: 'success' | 'warning' | 'error' | 'default';
}

function MetricBox({ label, value, total, variant = 'default' }: MetricBoxProps) {
  const bgColor = {
    success: 'bg-emerald-50',
    warning: 'bg-amber-50',
    error: 'bg-red-50',
    default: 'bg-secondary/50',
  }[variant];

  const textColor = {
    success: 'text-emerald-700',
    warning: 'text-amber-700',
    error: 'text-red-700',
    default: 'text-foreground',
  }[variant];

  return (
    <div className={cn('rounded-lg p-3', bgColor)}>
      <div className="text-xs text-muted-foreground mb-1">{label}</div>
      <div className={cn('text-xl font-semibold', textColor)}>
        {value}
        {total !== undefined && (
          <span className="text-sm font-normal text-muted-foreground">
            /{total}
          </span>
        )}
      </div>
    </div>
  );
}
