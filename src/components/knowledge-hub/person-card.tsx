'use client';

import { cn } from '@/lib/utils';
import { CaretRight, Lightbulb, FolderSimple } from 'phosphor-react';
import { SimpleProgressBar } from '@/components/ui/coverage-bar';
import type { KnowledgeExpert } from './types';

interface PersonCardProps {
  expert: KnowledgeExpert;
  onClick?: () => void;
  className?: string;
}

export function PersonCard({ expert, onClick, className }: PersonCardProps) {
  const initials = expert.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);

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
          <div className="w-12 h-12 min-w-[3rem] rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary flex-shrink-0">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-foreground truncate">{expert.name}</h3>
            <p className="text-sm text-muted-foreground truncate">{expert.role}</p>
          </div>
        </div>
        <CaretRight className="w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" weight="bold" />
      </div>

      {/* Team badge */}
      {expert.teamName && (
        <div className="mb-4">
          <span
            className="inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium"
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
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-amber-500" weight="fill" />
          <span className="text-sm">
            <span className="font-semibold">{expert.totalInsights}</span>
            <span className="text-muted-foreground"> insights</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <FolderSimple className="w-4 h-4 text-muted-foreground" weight="fill" />
          <span className="text-sm">
            <span className="font-semibold">{expert.projectsDocumented}</span>
            <span className="text-muted-foreground"> projects</span>
          </span>
        </div>
      </div>

      {/* Coverage */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-muted-foreground">Knowledge Coverage</span>
          <span className="text-xs font-medium">{expert.coverage}%</span>
        </div>
        <SimpleProgressBar
          value={expert.coverage}
          color={expert.coverage >= 70 ? 'bg-emerald-500' : expert.coverage >= 40 ? 'bg-amber-500' : 'bg-red-400'}
          size="sm"
        />
      </div>

      {/* Topics */}
      {expert.topics.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {expert.topics.slice(0, 4).map((topic, idx) => (
            <span
              key={idx}
              className="px-2 py-0.5 bg-secondary text-xs text-muted-foreground rounded"
            >
              {topic}
            </span>
          ))}
          {expert.topics.length > 4 && (
            <span className="px-2 py-0.5 text-xs text-muted-foreground">
              +{expert.topics.length - 4}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
