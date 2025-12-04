'use client';

import { Container, SectionTitle } from '@/components/layout';
import { PlannerSidebar, Timeline } from '@/components/planner';

interface PlannerTabProps {
  onUpdatePlan: () => void;
}

export function PlannerTab({ onUpdatePlan }: PlannerTabProps) {
  return (
    <Container className="animate-fade-in">
      <SectionTitle>Interview Planner</SectionTitle>

      <div className="grid grid-cols-1 lg:grid-cols-[350px_1fr] gap-8">
        <PlannerSidebar
          personName="Michael Chen"
          goal="Capture 30 years of expertise in billing & collections operations technology."
          wantedSkills="System architecture, Billing reconciliation, Legacy system integration, Risk management, Team leadership"
          notes="Focus on undocumented workarounds and institutional knowledge."
          onUpdate={onUpdatePlan}
        />
        <Timeline
          totalSessions={14}
          cadence="1x/week"
          duration="12 weeks"
          weeks={8}
        />
      </div>
    </Container>
  );
}
