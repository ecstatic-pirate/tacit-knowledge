'use client';

import { useState, useEffect, useMemo } from 'react';
import { FileText, ChartBar, ShareNetwork, ListChecks } from 'phosphor-react';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingState } from '@/components/ui/loading-state';
import { StatusBadge } from '@/components/ui/status-badge';
import { containers, spacing } from '@/lib/design-system';

interface ReportsTabProps {
  onSaveSharing: () => void;
  onConfigureReporting: () => void;
  onViewReport: (title: string, reportId?: string) => void;
  onShareReport: (title: string) => void;
  onExportReport: (title: string) => void;
}

interface ReportItem {
  id: string;
  title: string;
  type: string;
  date: string;
  status: string;
  icon: React.ComponentType<{ className?: string }>;
  expertName?: string;
}

const typeIconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  summary: ListChecks,
  skills: ChartBar,
  graph: ShareNetwork,
  transcript: FileText,
  export: FileText,
};

export function ReportsTab({
  onViewReport,
}: ReportsTabProps) {
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    async function fetchReports() {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('reports')
          .select(`
            id,
            title,
            type,
            status,
            created_at,
            campaigns (expert_name)
          `)
          .is('deleted_at', null)
          .order('created_at', { ascending: false })
          .limit(20);

        if (error) {
          console.error('Error fetching reports:', error);
          setReports([]);
          setIsLoading(false);
          return;
        }

        if (!data || data.length === 0) {
          setReports([]);
          setIsLoading(false);
          return;
        }

        const mappedReports: ReportItem[] = data.map((report) => {
          const campaign = report.campaigns as { expert_name: string } | null;
          const date = report.created_at ? new Date(report.created_at) : new Date();
          const formattedDate = date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          });

          return {
            id: report.id,
            title: report.title,
            type: report.type,
            date: formattedDate,
            status: report.status || 'ready',
            icon: typeIconMap[report.type] || FileText,
            expertName: campaign?.expert_name,
          };
        });

        setReports(mappedReports);
      } finally {
        setIsLoading(false);
      }
    }

    fetchReports();
  }, [supabase]);

  return (
    <div className={containers.pageContainer}>
      <div className={containers.wideContainer}>
        <PageHeader
          title="Reports"
          subtitle={
            reports.length === 0
              ? 'Generated reports will appear here after your capture sessions are processed'
              : `${reports.length} report${reports.length !== 1 ? 's' : ''} from your capture sessions`
          }
        />

        {/* Reports List */}
        {isLoading ? (
          <LoadingState />
        ) : reports.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No reports yet"
            description="Reports are automatically generated after you complete and process capture sessions with your experts."
          />
        ) : (
          <div className="border rounded-lg divide-y bg-card overflow-hidden">
          {reports.map((report) => {
            const IconComponent = report.icon;
            return (
              <div
                key={report.id}
                className="flex items-center gap-4 p-4 hover:bg-secondary/50 cursor-pointer transition-colors"
                onClick={() => onViewReport(report.title, report.id)}
              >
                <div className="w-9 h-9 rounded-md bg-secondary flex items-center justify-center">
                  <IconComponent className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{report.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {report.expertName && `${report.expertName} · `}
                    <span className="capitalize">{report.type}</span>
                  </p>
                </div>
                <div className="text-sm text-muted-foreground">
                  {report.date}
                </div>
                <StatusBadge variant={
                  report.status === 'ready' ? 'success' :
                  report.status === 'processing' ? 'warning' : 'error'
                }>
                  {report.status === 'ready' ? 'Ready' :
                   report.status === 'processing' ? 'Processing' : 'Failed'}
                </StatusBadge>
                <Button variant="ghost" size="sm" onClick={(e) => {
                  e.stopPropagation();
                  onViewReport(report.title, report.id);
                }}>
                  View
                </Button>
              </div>
            );
          })}
        </div>
        )}
      </div>
    </div>
  );
}
