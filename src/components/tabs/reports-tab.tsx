'use client';

import { Container, SectionTitle } from '@/components/layout';
import { SharingConfig, AutomatedReports, SkillsMap, ReportCard } from '@/components/reports';
import { FileText, BarChart3, Network, FileJson, Sparkles, ClipboardList } from 'lucide-react';

interface ReportsTabProps {
  onSaveSharing: () => void;
  onConfigureReporting: () => void;
  onViewReport: (title: string) => void;
  onShareReport: (title: string) => void;
  onExportReport: (title: string) => void;
}

const skillCategories = [
  {
    name: 'System Architecture & Design',
    skills: ['Microservices Architecture', 'Database Design', 'API Design', 'Scalability Patterns'],
  },
  {
    name: 'Billing & Collections Operations',
    skills: ['Payment Processing', 'Reconciliation Algorithms', 'Dunning Management', 'Compliance & Auditing'],
  },
  {
    name: 'Legacy System Integration',
    skills: ['Mainframe Integration', 'Data Migration', 'System Decommissioning', 'Backward Compatibility'],
  },
  {
    name: 'Risk & Operational Excellence',
    skills: ['Disaster Recovery', 'Incident Management', 'Performance Optimization', 'Documentation Practices'],
  },
];

const reports = [
  {
    title: 'Session 9 Summary',
    date: 'Captured on Dec 2, 2024',
    preview: 'Discussion focused on critical failure scenarios in the billing reconciliation process and how they\'re handled in production...',
    icon: ClipboardList,
  },
  {
    title: 'Skills Progress Report',
    date: 'Updated Nov 28, 2024',
    preview: '47 distinct skills mapped across 5 categories. Architecture knowledge 92% captured. Operations knowledge 78% captured...',
    icon: BarChart3,
  },
  {
    title: 'Knowledge Graph Export',
    date: 'Available for download',
    preview: 'Structured ontology ready for enterprise AI integration. Includes relationships, dependencies, and contextual metadata...',
    icon: Network,
  },
  {
    title: 'Interview Transcript',
    date: 'Session 7 - Nov 24, 2024',
    preview: 'Full transcript with AI-extracted insights and highlighted key passages. Includes speaker identification and timestamps...',
    icon: FileText,
  },
  {
    title: 'AI Integration Package',
    date: 'Ready for deployment',
    preview: 'Pre-formatted knowledge ready for your AI copilots, chat systems, and knowledge bases. Multiple export formats supported...',
    icon: FileJson,
  },
  {
    title: 'Team Knowledge Brief',
    date: 'Auto-generated weekly',
    preview: 'Executive summary of captured knowledge, gaps identified, and next steps for interview planning...',
    icon: Sparkles,
  },
];

export function ReportsTab({
  onSaveSharing,
  onConfigureReporting,
  onViewReport,
  onShareReport,
  onExportReport,
}: ReportsTabProps) {
  return (
    <Container className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <SectionTitle>Knowledge Management & Reporting</SectionTitle>

      <div className="space-y-8">
        <SharingConfig onSave={onSaveSharing} />
        <AutomatedReports onConfigure={onConfigureReporting} />
        <SkillsMap personName="Michael Chen" categories={skillCategories} />

        <div>
          <h3 className="text-lg font-semibold mb-6">Generated Reports</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reports.map((report) => (
              <ReportCard
                key={report.title}
                title={report.title}
                date={report.date}
                preview={report.preview}
                icon={report.icon}
                actions={[
                  { label: 'View', onClick: () => onViewReport(report.title) },
                  { label: 'Share', onClick: () => onShareReport(report.title) },
                ]}
              />
            ))}
          </div>
        </div>
      </div>
    </Container>
  );
}
