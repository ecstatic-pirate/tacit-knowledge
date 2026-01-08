'use client';

import { useCallback } from 'react';
import { useToast } from '@/components/ui/toast';
import { useApp } from '@/context/app-context';
import { PlannerTab } from '@/components/tabs';
import { SessionsSkeleton } from '@/components/ui/skeleton';
import { containers } from '@/lib/design-system';

export default function PlannerPage() {
  const { showToast } = useToast();
  const { isLoading } = useApp();

  const handleUpdatePlan = useCallback(() => {
    showToast('Interview plan updated successfully!');
  }, [showToast]);

  if (isLoading) {
    return (
      <div className={containers.pageContainer}>
        <div className={containers.wideContainer}>
          <SessionsSkeleton />
        </div>
      </div>
    );
  }

  return <PlannerTab onUpdatePlan={handleUpdatePlan} />;
}

