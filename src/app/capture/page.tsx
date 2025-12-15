'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Calendar, Play, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

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
  const supabase = createClient();

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'in_progress':
        return <Badge className="bg-rose-600 hover:bg-rose-700 border-transparent text-white">In Progress</Badge>;
      case 'paused':
        return <Badge variant="warning">Paused</Badge>;
      case 'scheduled':
        return <Badge variant="secondary" className="bg-stone-200 text-stone-700 hover:bg-stone-300">Scheduled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container max-w-3xl py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">Capture Sessions</h1>
        <p className="text-muted-foreground">
          Select a session to start or continue capturing knowledge.
        </p>
      </div>

      {sessions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold mb-2">No Sessions Available</h3>
            <p className="text-muted-foreground mb-4">
              Schedule a session in the Planner to start capturing knowledge.
            </p>
            <Button onClick={() => router.push('/planner')}>
              <Calendar className="w-4 h-4 mr-2" />
              Go to Planner
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {sessions.map((session) => (
            <Card
              key={session.id}
              className={cn(
                "cursor-pointer transition-all hover:shadow-md hover:border-primary/50",
                (session.status === 'in_progress' || session.status === 'paused') && "border-primary"
              )}
              onClick={() => router.push(`/capture/${session.id}`)}
            >
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                    {session.sessionNumber}
                  </div>
                  <div>
                    <div className="font-medium">{session.campaignName}</div>
                    <div className="text-sm text-muted-foreground">
                      {session.campaignRole} · {formatDate(session.scheduledAt)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {getStatusBadge(session.status)}
                  <Button size="sm" variant={session.status === 'in_progress' ? 'default' : 'outline'}>
                    <Play className="w-4 h-4 mr-1" />
                    {session.status === 'in_progress' ? 'Continue' : session.status === 'paused' ? 'Resume' : 'Start'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
