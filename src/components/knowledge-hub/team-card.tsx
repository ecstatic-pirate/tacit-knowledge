'use client';

import { cn } from '@/lib/utils';
import { CaretRight, Lightbulb, FolderSimple, UsersFour } from 'phosphor-react';
import { SimpleProgressBar } from '@/components/ui/coverage-bar';
import type { KnowledgeTeam } from './types';

interface TeamCardProps {
  team: KnowledgeTeam;
  onClick?: () => void;
  className?: string;
}

export function TeamCard({ team, onClick, className }: TeamCardProps) {
  // Calculate average coverage across projects
  const avgCoverage = team.topProjects.length > 0
    ? Math.round(team.topProjects.reduce((sum, p) => sum + p.coverage, 0) / team.topProjects.length)
    : 0;

  return (
    <div
      className={cn(
        'border rounded-lg bg-card p-5 hover:border-foreground/20 cursor-pointer transition-all group',
        className
      )}
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 min-w-[3rem] rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: `${team.color}20` }}
          >
            <UsersFour className="w-6 h-6 flex-shrink-0" style={{ color: team.color }} weight="fill" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-foreground truncate">{team.name}</h3>
          </div>
        </div>
        <CaretRight className="w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" weight="bold" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="text-center p-2 bg-secondary/50 rounded">
          <p className="text-lg font-semibold">{team.memberCount}</p>
          <p className="text-xs text-muted-foreground">Members</p>
        </div>
        <div className="text-center p-2 bg-secondary/50 rounded">
          <p className="text-lg font-semibold">{team.projectsDocumented}</p>
          <p className="text-xs text-muted-foreground">Projects</p>
        </div>
        <div className="text-center p-2 bg-secondary/50 rounded">
          <p className="text-lg font-semibold">{team.totalInsights}</p>
          <p className="text-xs text-muted-foreground">Insights</p>
        </div>
      </div>

      {/* Overall coverage */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-muted-foreground">Avg. Project Coverage</span>
          <span className="text-xs font-medium">{avgCoverage}%</span>
        </div>
        <SimpleProgressBar
          value={avgCoverage}
          color={avgCoverage >= 70 ? 'bg-emerald-500' : avgCoverage >= 40 ? 'bg-amber-500' : 'bg-red-400'}
          size="sm"
        />
      </div>

      {/* Top contributors */}
      {team.contributors.length > 0 && (
        <div>
          <p className="text-xs text-muted-foreground mb-2">Top Contributors</p>
          <div className="flex items-center gap-1">
            {team.contributors.slice(0, 4).map((contributor, idx) => {
              const initials = contributor.name
                .split(' ')
                .map((n) => n[0])
                .join('')
                .toUpperCase()
                .substring(0, 2);
              return (
                <div
                  key={contributor.id}
                  className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary border-2 border-background"
                  style={{ marginLeft: idx > 0 ? '-8px' : 0, zIndex: 10 - idx }}
                  title={`${contributor.name}: ${contributor.insightCount} insights`}
                >
                  {initials}
                </div>
              );
            })}
            {team.contributors.length > 4 && (
              <span className="text-xs text-muted-foreground ml-2">
                +{team.contributors.length - 4}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
