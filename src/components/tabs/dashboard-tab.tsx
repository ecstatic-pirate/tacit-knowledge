'use client';

import { Container } from '@/components/layout';
import { StatCard } from '@/components/ui/stat-card';
import { CampaignRow } from '@/components/dashboard/campaign-row';
import { TaskList } from '@/components/dashboard';
import { AISuggestionsBanner } from '@/components/dashboard';
import { Campaign, Task } from '@/types';
import { Briefcase, Activity, CalendarClock, ArrowUpRight, Plus, Search, ZoomIn } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { KnowledgeGraphView } from '@/components/visualizations/knowledge-graph-view';
import { useState } from 'react';

interface DashboardTabProps {
  campaigns: Campaign[];
  tasks: Task[];
  onViewCampaignDetails: (campaign: Campaign) => void;
  onEditCampaign: (campaign: Campaign) => void;
  onReviewAISuggestions: () => void;
  onTaskToggle: (taskId: string) => void;
}

export function DashboardTab({
  campaigns,
  tasks,
  onViewCampaignDetails,
  onEditCampaign,
  onReviewAISuggestions,
  onTaskToggle,
}: DashboardTabProps) {
  const [showGraph, setShowGraph] = useState(false);

  return (
    <Container className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-[1600px]">
      
      {/* Header Area */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground text-sm">Overview of your knowledge capture progress.</p>
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
           <div className="relative w-full md:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search campaigns..."
                className="w-full pl-9 h-9 bg-background"
              />
           </div>
           <Button size="sm" className="h-9 gap-1">
             <Plus className="w-4 h-4" /> New Campaign
           </Button>
        </div>
      </div>

      {/* Top Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          variant="primary"
          label="Active Campaigns"
          value={3}
          subtitle="2 on track"
          icon={Activity}
        />
        <StatCard
          variant="success"
          label="Skills Captured"
          value={47}
          subtitle="+12 this week"
          icon={Briefcase}
        />
        <StatCard
          variant="purple"
          label="Upcoming Sessions"
          value={4}
          subtitle="Next: Fri 2PM"
          icon={CalendarClock}
        />
        <StatCard
          variant="warning"
          label="Pending Review"
          value={12}
          subtitle="Requires attention"
          icon={Activity}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-6">
        
        {/* Main Content Column */}
        <div className="space-y-6">
           {/* AI Banner */}
           <AISuggestionsBanner onReviewAll={onReviewAISuggestions} />

           {/* Active Campaigns List - Linear Style */}
           <Card className="overflow-hidden border-border/60 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 border-b bg-muted/40">
                <div className="space-y-1">
                  <CardTitle className="text-base font-semibold">Active Campaigns</CardTitle>
                </div>
                <Button variant="ghost" size="sm" className="text-xs h-7">
                  View All <ArrowUpRight className="ml-1 w-3 h-3" />
                </Button>
              </CardHeader>
              <div className="divide-y divide-border/50">
                {campaigns.map((campaign) => (
                  <CampaignRow
                    key={campaign.id}
                    campaign={campaign}
                    onViewDetails={onViewCampaignDetails}
                  />
                ))}
                {campaigns.length === 0 && (
                  <div className="p-8 text-center text-muted-foreground text-sm">
                    No active campaigns. Start one to begin capturing knowledge.
                  </div>
                )}
              </div>
           </Card>
           
           {/* Recent Activity Section (Placeholder) */}
           <Card className="border-border/60 shadow-sm">
              <CardHeader className="p-4 border-b bg-muted/40">
                 <CardTitle className="text-base font-semibold">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                 <div className="divide-y divide-border/50">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="p-4 flex items-start gap-3 text-sm hover:bg-muted/20 transition-colors">
                         <div className="w-2 h-2 mt-1.5 rounded-full bg-blue-500 shrink-0" />
                         <div className="flex-1">
                            <span className="font-medium">Michael Chen</span> completed <span className="text-muted-foreground">Session {10-i}</span>
                            <div className="text-xs text-muted-foreground mt-0.5">2 hours ago</div>
                         </div>
                      </div>
                    ))}
                 </div>
              </CardContent>
           </Card>
        </div>

        {/* Sidebar Column */}
        <div className="space-y-6">
          {/* Tasks Widget */}
          <TaskList tasks={tasks} onTaskToggle={onTaskToggle} />
          
          {/* Quick Actions / Context */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2">
              <Button variant="outline" size="sm" className="w-full justify-start">
                 <CalendarClock className="mr-2 h-4 w-4" /> Schedule Session
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start">
                 <Briefcase className="mr-2 h-4 w-4" /> Review Skills Map
              </Button>
            </CardContent>
          </Card>

          {/* Mini Knowledge Graph Promo */}
          <Card className="overflow-hidden bg-gradient-to-br from-primary/5 via-transparent to-transparent border-primary/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Knowledge Graph
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="aspect-video bg-muted/50 rounded-md mb-4 flex items-center justify-center border border-dashed border-primary/20 relative overflow-hidden group cursor-pointer" onClick={() => setShowGraph(true)}>
                 <div className="absolute inset-0 opacity-[0.1]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, black 1px, transparent 0)', backgroundSize: '10px 10px' }}></div>
                 <Activity className="w-8 h-8 text-primary/40 relative z-10 group-hover:scale-110 transition-transform" />
                 <div className="absolute inset-0 bg-background/0 group-hover:bg-background/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <ZoomIn className="w-6 h-6 text-primary" />
                 </div>
              </div>
              <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
                47 new nodes added this week. Your graph is becoming a powerful asset.
              </p>
              <Button variant="outline" size="sm" className="w-full bg-background/50 backdrop-blur-sm" onClick={() => setShowGraph(true)}>
                Explore Graph
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <Modal
        isOpen={showGraph}
        onClose={() => setShowGraph(false)}
        title="Knowledge Graph Explorer"
        className="max-w-4xl"
      >
        <KnowledgeGraphView />
      </Modal>
    </Container>
  );
}
