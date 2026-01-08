'use client';

import { Campaign, Task } from '@/types';
import {
  Users,
  Clock,
  CheckCircle,
  CaretRight,
  Plus
} from 'phosphor-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDashboardMetrics } from '@/lib/hooks';
import { cn } from '@/lib/utils';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { StatusBadge } from '@/components/ui/status-badge';
import { containers, spacing, typography } from '@/lib/design-system';

interface DashboardTabProps {
  campaigns: Campaign[];
  tasks: Task[];
  onViewCampaignDetails: (campaign: Campaign) => void;
  onEditCampaign: (campaign: Campaign) => void;
  onReviewAISuggestions: () => void;
  onTaskToggle: (taskId: string) => void;
}

export function DashboardTab({
  campaigns,
  tasks,
  onViewCampaignDetails,
  onTaskToggle,
}: DashboardTabProps) {
  const router = useRouter();
  const { metrics, isLoading } = useDashboardMetrics();

  return (
    <div className={containers.pageContainer}>
      <div className={containers.wideContainer}>
        <PageHeader
          title="Campaigns"
          subtitle="Track and manage your knowledge capture campaigns."
        />

        {/* Stats Row */}
        <div className={cn('grid grid-cols-3 gap-4', spacing.marginBottomSection)}>
          <div className="border rounded-lg bg-card p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-md bg-secondary">
                <Users className="w-4 h-4 text-muted-foreground" weight="bold" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{metrics.activeCampaigns}</p>
                <p className="text-xs text-muted-foreground">Active Campaigns</p>
              </div>
            </div>
          </div>
          <div className="border rounded-lg bg-card p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-md bg-secondary">
                <Clock className="w-4 h-4 text-muted-foreground" weight="bold" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{metrics.upcomingSessions}</p>
                <p className="text-xs text-muted-foreground">Upcoming Sessions</p>
              </div>
            </div>
          </div>
          <div className="border rounded-lg bg-card p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-md bg-secondary">
                <CheckCircle className="w-4 h-4 text-muted-foreground" weight="bold" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{metrics.totalSkillsCaptured}</p>
                <p className="text-xs text-muted-foreground">Skills Captured</p>
              </div>
            </div>
          </div>
        </div>

        {/* Campaigns List */}
        <div className={spacing.marginBottomSection}>
          <div className="flex items-center justify-between mb-4">
            <h2 className={typography.label}>
              All Campaigns
            </h2>
          </div>

          {campaigns.length === 0 ? (
            <EmptyState
              icon={Users as unknown as React.ComponentType<{ className?: string }>}
              title="No campaigns yet"
              description="Create your first campaign to start capturing expert knowledge."
              action={
                <Button onClick={() => router.push('/new')} size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Campaign
                </Button>
              }
            />
          ) : (
            <div className="border rounded-lg divide-y bg-card">
            {campaigns.map((campaign) => (
              <div
                key={campaign.id}
                className="flex items-center justify-between p-4 hover:bg-secondary/50 cursor-pointer transition-colors"
                onClick={() => onViewCampaignDetails(campaign)}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-sm font-medium">
                    {campaign.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                  </div>
                  <div>
                    <p className="font-medium">{campaign.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {campaign.role}
                      {campaign.department && ` · ${campaign.department}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      {campaign.completedSessions}/{campaign.totalSessions} sessions
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="w-24 h-1.5 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-foreground rounded-full"
                          style={{ width: `${(campaign.completedSessions / campaign.totalSessions) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {Math.round((campaign.completedSessions / campaign.totalSessions) * 100)}%
                      </span>
                    </div>
                  </div>
                  <StatusBadge variant={
                    campaign.status === 'on-track' ? 'success' :
                    campaign.status === 'keep-track' ? 'warning' : 'error'
                  }>
                    {campaign.status === 'on-track' ? 'On Track' :
                     campaign.status === 'keep-track' ? 'Attention' : 'At Risk'}
                  </StatusBadge>
                  <CaretRight className="w-4 h-4 text-muted-foreground" weight="bold" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tasks */}
      {tasks.length > 0 && (
        <div>
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">
            Tasks
          </h2>
          <div className="border rounded-lg divide-y bg-card">
            {tasks.slice(0, 5).map((task) => (
              <div
                key={task.id}
                className={cn("flex items-center gap-3", spacing.cardPaddingCompact)}
              >
                <button
                  onClick={() => onTaskToggle(task.id)}
                  className={cn(
                    "w-4 h-4 rounded border flex items-center justify-center transition-colors",
                    task.completed
                      ? "bg-foreground border-foreground"
                      : "border-border hover:border-foreground"
                  )}
                >
                  {task.completed && <CheckCircle className="w-3 h-3 text-background" weight="fill" />}
                </button>
                <span className={cn(
                  "text-sm flex-1",
                  task.completed && "line-through text-muted-foreground"
                )}>
                  {task.title}
                </span>
                <span className={cn(
                  "text-xs px-2 py-0.5 rounded",
                  task.priority === 'urgent' && "bg-red-50 text-red-700",
                  task.priority === 'this-week' && "bg-amber-50 text-amber-700",
                  task.priority === 'on-track' && "bg-secondary text-muted-foreground"
                )}>
                  {task.priority === 'urgent' ? 'Urgent' :
                   task.priority === 'this-week' ? 'This Week' : 'Later'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  </div>
  );
}
