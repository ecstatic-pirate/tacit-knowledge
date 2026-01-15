'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { CampaignReportData } from '@/lib/hooks/use-campaign-reports';
import { Export, FileCsv, FilePdf, CaretDown } from 'phosphor-react';
import { cn } from '@/lib/utils';

type ExportFormat = 'csv' | 'pdf';

interface ExportReportButtonProps {
  campaigns: CampaignReportData[];
  selectedCampaignId?: string;
  className?: string;
}

export function ExportReportButton({
  campaigns,
  selectedCampaignId,
  className,
}: ExportReportButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const { showToast } = useToast();

  const campaignToExport = selectedCampaignId
    ? campaigns.find(c => c.id === selectedCampaignId)
    : null;

  const handleExport = useCallback(
    async (format: ExportFormat) => {
      setIsExporting(true);
      setIsOpen(false);

      try {
        if (format === 'csv') {
          exportToCSV(campaigns, campaignToExport);
          showToast('CSV report downloaded successfully');
        } else if (format === 'pdf') {
          exportToPDF(campaigns, campaignToExport);
          showToast('PDF report downloaded successfully');
        }
      } catch (error) {
        console.error('Export error:', error);
        showToast('Failed to export report', 'error');
      } finally {
        setIsExporting(false);
      }
    },
    [campaigns, campaignToExport, showToast]
  );

  return (
    <div className={cn('relative inline-block', className)}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        disabled={isExporting || campaigns.length === 0}
        className="gap-2"
      >
        <Export className="w-4 h-4" weight="bold" />
        Export Report
        <CaretDown className={cn('w-3 h-3 transition-transform', isOpen && 'rotate-180')} />
      </Button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <div className="absolute right-0 mt-2 w-48 bg-background border rounded-lg shadow-lg z-50 py-1">
            <button
              onClick={() => handleExport('csv')}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-secondary transition-colors text-left"
            >
              <FileCsv className="w-4 h-4 text-emerald-600" weight="bold" />
              <div>
                <div className="font-medium">Export as CSV</div>
                <div className="text-xs text-muted-foreground">Spreadsheet format</div>
              </div>
            </button>
            <button
              onClick={() => handleExport('pdf')}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-secondary transition-colors text-left"
            >
              <FilePdf className="w-4 h-4 text-red-600" weight="bold" />
              <div>
                <div className="font-medium">Export as PDF</div>
                <div className="text-xs text-muted-foreground">Printable report</div>
              </div>
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// CSV Export Function
function exportToCSV(
  campaigns: CampaignReportData[],
  selectedCampaign?: CampaignReportData | null
) {
  const dataToExport = selectedCampaign ? [selectedCampaign] : campaigns;

  // CSV headers
  const headers = [
    'Campaign Name',
    'Role',
    'Type',
    'Status',
    'Created Date',
    'Total Sessions',
    'Completed Sessions',
    'Scheduled Sessions',
    'Avg Duration (min)',
    'Total Topics',
    'Covered Topics',
    'Mentioned Topics',
    'Not Discussed Topics',
    'Coverage %',
    'Participants',
    'Interviewed',
  ];

  // CSV rows
  const rows = dataToExport.map(campaign => [
    escapeCsvValue(campaign.name),
    escapeCsvValue(campaign.role),
    campaign.subjectType,
    campaign.status,
    campaign.createdAt
      ? new Date(campaign.createdAt).toLocaleDateString()
      : '',
    campaign.totalSessions,
    campaign.completedSessions,
    campaign.scheduledSessions,
    campaign.averageDurationMinutes,
    campaign.totalTopics,
    campaign.coveredTopics,
    campaign.mentionedTopics,
    campaign.notDiscussedTopics,
    campaign.coveragePercentage,
    campaign.participantCount,
    campaign.interviewedParticipants,
  ]);

  // Build CSV content
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(',')),
  ].join('\n');

  // Download
  downloadFile(
    csvContent,
    `campaign-report-${new Date().toISOString().split('T')[0]}.csv`,
    'text/csv;charset=utf-8;'
  );
}

