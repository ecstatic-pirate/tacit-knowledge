'use client';

import { Container, SectionTitle } from '@/components/layout';
import { StatCard } from '@/components/ui';
import {
  CampaignCard,
  SkillsMapSidebar,
  TaskList,
  AISuggestionsBanner,
  KnowledgeGraph,
} from '@/components/dashboard';
import { Campaign, Task } from '@/types';
import { Briefcase, AlertTriangle, Activity, CalendarClock } from 'lucide-react';

interface DashboardTabProps {
  campaigns: Campaign[];
  tasks: Task[];
  onViewCampaignDetails: (campaign: Campaign) => void;
  onEditCampaign: (campaign: Campaign) => void;
  onReviewAISuggestions: () => void;
  onTaskToggle: (taskId: string) => void;
}

const skillCategories = [
  { name: 'Saluting', skills: ['Education', 'Design'] },
  { name: 'Negotiation', skills: ['USA', 'Japan', 'Europe'] },
  { name: 'Leadership', skills: ['Strategy', 'Team Building'] },
];

export function DashboardTab({
  campaigns,
  tasks,
  onViewCampaignDetails,
  onEditCampaign,
  onReviewAISuggestions,
  onTaskToggle,
}: DashboardTabProps) {
  return (
    <Container className="animate-fade-in">
      {/* Progress Overview */}
      <SectionTitle>Progress Overview</SectionTitle>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <StatCard
          variant="success"
          label="Skills Captured"
          value={47}
          subtitle="Across all campaigns"
          icon={Briefcase}
        />
        <StatCard
          variant="warning"
          label="Skills Missing"
          value={15}
          subtitle="Based on initial context"
          icon={AlertTriangle}
        />
        <StatCard
          variant="primary"
          label="Campaigns Active"
          value={3}
          subtitle="In progress"
          icon={Activity}
        />
        <StatCard
          variant="purple"
          label="Next Session"
          value="Dec 6, 2PM"
          subtitle="Michael Chen"
          icon={CalendarClock}
        />
      </div>

      {/* Knowledge Graph */}
      <KnowledgeGraph />

      {/* AI Suggestions */}
      <AISuggestionsBanner onReviewAll={onReviewAISuggestions} />

      {/* Ongoing Campaigns */}
      <SectionTitle>Ongoing Campaigns</SectionTitle>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8 mb-12">
        <div className="space-y-4">
          {campaigns.map((campaign) => (
            <CampaignCard
              key={campaign.id}
              campaign={campaign}
              onViewDetails={onViewCampaignDetails}
              onEdit={onEditCampaign}
            />
          ))}
        </div>
        <SkillsMapSidebar categories={skillCategories} />
      </div>

      {/* Open Tasks */}
      <TaskList tasks={tasks} onTaskToggle={onTaskToggle} />
    </Container>
  );
}
