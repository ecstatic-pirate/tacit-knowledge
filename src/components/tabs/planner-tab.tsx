'use client';

import { useState, useEffect } from 'react';
import { SessionScheduler } from '@/components/planner';
import { useApp, Campaign } from '@/context/app-context';
import { cn } from '@/lib/utils';
import { CaretDown, Calendar, Plus } from 'phosphor-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { containers, spacing } from '@/lib/design-system';

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
      <div className={containers.pageContainer}>
        <div className={containers.wideContainer}>
          <PageHeader
            title="Sessions"
            subtitle="Schedule and manage capture sessions with experts."
          />
          <EmptyState
            icon={Calendar}
            title="No campaigns yet"
            description="Create a campaign first to schedule sessions."
            action={
              <Button onClick={() => router.push('/prepare')} size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Create Campaign
              </Button>
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div className={containers.pageContainer}>
      <div className={containers.wideContainer}>
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <PageHeader
            title="Sessions"
            subtitle="Schedule and manage capture sessions."
          />

        {/* Campaign Selector */}
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className={cn(
              'flex items-center gap-3 px-4 py-2 rounded-lg border bg-card hover:bg-secondary/50 transition-colors w-full md:min-w-[220px]',
              isDropdownOpen && 'ring-2 ring-foreground/10'
            )}
          >
            <div className="flex-1 text-left">
              <div className="text-xs text-muted-foreground">Campaign</div>
              <div className="font-medium truncate">
                {selectedCampaign?.name || 'Select campaign'}
              </div>
            </div>
            <CaretDown
              className={cn(
                'w-4 h-4 text-muted-foreground transition-transform',
                isDropdownOpen && 'rotate-180'
              )}
              weight="bold"
            />
          </button>

          {isDropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsDropdownOpen(false)}
              />
              <div className="absolute right-0 md:right-0 left-0 md:left-auto mt-2 w-full md:w-auto bg-popover rounded-lg border shadow-md z-50 py-1">
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
  </div>
  );
}
