'use client';

import { useCallback } from 'react';
import { CampaignForm, CampaignFormData } from '@/components/prepare';
import { useApp, Campaign } from '@/context/app-context';
import { useToast } from '@/components/ui/toast';
import { containers } from '@/lib/design-system';
import { PageHeader } from '@/components/ui/page-header';

interface PrepareTabProps {
  onCreateCampaign: (data: CampaignFormData) => Promise<Campaign>;
  onAcceptSuggestions: (campaignId: string) => void;
  onEditSuggestions: (campaignId: string) => void;
}

export function PrepareTab({
  onCreateCampaign,
  onAcceptSuggestions,
  onEditSuggestions,
}: PrepareTabProps) {
  const { appUser } = useApp();
  const { showToast } = useToast();

  const handleCreateCampaign = useCallback(
    async (data: CampaignFormData): Promise<{ id: string } | void> => {
      if (!appUser) {
        showToast('Please wait for user data to load or sign in again', 'error');
        return;
      }

      try {
        const campaign = await onCreateCampaign(data);
        showToast(`Campaign "${data.name}" created successfully!`);
        return { id: campaign.id };
      } catch (error) {
        console.error('Error creating campaign:', error);
        showToast(
          error instanceof Error ? error.message : 'Failed to create campaign',
          'error'
        );
      }
    },
    [onCreateCampaign, appUser, showToast]
  );

  return (
    <div className={containers.pageContainer}>
      <div className={containers.wideContainer}>
        <PageHeader
          title="New Campaign"
          subtitle="Create a campaign to start capturing knowledge from an expert."
        />
        <CampaignForm
          onSubmit={handleCreateCampaign}
          onAcceptSuggestions={onAcceptSuggestions}
          onEditSuggestions={onEditSuggestions}
        />
      </div>
    </div>
  );
}
