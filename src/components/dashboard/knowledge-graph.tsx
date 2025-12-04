'use client';

import { Button } from '@/components/ui/button';
import { Network, Share2, ZoomIn } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function KnowledgeGraph() {
  return (
    <Card className="mb-8 overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <div className="p-1.5 rounded-md bg-primary/10 text-primary">
            <Network className="w-4 h-4" />
          </div>
          Knowledge Graph
          <span className="text-xs font-normal text-muted-foreground ml-2">47 nodes</span>
        </CardTitle>
        <Button variant="ghost" size="sm" className="h-8">
          <Share2 className="w-4 h-4 mr-2" />
          Share
        </Button>
      </CardHeader>

      <CardContent className="p-0">
        <div className="relative min-h-[320px] flex items-center justify-center bg-secondary/20 border-t border-b">
          {/* Subtle grid pattern */}
          <div className="absolute inset-0 opacity-[0.4]"
               style={{
                 backgroundImage: 'radial-gradient(#e5e7eb 1px, transparent 1px)',
                 backgroundSize: '24px 24px'
               }}
          />

          <div className="text-center relative z-10 p-8 max-w-md">
            <div className="mx-auto mb-6 bg-background rounded-full p-4 w-16 h-16 flex items-center justify-center shadow-sm border">
               <Network className="w-8 h-8 text-muted-foreground" />
            </div>

            <h3 className="font-semibold text-lg mb-2">
              Interactive Knowledge Graph
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              Visualize interconnected skills and expertise across your organization.
            </p>

            <Button>
              <ZoomIn className="w-4 h-4 mr-2" />
              Explore Full Graph
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
