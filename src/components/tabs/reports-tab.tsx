'use client';

import { Container, SectionTitle } from '@/components/layout';
import { SharingConfig, AutomatedReports, SkillsMap, ReportCard } from '@/components/reports';
import { FileText, BarChart3, Network, FileJson, Sparkles, ClipboardList, Filter } from 'lucide-react';
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

interface ReportsTabProps {
  onSaveSharing: () => void;
  onConfigureReporting: () => void;
  onViewReport: (title: string) => void;
  onShareReport: (title: string) => void;
  onExportReport: (title: string) => void;
}

const reports = [
  {
    id: 'REP-001',
    title: 'Session 9 Summary',
    type: 'Summary',
    date: 'Dec 2, 2024',
    status: 'Ready',
    icon: ClipboardList,
  },
  {
    id: 'REP-002',
    title: 'Skills Progress Report',
    type: 'Analytics',
    date: 'Nov 28, 2024',
    status: 'Updated',
    icon: BarChart3,
  },
  {
    id: 'REP-003',
    title: 'Knowledge Graph Export',
    type: 'Export',
    date: 'Available Now',
    status: 'Generated',
    icon: Network,
  },
  {
    id: 'REP-004',
    title: 'Interview Transcript - Session 7',
    type: 'Transcript',
    date: 'Nov 24, 2024',
    status: 'Processed',
    icon: FileText,
  },
  {
    id: 'REP-005',
    title: 'AI Integration Package',
    type: 'System',
    date: 'Ready',
    status: 'Ready',
    icon: FileJson,
  },
];

export function ReportsTab({
  onViewReport,
}: ReportsTabProps) {
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
            {reports.map((report) => (
              <TableRow key={report.id} className="cursor-pointer hover:bg-muted/50" onClick={() => onViewReport(report.title)}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded bg-secondary flex items-center justify-center text-muted-foreground">
                      <report.icon className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="font-medium text-sm">{report.title}</div>
                      <div className="text-[10px] text-muted-foreground">{report.id}</div>
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
                  <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onViewReport(report.title); }}>
                    View
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Featured Insight Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
         <div className="p-6 rounded-lg border bg-gradient-to-br from-indigo-50/50 to-purple-50/50">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
               <Sparkles className="w-4 h-4 text-indigo-500" />
               Weekly Insight Summary
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
               The team has captured 15% more knowledge artifacts this week compared to last. 
               The "Legacy Integration" domain is now 85% documented.
            </p>
            <Button variant="link" className="p-0 h-auto text-indigo-600">Read full summary &rarr;</Button>
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
