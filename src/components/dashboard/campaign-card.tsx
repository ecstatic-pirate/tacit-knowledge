'use client';

import { Campaign } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Progress } from '@/components/ui';
import { CheckCircle2, AlertCircle, AlertOctagon, LucideIcon, ArrowRight, Settings2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CampaignCardProps {
  campaign: Campaign;
  onViewDetails: (campaign: Campaign) => void;
  onEdit: (campaign: Campaign) => void;
}

const statusConfig: Record<string, {
  icon: LucideIcon;
  textClass: string;
  label: string;
  progressVariant: 'success' | 'warning' | 'danger';
}> = {
  'on-track': {
    icon: CheckCircle2,
    textClass: 'text-emerald-600',
    label: 'On Track',
    progressVariant: 'success',
  },
  'keep-track': {
    icon: AlertCircle,
    textClass: 'text-amber-600',
    label: 'Needs Attention',
    progressVariant: 'warning',
  },
  danger: {
    icon: AlertOctagon,
    textClass: 'text-red-600',
    label: 'At Risk',
    progressVariant: 'danger',
  },
};

export function CampaignCard({ campaign, onViewDetails, onEdit }: CampaignCardProps) {
  const config = statusConfig[campaign.status];
  const Icon = config.icon;
  const percentage = Math.round((campaign.completedSessions / campaign.totalSessions) * 100);

  return (
    <Card className="group transition-all hover:shadow-md">
      <CardHeader className="p-6 pb-4">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <h3 className="font-semibold leading-none tracking-tight">
              {campaign.name}
            </h3>
            <p className="text-sm text-muted-foreground">
              {campaign.role}
            </p>
          </div>
          <div className={cn("flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full bg-secondary", config.textClass)}>
            <Icon className="w-3.5 h-3.5" />
            {config.label}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-6 pt-0 pb-4">
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{percentage}%</span>
          </div>
          <Progress
            value={campaign.completedSessions}
            max={campaign.totalSessions}
            variant={config.progressVariant}
            className="h-2"
          />
           <div className="text-xs text-muted-foreground text-right mt-1">
              {campaign.completedSessions}/{campaign.totalSessions} sessions
           </div>
        </div>
      </CardContent>

      <CardFooter className="p-6 pt-0 gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={() => onViewDetails(campaign)}
        >
          View Details
          <ArrowRight className="ml-2 w-3 h-3" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground"
          onClick={() => onEdit(campaign)}
        >
          <Settings2 className="w-4 h-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}
