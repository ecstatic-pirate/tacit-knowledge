'use client';

import { useState, useEffect } from 'react';
import { SessionScheduler } from '@/components/planner';
import { useApp, Campaign } from '@/context/app-context';
import { cn } from '@/lib/utils';
import { ChevronDown, Calendar, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

interface PlannerTabProps {
  onUpdatePlan: () => void;
}

export function PlannerTab({ onUpdatePlan }: PlannerTabProps) {
  const { campaigns } = useApp();
  const router = useRouter();
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    if (!selectedCampaignId && campaigns.length > 0) {
      setSelectedCampaignId(campaigns[0].id);
    }
  }, [campaigns, selectedCampaignId]);

  const selectedCampaign = campaigns.find((c) => c.id === selectedCampaignId);

  if (campaigns.length === 0) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold mb-1">Sessions</h1>
          <p className="text-muted-foreground">
            Schedule and manage capture sessions with experts.
          </p>
        </div>
        <div className="text-center py-12 border rounded-lg bg-card">
          <Calendar className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" />
          <p className="text-muted-foreground mb-4">No campaigns yet</p>
          <p className="text-sm text-muted-foreground mb-4">
            Create a campaign first to schedule sessions.
          </p>
          <Button onClick={() => router.push('/prepare')}>
            <Plus className="w-4 h-4 mr-2" />
            Create Campaign
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold mb-1">Sessions</h1>
          <p className="text-muted-foreground">
            Schedule and manage capture sessions.
          </p>
        </div>

        {/* Campaign Selector */}
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className={cn(
              'flex items-center gap-3 px-4 py-2 rounded-lg border bg-card hover:bg-secondary/50 transition-colors min-w-[220px]',
              isDropdownOpen && 'ring-2 ring-foreground/10'
            )}
          >
            <div className="flex-1 text-left">
              <div className="text-xs text-muted-foreground">Campaign</div>
              <div className="font-medium truncate">
                {selectedCampaign?.name || 'Select campaign'}
              </div>
            </div>
            <ChevronDown
              className={cn(
                'w-4 h-4 text-muted-foreground transition-transform',
                isDropdownOpen && 'rotate-180'
              )}
            />
          </button>

          {isDropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsDropdownOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-full bg-popover rounded-lg border shadow-md z-50 py-1">
                {campaigns.map((campaign) => (
                  <button
                    key={campaign.id}
                    onClick={() => {
                      setSelectedCampaignId(campaign.id);
                      setIsDropdownOpen(false);
                    }}
                    className={cn(
                      'w-full px-4 py-2 text-left hover:bg-secondary/50 transition-colors',
                      campaign.id === selectedCampaignId && 'bg-secondary'
                    )}
                  >
                    <div className="font-medium">{campaign.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {campaign.role}
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {selectedCampaign && (
        <SessionScheduler
          campaignId={selectedCampaign.id}
          expertName={selectedCampaign.name}
          expertEmail={selectedCampaign.expertEmail}
        />
      )}
    </div>
  );
}