// PDF Export Function (generates HTML that can be printed as PDF)
function exportToPDF(
  campaigns: CampaignReportData[],
  selectedCampaign?: CampaignReportData | null
) {
  const dataToExport = selectedCampaign ? [selectedCampaign] : campaigns;
  const reportDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Calculate summary stats
  const totalCampaigns = dataToExport.length;
  const totalSessionsCompleted = dataToExport.reduce(
    (sum, c) => sum + c.completedSessions,
    0
  );
  const totalTopicsCovered = dataToExport.reduce(
    (sum, c) => sum + c.coveredTopics,
    0
  );
  const campaignsWithTopics = dataToExport.filter(c => c.totalTopics > 0);
  const avgCoverage =
    campaignsWithTopics.length > 0
      ? Math.round(
          campaignsWithTopics.reduce((sum, c) => sum + c.coveragePercentage, 0) /
          campaignsWithTopics.length
        )
      : 0;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Campaign Progress Report - ${reportDate}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.5;
          color: #1a1a1a;
          padding: 40px;
          max-width: 800px;
          margin: 0 auto;
        }
        h1 { font-size: 28px; margin-bottom: 8px; }
        h2 { font-size: 18px; margin: 24px 0 12px; border-bottom: 1px solid #e5e5e5; padding-bottom: 8px; }
        h3 { font-size: 16px; margin: 16px 0 8px; }
        .subtitle { color: #666; font-size: 14px; margin-bottom: 24px; }
        .summary-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-bottom: 32px;
        }
        .summary-box {
          background: #f5f5f5;
          padding: 16px;
          border-radius: 8px;
          text-align: center;
        }
        .summary-value { font-size: 28px; font-weight: bold; }
        .summary-label { font-size: 12px; color: #666; margin-top: 4px; }
        .campaign-card {
          border: 1px solid #e5e5e5;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 16px;
        }
        .campaign-header { display: flex; justify-content: space-between; align-items: start; margin-bottom: 16px; }
        .campaign-name { font-size: 18px; font-weight: 600; }
        .campaign-role { font-size: 14px; color: #666; }
        .badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
        }
        .badge-success { background: #d1fae5; color: #065f46; }
        .badge-warning { background: #fef3c7; color: #92400e; }
        .badge-error { background: #fee2e2; color: #991b1b; }
        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          margin-top: 16px;
        }
        .metric {
          background: #fafafa;
          padding: 12px;
          border-radius: 6px;
        }
        .metric-value { font-size: 20px; font-weight: bold; }
        .metric-label { font-size: 11px; color: #666; margin-top: 2px; }
        .progress-bar {
          height: 8px;
          background: #e5e5e5;
          border-radius: 4px;
          overflow: hidden;
          margin-top: 8px;
        }
        .progress-fill { height: 100%; border-radius: 4px; }
        .progress-success { background: #10b981; }
        .progress-warning { background: #f59e0b; }
        .progress-danger { background: #ef4444; }
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #e5e5e5;
          font-size: 12px;
          color: #666;
          text-align: center;
        }
        @media print {
          body { padding: 20px; }
          .campaign-card { break-inside: avoid; }
        }
      </style>
    </head>
    <body>
      <h1>Campaign Progress Report</h1>
      <p class="subtitle">Generated on ${reportDate}</p>

      <div class="summary-grid">
        <div class="summary-box">
          <div class="summary-value">${totalCampaigns}</div>
          <div class="summary-label">Total Campaigns</div>
        </div>
        <div class="summary-box">
          <div class="summary-value">${totalSessionsCompleted}</div>
          <div class="summary-label">Sessions Completed</div>
        </div>
        <div class="summary-box">
          <div class="summary-value">${totalTopicsCovered}</div>
          <div class="summary-label">Topics Covered</div>
        </div>
        <div class="summary-box">
          <div class="summary-value">${avgCoverage}%</div>
          <div class="summary-label">Avg Coverage</div>
        </div>
      </div>

      <h2>Campaign Details</h2>

      ${dataToExport
        .map(campaign => {
          const coverageClass =
            campaign.coveragePercentage >= 75
              ? 'success'
              : campaign.coveragePercentage >= 50
              ? 'warning'
              : 'danger';
          const sessionProgress =
            campaign.totalSessions > 0
              ? Math.round((campaign.completedSessions / campaign.totalSessions) * 100)
              : 0;

          return `
            <div class="campaign-card">
              <div class="campaign-header">
                <div>
                  <div class="campaign-name">${escapeHtml(campaign.name)}</div>
                  <div class="campaign-role">${escapeHtml(campaign.role)} | ${
            campaign.subjectType === 'project' ? 'Project' : 'Expert'
          } Campaign</div>
                </div>
                <span class="badge badge-${coverageClass}">${campaign.coveragePercentage}% Coverage</span>
              </div>

              <h3>Sessions</h3>
              <div class="metrics-grid">
                <div class="metric">
                  <div class="metric-value">${campaign.completedSessions}/${campaign.totalSessions}</div>
                  <div class="metric-label">Completed</div>
                </div>
                <div class="metric">
                  <div class="metric-value">${campaign.scheduledSessions}</div>
                  <div class="metric-label">Scheduled</div>
                </div>
                <div class="metric">
                  <div class="metric-value">${campaign.averageDurationMinutes}m</div>
                  <div class="metric-label">Avg Duration</div>
                </div>
                <div class="metric">
                  <div class="metric-value">${sessionProgress}%</div>
                  <div class="metric-label">Progress</div>
                </div>
              </div>
              <div class="progress-bar">
                <div class="progress-fill progress-${sessionProgress >= 75 ? 'success' : sessionProgress >= 50 ? 'warning' : 'danger'}" style="width: ${sessionProgress}%"></div>
              </div>

              ${
                campaign.totalTopics > 0
                  ? `
                <h3>Topic Coverage</h3>
                <div class="metrics-grid">
                  <div class="metric">
                    <div class="metric-value">${campaign.totalTopics}</div>
                    <div class="metric-label">Total Topics</div>
                  </div>
                  <div class="metric">
                    <div class="metric-value">${campaign.coveredTopics}</div>
                    <div class="metric-label">Covered</div>
                  </div>
                  <div class="metric">
                    <div class="metric-value">${campaign.mentionedTopics}</div>
                    <div class="metric-label">Mentioned</div>
                  </div>
                  <div class="metric">
                    <div class="metric-value">${campaign.notDiscussedTopics}</div>
                    <div class="metric-label">Not Discussed</div>
                  </div>
                </div>
                <div class="progress-bar">
                  <div class="progress-fill progress-${coverageClass}" style="width: ${campaign.coveragePercentage}%"></div>
                </div>
              `
                  : ''
              }

              ${
                campaign.subjectType === 'project' && campaign.participantCount > 0
                  ? `
                <h3>Participants</h3>
                <div class="metrics-grid" style="grid-template-columns: repeat(2, 1fr);">
                  <div class="metric">
                    <div class="metric-value">${campaign.participantCount}</div>
                    <div class="metric-label">Total Participants</div>
                  </div>
                  <div class="metric">
                    <div class="metric-value">${campaign.interviewedParticipants}</div>
                    <div class="metric-label">Interviewed</div>
                  </div>
                </div>
              `
                  : ''
              }
            </div>
          `;
        })
        .join('')}

      <div class="footer">
        <p>Generated by Tacit Knowledge Capture Platform</p>
      </div>
    </body>
    </html>
  `;

  // Open in new window for printing
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    // Trigger print dialog after a short delay to ensure content is loaded
    setTimeout(() => {
      printWindow.print();
    }, 250);
  }
}

// Helper functions
function escapeCsvValue(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
