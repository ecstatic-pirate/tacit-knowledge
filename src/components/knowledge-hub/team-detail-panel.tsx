'use client';

import { X, Lightbulb, FolderSimple, ArrowRight, UsersFour } from 'phosphor-react';
import { Button } from '@/components/ui/button';
import { SimpleProgressBar } from '@/components/ui/coverage-bar';
import { cn } from '@/lib/utils';
import type { KnowledgeTeam, KnowledgeInsight } from './types';

interface TeamDetailPanelProps {
  team: KnowledgeTeam;
  insights: KnowledgeInsight[];
  onClose: () => void;
  onViewInsight?: (insight: KnowledgeInsight) => void;
  onViewExpert?: (expertId: string) => void;
  onViewProject?: (projectId: string) => void;
  className?: string;
}

export function TeamDetailPanel({
  team,
  insights,
  onClose,
  onViewInsight,
  onViewExpert,
  onViewProject,
  className,
}: TeamDetailPanelProps) {
  const avgCoverage = team.topProjects.length > 0
    ? Math.round(team.topProjects.reduce((sum, p) => sum + p.coverage, 0) / team.topProjects.length)
    : 0;

  return (
    <div className={cn('bg-background border-l h-full flex flex-col', className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="font-semibold">Team Details</h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4 space-y-6">
        {/* Team Info */}
        <div className="flex items-center gap-4">
          <div
            className="w-16 h-16 min-w-[4rem] rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: `${team.color}20` }}
          >
            <UsersFour className="w-8 h-8 flex-shrink-0" style={{ color: team.color }} weight="fill" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-semibold">{team.name}</h3>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="border rounded-lg p-3 text-center">
            <p className="text-2xl font-semibold">{team.memberCount}</p>
            <p className="text-xs text-muted-foreground">Members</p>
          </div>
          <div className="border rounded-lg p-3 text-center">
            <p className="text-2xl font-semibold">{team.projectsDocumented}</p>
            <p className="text-xs text-muted-foreground">Projects</p>
          </div>
          <div className="border rounded-lg p-3 text-center">
            <p className="text-2xl font-semibold">{team.totalInsights}</p>
            <p className="text-xs text-muted-foreground">Insights</p>
          </div>
        </div>

        {/* Avg Coverage */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Average Project Coverage</span>
            <span className="text-sm font-semibold">{avgCoverage}%</span>
          </div>
          <SimpleProgressBar
            value={avgCoverage}
            color={avgCoverage >= 70 ? 'bg-emerald-500' : avgCoverage >= 40 ? 'bg-amber-500' : 'bg-red-400'}
            size="md"
          />
        </div>

        {/* Team Members */}
        <div>
          <h4 className="text-sm font-medium mb-3">Team Members</h4>
          <div className="space-y-2">
            {team.contributors.map((member) => {
              const initials = member.name
                .split(' ')
                .map((n) => n[0])
                .join('')
                .toUpperCase()
                .substring(0, 2);
              return (
                <button
                  key={member.id}
                  className="w-full flex items-center gap-3 p-3 border rounded-lg hover:bg-secondary/30 transition-colors"
                  onClick={() => onViewExpert?.(member.id)}
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold"
                    style={{ backgroundColor: `${team.color}20`, color: team.color }}
                  >
                    {initials}
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-medium text-sm">{member.name}</p>
                    <p className="text-xs text-muted-foreground">{member.role}</p>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Lightbulb className="w-4 h-4 text-amber-500" weight="fill" />
                    {member.insightCount}
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground" />
                </button>
              );
            })}
          </div>
        </div>

        {/* Projects */}
        <div>
          <h4 className="text-sm font-medium mb-3">Projects Documented</h4>
          <div className="space-y-3">
            {team.topProjects.map((project) => (
              <button
                key={project.id}
                className="w-full border rounded-lg p-4 hover:bg-secondary/30 transition-colors text-left"
                onClick={() => onViewProject?.(project.id)}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{project.name}</span>
                  <ArrowRight className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">{project.insightCount} insights</span>
                  <span className="text-sm font-medium">{project.coverage}%</span>
                </div>
                <SimpleProgressBar
                  value={project.coverage}
                  color={project.coverage >= 70 ? 'bg-emerald-500' : project.coverage >= 40 ? 'bg-amber-500' : 'bg-red-400'}
                  size="sm"
                />
              </button>
            ))}
          </div>
        </div>

        {/* Recent Insights */}
        {insights.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-3">Recent Insights</h4>
            <div className="border rounded-lg divide-y">
              {insights.slice(0, 5).map((insight) => (
                <button
                  key={insight.id}
                  className="w-full text-left px-4 py-3 hover:bg-secondary/30 transition-colors"
                  onClick={() => onViewInsight?.(insight)}
                >
                  <p className="font-medium text-sm">{insight.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-muted-foreground">{insight.expertName}</span>
                    {insight.projectName && (
                      <>
                        <span className="text-muted-foreground">·</span>
                        <span className="text-xs text-muted-foreground">{insight.projectName}</span>
                      </>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
