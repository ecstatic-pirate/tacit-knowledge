'use client';

import { useCallback, useState, useMemo } from 'react';
import { useToast } from '@/components/ui/toast';
import { ReportsTab } from '@/components/tabs';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { CalendarCheck, ChartBar, CircleNotch, FileText, ListChecks, ShareNetwork } from 'phosphor-react';
import { createClient } from '@/lib/supabase/client';

export default function ReportsPage() {
  const { showToast } = useToast();
  const supabase = useMemo(() => createClient(), []);
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    title: string;
    content: React.ReactNode;
  }>({ isOpen: false, title: '', content: null });

  const closeModal = () => setModalState({ isOpen: false, title: '', content: null });

  const handleSaveSharing = useCallback(() => {
    showToast('Sharing settings saved!');
  }, [showToast]);

  const handleConfigureReporting = useCallback(() => {
    showToast('Reporting configuration saved!');
  }, [showToast]);

  const handleViewReport = useCallback(async (title: string, reportId?: string) => {
    // Show loading state
    setModalState({
      isOpen: true,
      title: title,
      content: (
        <div className="flex items-center justify-center py-12">
          <CircleNotch className="w-6 h-6 animate-spin text-muted-foreground" weight="bold" />
        </div>
      ),
    });

    // Fetch report data if we have an ID
    interface ReportData {
      preview: string | null;
      type: string;
      created_at: string | null;
      campaigns: { expert_name: string } | null;
      sessions: { session_number: number; notes: string | null } | null;
    }
    let reportData: ReportData | null = null;

    if (reportId) {
      const { data, error } = await supabase
        .from('reports')
        .select(`
          preview,
          type,
          created_at,
          campaigns (expert_name),
          sessions (session_number, notes)
        `)
        .eq('id', reportId)
        .single();

      if (!error && data) {
        reportData = data as unknown as ReportData;
      }
    }

    const formattedDate = reportData?.created_at
      ? new Date(reportData.created_at).toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        })
      : 'Date unknown';

    const TypeIcon = reportData?.type === 'summary' ? ListChecks : reportData?.type === 'topics' ? ChartBar : reportData?.type === 'graph' ? ShareNetwork : FileText;

    setModalState({
      isOpen: true,
      title: title,
      content: (
        <div className="space-y-6">
          <div className="flex items-center gap-3 text-muted-foreground text-sm pb-4 border-b">
            <div className="flex items-center gap-1">
              <CalendarCheck className="w-4 h-4" weight="bold" />
              <span>{formattedDate}</span>
            </div>
            <div className="w-1 h-1 rounded-full bg-border" />
            <div className="flex items-center gap-1">
              <TypeIcon className="w-4 h-4" />
              <span className="capitalize">{reportData?.type || 'Report'}</span>
            </div>
            {reportData?.campaigns && (
              <>
                <div className="w-1 h-1 rounded-full bg-border" />
                <div>{reportData.campaigns.expert_name}</div>
              </>
            )}
          </div>

          {reportData?.preview ? (
            <div className="bg-secondary/20 p-6 rounded-lg">
              <h3 className="font-semibold mb-3 text-sm">Summary</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {reportData.preview}
              </p>
            </div>
          ) : (
            <div className="bg-secondary/20 p-6 rounded-lg border border-dashed text-center py-12">
              <ChartBar className="w-12 h-12 text-muted-foreground mx-auto mb-4" weight="bold" />
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                No preview available for this report.
              </p>
            </div>
          )}

          {reportData?.sessions?.notes && (
            <div className="bg-muted/30 p-6 rounded-lg">
              <h3 className="font-semibold mb-3 text-sm">Session {reportData.sessions.session_number} Notes</h3>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {reportData.sessions.notes}
              </p>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => showToast('Export functionality coming soon', 'info')}>
              Export PDF
            </Button>
            <Button onClick={closeModal}>Close</Button>
          </div>
        </div>
      ),
    });
  }, [supabase, showToast]);

  const handleShareReport = useCallback(
    (title: string) => {
      showToast(`Sharing "${title}"...`);
    },
    [showToast]
  );

  const handleExportReport = useCallback(
    (title: string) => {
      showToast(`Exporting "${title}"...`);
    },
    [showToast]
  );

  return (
    <>
      <ReportsTab
        onSaveSharing={handleSaveSharing}
        onConfigureReporting={handleConfigureReporting}
        onViewReport={handleViewReport}
        onShareReport={handleShareReport}
        onExportReport={handleExportReport}
      />
      <Modal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        title={modalState.title}
      >
        {modalState.content}
      </Modal>
    </>
  );
}

