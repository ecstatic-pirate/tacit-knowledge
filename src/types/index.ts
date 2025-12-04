export type CampaignStatus = 'on-track' | 'keep-track' | 'danger';

export interface Campaign {
  id: string;
  name: string;
  role: string;
  department?: string;
  yearsExperience?: number;
  goal?: string;
  status: CampaignStatus;
  progress: number;
  totalSessions: number;
  completedSessions: number;
  skillsCaptured: number;
}

export interface Skill {
  id: string;
  name: string;
  category: string;
  captured: boolean;
}

export interface Session {
  id: string;
  campaignId: string;
  sessionNumber: number;
  date: string;
  duration: number;
  topics: string[];
  status: 'scheduled' | 'in-progress' | 'completed';
}

export interface Report {
  id: string;
  title: string;
  type: 'summary' | 'skills' | 'transcript' | 'export';
  date: string;
  campaignId?: string;
  preview: string;
}

export interface Task {
  id: string;
  title: string;
  priority: 'urgent' | 'this-week' | 'on-track';
  completed: boolean;
}

export type TabName = 'dashboard' | 'prepare' | 'capture' | 'planner' | 'reports';
