'use client';

import { useCallback } from 'react';
import { useToast } from '@/components/ui/toast';
import { PlannerTab } from '@/components/tabs';

export default function PlannerPage() {
  const { showToast } = useToast();

  const handleUpdatePlan = useCallback(() => {
    showToast('Interview plan updated successfully!');
  }, [showToast]);

  return <PlannerTab onUpdatePlan={handleUpdatePlan} />;
}

