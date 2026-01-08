// Types for the Knowledge Hub feature

export interface KnowledgeExpert {
  id: string;
  name: string;
  role: string;
  department?: string;
  teamId?: string;
  teamName?: string;
  teamColor?: string;
  totalInsights: number;
  projectsDocumented: number;
  topics: string[];
  coverage: number; // percentage
}

export interface KnowledgeProject {
  id: string;
  name: string;
  description?: string;
  status: 'active' | 'completed' | 'on_hold';
  totalInsights: number;
  contributors: ProjectContributor[];
  teamBreakdown: TeamContribution[];
  keyTopics: string[];
  coverageGaps: string[];
}

export interface ProjectContributor {
  id: string;
  name: string;
  insightCount: number;
  teamColor?: string;
}

export interface TeamContribution {
  teamId: string;
  teamName: string;
  teamColor: string;
  insightCount: number;
  percentage: number;
}

export interface KnowledgeTeam {
  id: string;
  name: string;
  description?: string;
  color: string;
  memberCount: number;
  projectsDocumented: number;
  totalInsights: number;
  contributors: TeamMember[];
  topProjects: TeamProject[];
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  insightCount: number;
}

export interface TeamProject {
  id: string;
  name: string;
  insightCount: number;
  coverage: number;
}

export interface KnowledgeInsight {
  id: string;
  title: string;
  description: string;
  type: 'concept' | 'process' | 'decision' | 'lesson' | 'skill';
  expertId: string;
  expertName: string;
  projectId?: string;
  projectName?: string;
  teamId?: string;
  teamName?: string;
  teamColor?: string;
  createdAt: string;
}

export interface KnowledgeGap {
  area: string;
  severity: 'high' | 'medium' | 'low';
  description: string;
  relatedProjects?: string[];
  suggestedExperts?: string[];
}

export interface KnowledgeContradiction {
  id: string;
  topic: string;
  insights: ContradictingInsight[];
  status: 'unresolved' | 'resolved' | 'acknowledged';
}

export interface ContradictingInsight {
  id: string;
  title: string;
  expertName: string;
  statement: string;
}

export type KnowledgeViewType = 'person' | 'project' | 'team';
