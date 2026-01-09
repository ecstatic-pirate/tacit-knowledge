import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-muted',
        className
      )}
    />
  );
}

// Stat card skeleton
export function StatCardSkeleton() {
  return (
    <div className="border rounded-lg bg-card p-4">
      <div className="flex items-center gap-3">
        <Skeleton className="w-10 h-10 rounded-md" />
        <div className="space-y-2">
          <Skeleton className="h-7 w-12" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
    </div>
  );
}

// Campaign card skeleton
export function CampaignCardSkeleton() {
  return (
    <div className="border rounded-lg bg-card p-4">
      <div className="flex items-start gap-4">
        <Skeleton className="w-12 h-12 rounded-full flex-shrink-0" />
        <div className="flex-1 space-y-3">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-48" />
            </div>
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-8" />
            </div>
            <Skeleton className="h-2 w-full rounded-full" />
          </div>
          <div className="flex gap-4">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      </div>
    </div>
  );
}

// Session card skeleton
export function SessionCardSkeleton() {
  return (
    <div className="border rounded-lg bg-card p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="space-y-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-6 w-24 rounded-full" />
      </div>
      <div className="flex items-center gap-4 text-sm">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-4 w-20" />
      </div>
    </div>
  );
}

// Knowledge card skeleton (for person/project/team)
export function KnowledgeCardSkeleton() {
  return (
    <div className="border rounded-lg bg-card p-4">
      <div className="flex items-start gap-3 mb-3">
        <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
      <div className="space-y-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-3/4" />
      </div>
      <div className="flex gap-2 mt-3">
        <Skeleton className="h-6 w-16 rounded-full" />
        <Skeleton className="h-6 w-20 rounded-full" />
        <Skeleton className="h-6 w-14 rounded-full" />
      </div>
    </div>
  );
}

// Page header skeleton
export function PageHeaderSkeleton() {
  return (
    <div className="space-y-2 mb-8">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-96" />
    </div>
  );
}

// Dashboard page skeleton
export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>

      {/* Section header */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-28" />
      </div>

      {/* Campaign cards */}
      <div className="space-y-4">
        <CampaignCardSkeleton />
        <CampaignCardSkeleton />
        <CampaignCardSkeleton />
      </div>
    </div>
  );
}

// Knowledge Hub page skeleton
export function KnowledgeHubSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header with view toggle */}
      <div className="flex items-start justify-between gap-4">
        <PageHeaderSkeleton />
        <Skeleton className="h-10 w-64 rounded-lg" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>

      {/* Search */}
      <Skeleton className="h-11 w-full rounded-lg" />

      {/* Cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <KnowledgeCardSkeleton />
        <KnowledgeCardSkeleton />
        <KnowledgeCardSkeleton />
        <KnowledgeCardSkeleton />
        <KnowledgeCardSkeleton />
        <KnowledgeCardSkeleton />
      </div>
    </div>
  );
}

// Sessions/Planner page skeleton
export function SessionsSkeleton() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton />

      {/* Campaign selector */}
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-64 rounded-lg" />
        <Skeleton className="h-10 w-32 rounded-lg" />
      </div>

      {/* Sessions list */}
      <div className="space-y-4">
        <SessionCardSkeleton />
        <SessionCardSkeleton />
        <SessionCardSkeleton />
        <SessionCardSkeleton />
      </div>
    </div>
  );
}

// Concierge page skeleton
export function ConciergeSkeleton() {
  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Header skeleton */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-9 w-9 rounded-lg" />
      </div>

      {/* Chat area skeleton */}
      <div className="flex-1 flex flex-col">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Skeleton className="w-16 h-16 rounded-2xl mx-auto mb-6" />
            <Skeleton className="h-8 w-48 mx-auto mb-2" />
            <Skeleton className="h-4 w-80 mx-auto mb-8" />
            <div className="space-y-3 max-w-md mx-auto">
              <Skeleton className="h-16 w-full rounded-xl" />
              <Skeleton className="h-16 w-full rounded-xl" />
              <Skeleton className="h-16 w-full rounded-xl" />
            </div>
          </div>
        </div>

        {/* Input skeleton */}
        <div className="p-4 border-t border-border">
          <div className="flex gap-3">
            <Skeleton className="flex-1 h-12 rounded-xl" />
            <Skeleton className="w-12 h-12 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
