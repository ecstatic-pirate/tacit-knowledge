'use client';

import { cn } from '@/lib/utils';
import { CaretRight, Lightbulb, Users, Warning } from 'phosphor-react';
import { CoverageBar } from '@/components/ui/coverage-bar';
import type { KnowledgeProject } from './types';

interface ProjectCardProps {
  project: KnowledgeProject;
  onClick?: () => void;
  className?: string;
}

export function ProjectCard({ project, onClick, className }: ProjectCardProps) {
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

  // Generate coverage segments from team breakdown
  const coverageSegments = project.teamBreakdown.map((team) => ({
    label: team.teamName,
    value: team.insightCount,
    color: team.teamColor,
  }));

  return (
    <div
      className={cn(
        'border rounded-lg bg-card p-5 hover:border-foreground/20 cursor-pointer transition-all group',
        className
      )}
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-foreground truncate">{project.name}</h3>
            <span className={cn('px-2 py-0.5 rounded text-xs font-medium', statusColors[project.status])}>
              {statusLabels[project.status]}
            </span>
          </div>
          {project.description && (
            <p className="text-sm text-muted-foreground line-clamp-1">{project.description}</p>
          )}
        </div>
        <CaretRight className="w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" weight="bold" />
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-4 mb-4">
        <div className="flex items-center gap-1.5">
          <Lightbulb className="w-4 h-4 text-amber-500" weight="fill" />
          <span className="text-sm">
            <span className="font-semibold">{project.totalInsights}</span>
            <span className="text-muted-foreground"> insights</span>
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Users className="w-4 h-4 text-muted-foreground" weight="fill" />
          <span className="text-sm">
            <span className="font-semibold">{project.contributors.length}</span>
            <span className="text-muted-foreground"> contributors</span>
          </span>
        </div>
      </div>

      {/* Team coverage bar */}
      {coverageSegments.length > 0 && (
        <div className="mb-4">
          <p className="text-xs text-muted-foreground mb-2">Team Coverage</p>
          <CoverageBar segments={coverageSegments} showLabels size="md" />
        </div>
      )}

      {/* Coverage gaps warning */}
      {project.coverageGaps.length > 0 && (
        <div className="flex items-start gap-2 p-2 rounded bg-amber-50/50 border border-amber-100">
          <Warning className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" weight="fill" />
          <div className="text-xs">
            <span className="font-medium text-amber-700">Knowledge gaps: </span>
            <span className="text-amber-600">{project.coverageGaps.slice(0, 2).join(', ')}</span>
            {project.coverageGaps.length > 2 && (
              <span className="text-amber-600"> +{project.coverageGaps.length - 2} more</span>
            )}
          </div>
        </div>
      )}

      {/* Key topics */}
      {project.keyTopics.length > 0 && project.coverageGaps.length === 0 && (
        <div className="flex flex-wrap gap-1.5">
          {project.keyTopics.slice(0, 4).map((topic, idx) => (
            <span
              key={idx}
              className="px-2 py-0.5 bg-secondary text-xs text-muted-foreground rounded"
            >
              {topic}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
