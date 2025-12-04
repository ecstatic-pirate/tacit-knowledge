'use client';

import { Button } from '@/components/ui';

interface AutomatedReportsProps {
  onConfigure: () => void;
}

const reportTypes = [
  { id: 'weekly', label: 'Weekly Progress Summary', schedule: 'Auto-send every Friday', checked: false, icon: '📊' },
  { id: 'skills', label: 'Skills Extraction Report', schedule: 'After each session', checked: false, icon: '🎯' },
  { id: 'gap', label: 'Knowledge Gap Analysis', schedule: 'Bi-weekly coverage check', checked: false, icon: '🔍' },
  { id: 'export', label: 'Knowledge Graph Export', schedule: 'Monthly to AI systems', checked: true, icon: '🧠' },
];

export function AutomatedReports({ onConfigure }: AutomatedReportsProps) {
  return (
    <div
      className="bg-white rounded-lg p-8 mb-8"
      style={{ border: '1px solid var(--border)' }}
    >
      <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
        🤖 Automated Reporting
      </h3>
      <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
        Set up automatic reports to be generated and shared with stakeholders.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {reportTypes.map((report) => (
          <div
            key={report.id}
            className="rounded-lg p-4 flex items-center gap-4"
            style={{ border: '1px solid var(--border)' }}
          >
            <input
              type="checkbox"
              defaultChecked={report.checked}
              className="w-5 h-5 cursor-pointer"
              style={{ accentColor: 'var(--primary)' }}
            />
            <div>
              <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                {report.icon} {report.label}
              </div>
              <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                {report.schedule}
              </div>
            </div>
          </div>
        ))}
      </div>

      <Button onClick={onConfigure}>⚙️ Configure Reporting</Button>
    </div>
  );
}
