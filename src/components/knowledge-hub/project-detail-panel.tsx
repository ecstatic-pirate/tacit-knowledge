'use client';

import { X, Lightbulb, Users, Warning, ArrowRight } from 'phosphor-react';
import { Button } from '@/components/ui/button';
import { CoverageBar } from '@/components/ui/coverage-bar';
import { cn } from '@/lib/utils';
import type { KnowledgeProject, KnowledgeInsight } from './types';

interface ProjectDetailPanelProps {
  project: KnowledgeProject;
  insights: KnowledgeInsight[];
  onClose: () => void;
  onViewInsight?: (insight: KnowledgeInsight) => void;
  onViewExpert?: (expertId: string) => void;
  className?: string;
}

export function ProjectDetailPanel({
  project,
  insights,
  onClose,
  onViewInsight,
  onViewExpert,
  className,
}: ProjectDetailPanelProps) {
  const statusColors = {
    active: 'bg-emerald-50 text-emerald-700',
    completed: 'bg-secondary text-muted-foreground',
    on_hold: 'bg-amber-50 text-amber-700',
  };

  const statusLabels = {
    active: 'Active',
    completed: 'Completed',
    on_hold: 'On Hold',
  };

  const coverageSegments = project.teamBreakdown.map((team) => ({
    label: team.teamName,
    value: team.insightCount,
    color: team.teamColor,
  }));

  // Group insights by type
  const insightsByType = insights.reduce<Record<string, KnowledgeInsight[]>>((acc, insight) => {
    const key = insight.type || 'other';
    if (!acc[key]) acc[key] = [];
    acc[key].push(insight);
    return acc;
  }, {});

  return (
    <div className={cn('bg-background border-l h-full flex flex-col', className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="font-semibold">Project Details</h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4 space-y-6">
        {/* Project Info */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-lg font-semibold">{project.name}</h3>
            <span className={cn('px-2 py-0.5 rounded text-xs font-medium', statusColors[project.status])}>
              {statusLabels[project.status]}
            </span>
          </div>
          {project.description && (
            <p className="text-muted-foreground">{project.description}</p>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb className="w-4 h-4 text-amber-500" weight="fill" />
              <span className="text-xs text-muted-foreground uppercase tracking-wide">Insights</span>
            </div>
            <p className="text-2xl font-semibold">{project.totalInsights}</p>
          </div>
          <div className="border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-muted-foreground" weight="fill" />
              <span className="text-xs text-muted-foreground uppercase tracking-wide">Contributors</span>
            </div>
            <p className="text-2xl font-semibold">{project.contributors.length}</p>
          </div>
        </div>

        {/* Team Coverage */}
        {coverageSegments.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-3">Team Coverage</h4>
            <CoverageBar segments={coverageSegments} showLabels size="lg" />
          </div>
        )}

        {/* Coverage Gaps */}
        {project.coverageGaps.length > 0 && (
          <div className="border border-amber-200 bg-amber-50/50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Warning className="w-5 h-5 text-amber-600" weight="fill" />
              <h4 className="font-medium text-amber-800">Knowledge Gaps Detected</h4>
            </div>
            <ul className="space-y-2">
              {project.coverageGaps.map((gap, idx) => (
                <li key={idx} className="flex items-center gap-2 text-sm text-amber-700">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  {gap}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Contributors */}
        <div>
          <h4 className="text-sm font-medium mb-3">Contributors</h4>
          <div className="space-y-2">
            {project.contributors.map((contributor) => {
              const initials = contributor.name
                .split(' ')
                .map((n) => n[0])
                .join('')
                .toUpperCase()
                .substring(0, 2);
              return (
                <button
                  key={contributor.id}
                  className="w-full flex items-center gap-3 p-3 border rounded-lg hover:bg-secondary/30 transition-colors"
                  onClick={() => onViewExpert?.(contributor.id)}
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold border-2"
                    style={{
                      backgroundColor: contributor.teamColor ? `${contributor.teamColor}20` : 'hsl(var(--primary)/0.1)',
                      borderColor: contributor.teamColor || 'hsl(var(--primary))',
                      color: contributor.teamColor || 'hsl(var(--primary))',
                    }}
                  >
                    {initials}
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-medium text-sm">{contributor.name}</p>
                    <p className="text-xs text-muted-foreground">{contributor.insightCount} insights</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground" />
                </button>
              );
            })}
          </div>
        </div>

        {/* Insights by Type */}
        <div>
          <h4 className="text-sm font-medium mb-3">Knowledge by Type</h4>
          <div className="space-y-4">
            {Object.entries(insightsByType).map(([type, typeInsights]) => (
              <div key={type} className="border rounded-lg overflow-hidden">
                <div className="bg-secondary/30 px-4 py-2 flex items-center justify-between">
                  <span className="font-medium text-sm capitalize">{type}</span>
                  <span className="text-xs text-muted-foreground">{typeInsights.length}</span>
                </div>
                <div className="divide-y">
                  {typeInsights.slice(0, 3).map((insight) => (
                    <button
                      key={insight.id}
                      className="w-full text-left px-4 py-3 hover:bg-secondary/30 transition-colors flex items-center justify-between gap-2"
                      onClick={() => onViewInsight?.(insight)}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{insight.title}</p>
                        <p className="text-xs text-muted-foreground">{insight.expertName}</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    </button>
                  ))}
                  {typeInsights.length > 3 && (
                    <div className="px-4 py-2 text-center">
                      <span className="text-xs text-muted-foreground">
                        +{typeInsights.length - 3} more
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
