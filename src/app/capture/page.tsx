'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Loader2, Calendar, Play, Mic } from 'lucide-react';
import { cn } from '@/lib/utils';
import { containers } from '@/lib/design-system';

interface SessionListItem {
  id: string;
  sessionNumber: number;
  status: string;
  scheduledAt: string | null;
  campaignName: string;
  campaignRole: string;
}

export default function CapturePage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<SessionListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    async function fetchSessions() {
      const { data, error } = await supabase
        .from('sessions')
        .select(`
          id,
          session_number,
          status,
          scheduled_at,
          campaigns (
            expert_name,
            expert_role
          )
        `)
        .in('status', ['scheduled', 'in_progress', 'paused'])
        .is('deleted_at', null)
        .order('scheduled_at', { ascending: true })
        .limit(10);

      if (error) {
        console.error('Error fetching sessions:', error);
        setIsLoading(false);
        return;
      }

      const mappedSessions: SessionListItem[] = (data || []).map((s) => {
        const campaign = s.campaigns as { expert_name: string; expert_role: string } | null;
        return {
          id: s.id,
          sessionNumber: s.session_number,
          status: s.status || 'scheduled',
          scheduledAt: s.scheduled_at,
          campaignName: campaign?.expert_name || 'Unknown Expert',
          campaignRole: campaign?.expert_role || 'Expert',
        };
      });

      setSessions(mappedSessions);
      setIsLoading(false);

      // Auto-redirect if there's an in-progress session
      const activeSession = mappedSessions.find(s => s.status === 'in_progress' || s.status === 'paused');
      if (activeSession) {
        router.push(`/capture/${activeSession.id}`);
      }
    }

    fetchSessions();
  }, [supabase, router]);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Not scheduled';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className={containers.pageContainer}>
      <div className={containers.pageInnerResponsive}>
        <div className="mb-8">
        <h1 className="text-2xl font-semibold mb-1">Capture Sessions</h1>
        <p className="text-muted-foreground">
          Select a session to start or continue capturing knowledge.
        </p>
      </div>

      {sessions.length === 0 ? (
        <div className="text-center py-12 border rounded-lg bg-card">
          <Mic className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" />
          <p className="text-muted-foreground mb-4">No sessions available</p>
          <p className="text-sm text-muted-foreground mb-4">
            Schedule a session in the Sessions page to start capturing.
          </p>
          <Button onClick={() => router.push('/planner')}>
            <Calendar className="w-4 h-4 mr-2" />
            Go to Sessions
          </Button>
        </div>
      ) : (
        <div className="border rounded-lg divide-y bg-card">
          {sessions.map((session) => (
            <div
              key={session.id}
              className={cn(
                "flex items-center justify-between p-4 hover:bg-secondary/50 cursor-pointer transition-colors",
                (session.status === 'in_progress' || session.status === 'paused') && "bg-secondary/30"
              )}
              onClick={() => router.push(`/capture/${session.id}`)}
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center font-medium">
                  {session.sessionNumber}
                </div>
                <div>
                  <p className="font-medium">{session.campaignName}</p>
                  <p className="text-sm text-muted-foreground">
                    {session.campaignRole} · {formatDate(session.scheduledAt)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className={cn(
                  "px-2 py-1 rounded text-xs font-medium",
                  session.status === 'in_progress' && "bg-red-50 text-red-700",
                  session.status === 'paused' && "bg-amber-50 text-amber-700",
                  session.status === 'scheduled' && "bg-secondary text-muted-foreground"
                )}>
                  {session.status === 'in_progress' ? 'In Progress' :
                   session.status === 'paused' ? 'Paused' : 'Scheduled'}
                </div>
                <Button
                  size="sm"
                  variant={session.status === 'in_progress' || session.status === 'paused' ? 'default' : 'outline'}
                >
                  <Play className="w-3.5 h-3.5 mr-1" />
                  {session.status === 'in_progress' ? 'Continue' :
                   session.status === 'paused' ? 'Resume' : 'Start'}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
      </div>
    </div>
  );
}
