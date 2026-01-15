'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useApp } from '@/context/app-context';
import type {
  KnowledgeExpert,
  KnowledgeProject,
  KnowledgeTeam,
  KnowledgeInsight,
  KnowledgeGap,
} from './types';

interface KnowledgeHubStats {
  totalExperts: number;
  totalProjects: number;
  totalTeams: number;
  totalInsights: number;
}

interface UseKnowledgeHubDataReturn {
  stats: KnowledgeHubStats;
  experts: KnowledgeExpert[];
  projects: KnowledgeProject[];
  teams: KnowledgeTeam[];
  insights: KnowledgeInsight[];
  gaps: KnowledgeGap[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useKnowledgeHubData(): UseKnowledgeHubDataReturn {
  const { isLoading: authLoading } = useApp();
  const supabase = useMemo(() => createClient(), []);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [rawData, setRawData] = useState<{
    campaigns: Array<{
      id: string;
      expert_name: string;
      expert_role: string;
      department: string | null;
      team_id: string | null;
      project_id: string | null;
    }>;
    teams: Array<{
      id: string;
      name: string;
      description: string | null;
      color: string | null;
    }>;
    projects: Array<{
      id: string;
      name: string;
      description: string | null;
      status: string | null;
    }>;
    nodes: Array<{
      id: string;
      label: string;
      description: string | null;
      type: string;
      campaign_id: string;
      team_id: string | null;
      project_id: string | null;
      created_at: string | null;
    }>;
  }>({
    campaigns: [],
    teams: [],
    projects: [],
    nodes: [],
  });

  const fetchData = useCallback(async () => {
    if (authLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      const [campaignsRes, teamsRes, projectsRes, nodesRes] = await Promise.all([
        supabase
          .from('campaigns')
          .select('id, expert_name, expert_role, department, team_id, project_id')
          .is('deleted_at', null)
          .is('completed_at', null),
        supabase
          .from('teams')
          .select('id, name, description, color')
          .is('deleted_at', null),
        supabase
          .from('projects')
          .select('id, name, description, status')
          .is('deleted_at', null),
        supabase
          .from('graph_nodes')
          .select('id, label, description, type, campaign_id, team_id, project_id, created_at')
          .is('deleted_at', null)
          .order('created_at', { ascending: false }),
      ]);

      if (campaignsRes.error) throw campaignsRes.error;
      if (teamsRes.error) throw teamsRes.error;
      if (projectsRes.error) throw projectsRes.error;
      if (nodesRes.error) throw nodesRes.error;

      setRawData({
        campaigns: campaignsRes.data || [],
        teams: teamsRes.data || [],
        projects: projectsRes.data || [],
        nodes: nodesRes.data || [],
      });
    } catch (err) {
      console.error('[KnowledgeHub] Error fetching data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  }, [supabase, authLoading]);

  useEffect(() => {
    if (!authLoading) {
      fetchData();
    }
  }, [fetchData, authLoading]);

  // Transform raw data into Knowledge Hub structures
  const transformedData = useMemo(() => {
    const { campaigns, teams, projects, nodes } = rawData;

    // Create lookup maps
    const teamMap = new Map(teams.map((t) => [t.id, t]));
    const projectMap = new Map(projects.map((p) => [p.id, p]));
    const campaignMap = new Map(campaigns.map((c) => [c.id, c]));

    // Build experts from campaigns
    const experts: KnowledgeExpert[] = campaigns.map((campaign) => {
      const team = campaign.team_id ? teamMap.get(campaign.team_id) : null;
      const campaignNodes = nodes.filter((n) => n.campaign_id === campaign.id);
      const campaignProjects = new Set(campaignNodes.map((n) => n.project_id).filter(Boolean));

      // Extract topics from node labels (simple heuristic)
      const topics = campaignNodes
        .slice(0, 10)
        .map((n) => n.type)
        .filter((v, i, a) => a.indexOf(v) === i)
        .slice(0, 5);

      return {
        id: campaign.id,
        name: campaign.expert_name,
        role: campaign.expert_role,
        teamId: campaign.team_id || undefined,
        teamName: team?.name,
        teamColor: team?.color || undefined,
        totalInsights: campaignNodes.length,
        projectsDocumented: campaignProjects.size,
        topics,
        coverage: Math.min(100, Math.round((campaignNodes.length / 15) * 100)), // Assume 15 insights is 100%
      };
    });

    // Build projects with team breakdown
    const knowledgeProjects: KnowledgeProject[] = projects.map((project) => {
      const projectNodes = nodes.filter((n) => n.project_id === project.id);

      // Calculate team breakdown
      const teamCounts = new Map<string, number>();
      projectNodes.forEach((node) => {
        const campaign = node.campaign_id ? campaignMap.get(node.campaign_id) : null;
        const teamId = node.team_id || campaign?.team_id;
        if (teamId) {
          teamCounts.set(teamId, (teamCounts.get(teamId) || 0) + 1);
        }
      });

      const teamBreakdown = Array.from(teamCounts.entries())
        .map(([teamId, count]) => {
          const team = teamMap.get(teamId);
          return {
            teamId,
            teamName: team?.name || 'Unknown',
            teamColor: team?.color || '#888888',
            insightCount: count,
            percentage: projectNodes.length > 0 ? Math.round((count / projectNodes.length) * 100) : 0,
          };
        })
        .sort((a, b) => b.insightCount - a.insightCount);

      // Get contributors
      const contributorMap = new Map<string, { name: string; count: number; teamColor?: string }>();
      projectNodes.forEach((node) => {
        const campaign = node.campaign_id ? campaignMap.get(node.campaign_id) : null;
        if (campaign) {
          const existing = contributorMap.get(campaign.id);
          const team = campaign.team_id ? teamMap.get(campaign.team_id) : null;
          if (existing) {
            existing.count++;
          } else {
            contributorMap.set(campaign.id, {
              name: campaign.expert_name,
              count: 1,
              teamColor: team?.color || undefined,
            });
          }
        }
      });

      const contributors = Array.from(contributorMap.entries())
        .map(([id, data]) => ({
          id,
          name: data.name,
          insightCount: data.count,
          teamColor: data.teamColor,
        }))
        .sort((a, b) => b.insightCount - a.insightCount);

      // Extract key topics
      const keyTopics = projectNodes
        .map((n) => n.type)
        .filter((v, i, a) => a.indexOf(v) === i)
        .slice(0, 5);

      // Detect coverage gaps (simplified)
      const coverageGaps: string[] = [];
      if (teamBreakdown.length === 1 && teams.length > 1) {
        coverageGaps.push('Single team perspective');
      }
      if (contributors.length === 1 && campaigns.length > 1) {
        coverageGaps.push('Single contributor');
      }
      if (projectNodes.length < 5) {
        coverageGaps.push('Limited documentation');
      }

      return {
        id: project.id,
        name: project.name,
        description: project.description || undefined,
        status: (project.status as KnowledgeProject['status']) || 'active',
        totalInsights: projectNodes.length,
        contributors,
        teamBreakdown,
        keyTopics,
        coverageGaps,
      };
    });

    // Build teams
    const knowledgeTeams: KnowledgeTeam[] = teams.map((team) => {
      const teamCampaigns = campaigns.filter((c) => c.team_id === team.id);
      const teamNodes = nodes.filter((n) => {
        if (n.team_id === team.id) return true;
        const campaign = n.campaign_id ? campaignMap.get(n.campaign_id) : null;
        return campaign?.team_id === team.id;
      });

      // Get projects this team has documented
      const teamProjects = new Set(teamNodes.map((n) => n.project_id).filter(Boolean));

      // Contributors
      const contributors = teamCampaigns.map((c) => {
        const insightCount = nodes.filter((n) => n.campaign_id === c.id).length;
        return {
          id: c.id,
          name: c.expert_name,
          role: c.expert_role,
          insightCount,
        };
      }).sort((a, b) => b.insightCount - a.insightCount);

      // Top projects
      const projectCounts = new Map<string, number>();
      teamNodes.forEach((node) => {
        if (node.project_id) {
          projectCounts.set(node.project_id, (projectCounts.get(node.project_id) || 0) + 1);
        }
      });

      const topProjects = Array.from(projectCounts.entries())
        .map(([projectId, count]) => {
          const project = projectMap.get(projectId);
          return {
            id: projectId,
            name: project?.name || 'Unknown',
            insightCount: count,
            coverage: Math.min(100, Math.round((count / 10) * 100)),
          };
        })
        .sort((a, b) => b.insightCount - a.insightCount)
        .slice(0, 5);

      return {
        id: team.id,
        name: team.name,
        description: team.description || undefined,
        color: team.color || '#6b7280', // Default gray color
        memberCount: teamCampaigns.length,
        projectsDocumented: teamProjects.size,
        totalInsights: teamNodes.length,
        contributors,
        topProjects,
      };
    });

    // Build insights
    const insights: KnowledgeInsight[] = nodes.map((node) => {
      const campaign = node.campaign_id ? campaignMap.get(node.campaign_id) : null;
      const project = node.project_id ? projectMap.get(node.project_id) : null;
      const team = node.team_id
        ? teamMap.get(node.team_id)
        : campaign?.team_id
        ? teamMap.get(campaign.team_id)
        : null;

      return {
        id: node.id,
        title: node.label,
        description: node.description || '',
        type: (node.type as KnowledgeInsight['type']) || 'concept',
        expertId: campaign?.id || '',
        expertName: campaign?.expert_name || 'Unknown',
        projectId: project?.id,
        projectName: project?.name,
        teamId: team?.id,
        teamName: team?.name,
        teamColor: team?.color || undefined,
        createdAt: node.created_at || new Date().toISOString(),
      };
    });

    // Detect knowledge gaps (simplified)
    const gaps: KnowledgeGap[] = [];

    // Check for projects with no documentation
    projects.forEach((project) => {
      const projectNodes = nodes.filter((n) => n.project_id === project.id);
      if (projectNodes.length === 0) {
        gaps.push({
          area: project.name,
          severity: 'high',
          description: 'No knowledge captured for this project',
          relatedProjects: [project.name],
        });
      }
    });

    // Check for teams with limited documentation
    teams.forEach((team) => {
      const teamNodes = nodes.filter((n) => {
        if (n.team_id === team.id) return true;
        const campaign = n.campaign_id ? campaignMap.get(n.campaign_id) : null;
        return campaign?.team_id === team.id;
      });
      if (teamNodes.length < 5 && teamNodes.length > 0) {
        gaps.push({
          area: `${team.name} Team`,
          severity: 'medium',
          description: 'Limited knowledge captured from this team',
        });
      }
    });

    return {
      experts,
      projects: knowledgeProjects,
      teams: knowledgeTeams,
      insights,
      gaps,
    };
  }, [rawData]);

  const stats: KnowledgeHubStats = useMemo(
    () => ({
      totalExperts: transformedData.experts.length,
      totalProjects: transformedData.projects.length,
      totalTeams: transformedData.teams.length,
      totalInsights: transformedData.insights.length,
    }),
    [transformedData]
  );

  return {
    stats,
    ...transformedData,
    isLoading,
    error,
    refetch: fetchData,
  };
}
