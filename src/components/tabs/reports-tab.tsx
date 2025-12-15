'use client';

import { useState, useEffect } from 'react';
import { Container, SectionTitle } from '@/components/layout';
import { SharingConfig, AutomatedReports, SkillsMap, ReportCard } from '@/components/reports';
import { FileText, BarChart3, Network, FileJson, Sparkles, ClipboardList, Filter, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from '@/components/ui/badge';
import { createClient } from '@/lib/supabase/client';
import { LucideIcon } from 'lucide-react';

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
}

const typeIconMap: Record<string, LucideIcon> = {
  summary: ClipboardList,
  skills: BarChart3,
  graph: Network,
  transcript: FileText,
  export: FileJson,
};

const statusDisplayMap: Record<string, string> = {
  processing: 'Processing',
  ready: 'Ready',
  failed: 'Failed',
};

export function ReportsTab({
  onViewReport,
}: ReportsTabProps) {
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

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
          campaigns (expert_name),
          sessions (session_number)
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
        const session = report.sessions as { session_number: number } | null;

        // Format the date
        const date = report.created_at ? new Date(report.created_at) : new Date();
        const formattedDate = date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        });

        // Build a descriptive title if the stored title is generic
        let displayTitle = report.title;
        if (session && campaign) {
          displayTitle = `${report.title} - ${campaign.expert_name} Session ${session.session_number}`;
        } else if (campaign) {
          displayTitle = `${report.title} - ${campaign.expert_name}`;
        }

        const status = report.status || 'processing';
        return {
          id: report.id,
          title: displayTitle,
          type: report.type.charAt(0).toUpperCase() + report.type.slice(1),
          date: formattedDate,
          status: statusDisplayMap[status] || status,
          icon: typeIconMap[report.type] || FileText,
        };
      });

      setReports(mappedReports);
      setIsLoading(false);
    }

    fetchReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Container className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-[1200px]">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reports & Insights</h1>
          <p className="text-muted-foreground text-sm">Access generated knowledge artifacts and analytics.</p>
        </div>
        <div className="flex gap-2">
           <Button variant="outline" size="sm">
             <Filter className="w-4 h-4 mr-2" />
             Filter
           </Button>
           <Button size="sm">
             Generate New Report
           </Button>
        </div>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[400px]">Report Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center">
                  <div className="flex items-center justify-center">
                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                  </div>
                </TableCell>
              </TableRow>
            ) : reports.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center">
                  <div className="text-muted-foreground">
                    <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No reports generated yet</p>
                    <p className="text-xs mt-1">Complete a session to generate your first report</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              reports.map((report) => {
                const IconComponent = report.icon;
                return (
                  <TableRow key={report.id} className="cursor-pointer hover:bg-muted/50" onClick={() => onViewReport(report.title, report.id)}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded bg-secondary flex items-center justify-center text-muted-foreground">
                          <IconComponent className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="font-medium text-sm">{report.title}</div>
                          <div className="text-[10px] text-muted-foreground">{report.id.slice(0, 8)}...</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{report.type}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{report.date}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-normal text-xs bg-secondary/50 text-muted-foreground border-transparent">
                        {report.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onViewReport(report.title, report.id); }}>
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Featured Insight Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
         <div className="p-6 rounded-lg border bg-gradient-to-br from-stone-50/50 to-amber-50/50">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
               <Sparkles className="w-4 h-4 text-amber-600" />
               Weekly Insight Summary
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
               The team has captured 15% more knowledge artifacts this week compared to last. 
               The "Legacy Integration" domain is now 85% documented.
            </p>
            <Button variant="link" className="p-0 h-auto text-amber-800">Read full summary &rarr;</Button>
         </div>
         <div className="p-6 rounded-lg border bg-card">
            <h3 className="font-semibold mb-2">Recent Exports</h3>
            <div className="space-y-3">
               {[1,2].map(i => (
                  <div key={i} className="flex items-center justify-between text-sm">
                     <span className="flex items-center gap-2 text-muted-foreground">
                        <FileJson className="w-3.5 h-3.5" />
                        knowledge-graph-v{i}.json
                     </span>
                     <span className="text-xs text-muted-foreground">2d ago</span>
                  </div>
               ))}
            </div>
         </div>
      </div>
    </Container>
  );
}
