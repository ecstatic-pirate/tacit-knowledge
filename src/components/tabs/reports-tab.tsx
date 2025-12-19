'use client';

import { useState, useEffect, useMemo } from 'react';
import { FileText, BarChart3, Network, ClipboardList, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

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
  icon: LucideIcon;
  expertName?: string;
}

const typeIconMap: Record<string, LucideIcon> = {
  summary: ClipboardList,
  skills: BarChart3,
  graph: Network,
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
        setIsLoading(false);
        return;
      }

      const mappedReports: ReportItem[] = (data || []).map((report) => {
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
      setIsLoading(false);
    }

    fetchReports();
  }, [supabase]);

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold mb-1">Reports</h1>
        <p className="text-muted-foreground">
          View generated reports and insights from capture sessions.
        </p>
      </div>

      {/* Reports List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : reports.length === 0 ? (
        <div className="text-center py-12 border rounded-lg bg-card">
          <FileText className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" />
          <p className="text-muted-foreground mb-2">No reports yet</p>
          <p className="text-sm text-muted-foreground">
            Complete a capture session to generate your first report.
          </p>
        </div>
      ) : (
        <div className="border rounded-lg divide-y bg-card">
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
                <div className={cn(
                  "px-2 py-1 rounded text-xs",
                  report.status === 'ready' && "bg-emerald-50 text-emerald-700",
                  report.status === 'processing' && "bg-amber-50 text-amber-700",
                  report.status === 'failed' && "bg-red-50 text-red-700"
                )}>
                  {report.status === 'ready' ? 'Ready' :
                   report.status === 'processing' ? 'Processing' : 'Failed'}
                </div>
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
  );
}
