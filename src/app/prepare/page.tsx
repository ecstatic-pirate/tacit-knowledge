'use client';

import { useCallback } from 'react';
import { useApp } from '@/context/app-context';
import { useToast } from '@/components/ui/toast';
import { PrepareTab } from '@/components/tabs';
import { CampaignFormData } from '@/components/prepare';

export default function PreparePage() {
  const { addCampaign } = useApp();
  const { showToast } = useToast();

  const handleCreateCampaign = useCallback(
    (data: CampaignFormData) => {
      // In a real app, this would make an API call
      // For now, we just add it to context with a mock ID
      addCampaign({
        id: Math.random().toString(36).substr(2, 9),
        name: data.name,
        role: data.role,
        status: 'on-track',
        progress: 0,
        totalSessions: 10,
        completedSessions: 0,
        skillsCaptured: 0,
      });
      showToast(`Campaign "${data.name}" created successfully!`);
    },
    [addCampaign, showToast]
  );

  const handleAcceptSuggestions = useCallback(() => {
    showToast('AI suggestions accepted!');
  }, [showToast]);

  const handleEditSuggestions = useCallback(() => {
    showToast('Opening suggestion editor...', 'info');
  }, [showToast]);

  return (
    <PrepareTab
      onCreateCampaign={handleCreateCampaign}
      onAcceptSuggestions={handleAcceptSuggestions}
      onEditSuggestions={handleEditSuggestions}
    />
  );
}

