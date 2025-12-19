'use client';

import { Campaign, Task } from '@/types';
import {
  Users,
  Clock,
  CheckCircle2,
  ChevronRight,
  Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDashboardMetrics } from '@/lib/hooks';
import { cn } from '@/lib/utils';

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
    <div className="max-w-5xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold mb-1">Campaigns</h1>
        <p className="text-muted-foreground">
          Track and manage your knowledge capture campaigns.
        </p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="p-4 rounded-lg border bg-card">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-md bg-secondary">
              <Users className="w-4 h-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-2xl font-semibold">{metrics.activeCampaigns}</p>
              <p className="text-xs text-muted-foreground">Active Campaigns</p>
            </div>
          </div>
        </div>
        <div className="p-4 rounded-lg border bg-card">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-md bg-secondary">
              <Clock className="w-4 h-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-2xl font-semibold">{metrics.upcomingSessions}</p>
              <p className="text-xs text-muted-foreground">Upcoming Sessions</p>
            </div>
          </div>
        </div>
        <div className="p-4 rounded-lg border bg-card">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-md bg-secondary">
              <CheckCircle2 className="w-4 h-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-2xl font-semibold">{metrics.totalSkillsCaptured}</p>
              <p className="text-xs text-muted-foreground">Skills Captured</p>
            </div>
          </div>
        </div>
      </div>

      {/* Campaigns List */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            All Campaigns
          </h2>
        </div>

        {campaigns.length === 0 ? (
          <div className="text-center py-12 border rounded-lg bg-card">
            <Users className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-muted-foreground mb-4">No campaigns yet</p>
            <Button onClick={() => router.push('/prepare')}>
              <Plus className="w-4 h-4 mr-2" />
              Create Campaign
            </Button>
          </div>
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
                  <div className={cn(
                    "px-2 py-1 rounded text-xs font-medium",
                    campaign.status === 'on-track' && "bg-emerald-50 text-emerald-700",
                    campaign.status === 'keep-track' && "bg-amber-50 text-amber-700",
                    campaign.status === 'danger' && "bg-red-50 text-red-700"
                  )}>
                    {campaign.status === 'on-track' ? 'On Track' :
                     campaign.status === 'keep-track' ? 'Attention' : 'At Risk'}
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
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
                className="flex items-center gap-3 p-3"
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
                  {task.completed && <CheckCircle2 className="w-3 h-3 text-background" />}
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
  );
}
