'use client';

import { Campaign } from '@/types';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui';
import { CheckCircle, WarningCircle, Warning, ArrowRight } from 'phosphor-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface CampaignRowProps {
  campaign: Campaign;
  onViewDetails: (campaign: Campaign) => void;
}

const statusConfig: Record<string, {
  icon: any;
  label: string;
  variant: 'success' | 'warning' | 'destructive' | 'default';
}> = {
  'on-track': {
    icon: CheckCircle,
    label: 'On Track',
    variant: 'success',
  },
  'keep-track': {
    icon: WarningCircle,
    label: 'Needs Attention',
    variant: 'warning',
  },
  danger: {
    icon: Warning,
    label: 'At Risk',
    variant: 'destructive',
  },
};

export function CampaignRow({ campaign, onViewDetails }: CampaignRowProps) {
  const config = statusConfig[campaign.status];
  const Icon = config.icon;
  const percentage = Math.round((campaign.completedSessions / campaign.totalSessions) * 100);

  return (
    <div 
      className="group flex items-center justify-between p-4 bg-card border-b last:border-0 hover:bg-secondary/40 transition-colors cursor-pointer"
      onClick={() => onViewDetails(campaign)}
    >
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-medium text-sm truncate text-foreground">
              {campaign.name}
            </h3>
            <Badge variant="outline" className={cn("text-[10px] h-5 px-1.5 gap-1 font-normal", 
              config.variant === 'success' && "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
              config.variant === 'warning' && "bg-amber-500/10 text-amber-700 border-amber-500/20",
              config.variant === 'destructive' && "bg-red-500/10 text-red-700 border-red-500/20"
            )}>
              {config.label}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground truncate">
            {campaign.role}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-8 mr-4">
        <div className="w-32 hidden sm:block">
          <div className="flex justify-between text-[10px] mb-1.5">
            <span className="text-muted-foreground font-medium">Progress</span>
            <span className="text-foreground font-mono">{percentage}%</span>
          </div>
          <Progress value={campaign.completedSessions} max={campaign.totalSessions} className="h-1.5" variant={config.variant === 'destructive' ? 'danger' : config.variant} />
        </div>
        
        <div className="text-right hidden md:block min-w-[100px]">
           <div className="text-[10px] text-muted-foreground uppercase font-semibold mb-0.5">Next Session</div>
           <div className="text-xs font-medium">Dec 6, 2:00 PM</div>
        </div>
      </div>

      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground group-hover:text-foreground">
        <ArrowRight className="w-4 h-4" weight="bold" />
      </Button>
    </div>
  );
}

