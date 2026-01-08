'use client';

import { X, Lightbulb, FolderSimple, ArrowRight } from 'phosphor-react';
import { Button } from '@/components/ui/button';
import { SimpleProgressBar } from '@/components/ui/coverage-bar';
import { cn } from '@/lib/utils';
import type { KnowledgeExpert, KnowledgeInsight } from './types';

interface PersonDetailPanelProps {
  expert: KnowledgeExpert;
  insights: KnowledgeInsight[];
  onClose: () => void;
  onViewInsight?: (insight: KnowledgeInsight) => void;
  className?: string;
}

export function PersonDetailPanel({
  expert,
  insights,
  onClose,
  onViewInsight,
  className,
}: PersonDetailPanelProps) {
  const initials = expert.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);

  // Group insights by project
  const insightsByProject = insights.reduce<Record<string, KnowledgeInsight[]>>((acc, insight) => {
    const key = insight.projectName || 'Unassigned';
    if (!acc[key]) acc[key] = [];
    acc[key].push(insight);
    return acc;
  }, {});

  return (
    <div className={cn('bg-background border-l h-full flex flex-col', className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="font-semibold">Expert Details</h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4 space-y-6">
        {/* Expert Info */}
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 min-w-[4rem] rounded-full bg-primary/10 flex items-center justify-center text-lg font-semibold text-primary flex-shrink-0">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-semibold">{expert.name}</h3>
            <p className="text-muted-foreground">{expert.role}</p>
            {expert.teamName && (
              <span
                className="inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium mt-2"
                style={{
                  backgroundColor: expert.teamColor ? `${expert.teamColor}20` : 'hsl(var(--secondary))',
                  color: expert.teamColor || 'hsl(var(--muted-foreground))',
                }}
              >
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: expert.teamColor || 'currentColor' }}
                />
                {expert.teamName}
              </span>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb className="w-4 h-4 text-amber-500" weight="fill" />
              <span className="text-xs text-muted-foreground uppercase tracking-wide">Insights</span>
            </div>
            <p className="text-2xl font-semibold">{expert.totalInsights}</p>
          </div>
          <div className="border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <FolderSimple className="w-4 h-4 text-muted-foreground" weight="fill" />
              <span className="text-xs text-muted-foreground uppercase tracking-wide">Projects</span>
            </div>
            <p className="text-2xl font-semibold">{expert.projectsDocumented}</p>
          </div>
        </div>

        {/* Coverage */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Knowledge Coverage</span>
            <span className="text-sm font-semibold">{expert.coverage}%</span>
          </div>
          <SimpleProgressBar
            value={expert.coverage}
            color={expert.coverage >= 70 ? 'bg-emerald-500' : expert.coverage >= 40 ? 'bg-amber-500' : 'bg-red-400'}
            size="md"
          />
        </div>

        {/* Topics */}
        {expert.topics.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-3">Expertise Areas</h4>
            <div className="flex flex-wrap gap-2">
              {expert.topics.map((topic, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1.5 bg-secondary text-sm text-muted-foreground rounded-full capitalize"
                >
                  {topic}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Insights by Project */}
        <div>
          <h4 className="text-sm font-medium mb-3">Knowledge by Project</h4>
          <div className="space-y-4">
            {Object.entries(insightsByProject).map(([projectName, projectInsights]) => (
              <div key={projectName} className="border rounded-lg overflow-hidden">
                <div className="bg-secondary/30 px-4 py-2 flex items-center justify-between">
                  <span className="font-medium text-sm">{projectName}</span>
                  <span className="text-xs text-muted-foreground">{projectInsights.length} insights</span>
                </div>
                <div className="divide-y">
                  {projectInsights.slice(0, 5).map((insight) => (
                    <button
                      key={insight.id}
                      className="w-full text-left px-4 py-3 hover:bg-secondary/30 transition-colors flex items-center justify-between gap-2"
                      onClick={() => onViewInsight?.(insight)}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{insight.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{insight.description}</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    </button>
                  ))}
                  {projectInsights.length > 5 && (
                    <div className="px-4 py-2 text-center">
                      <span className="text-xs text-muted-foreground">
                        +{projectInsights.length - 5} more insights
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
