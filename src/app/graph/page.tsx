'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Loader2, Lightbulb, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KnowledgeItem {
  id: string;
  title: string;
  insight: string;
  type: string;
  expertName: string;
  campaignId: string;
}

interface Connection {
  id: string;
  sourceId: string;
  targetId: string;
  relationship: string;
}

export default function GraphPage() {
  const [items, setItems] = useState<KnowledgeItem[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<KnowledgeItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const supabase = useMemo(() => createClient(), []);

  const fetchData = useCallback(async () => {
    setIsLoading(true);

    const [nodesResult, edgesResult] = await Promise.all([
      supabase
        .from('graph_nodes')
        .select(`
          id,
          label,
          type,
          description,
          campaign_id,
          campaigns (expert_name)
        `)
        .is('deleted_at', null)
        .order('created_at', { ascending: false }),
      supabase
        .from('graph_edges')
        .select('id, source_node_id, target_node_id, relationship')
        .is('deleted_at', null),
    ]);

    if (nodesResult.data) {
      setItems(nodesResult.data.map(n => ({
        id: n.id,
        title: n.label,
        insight: n.description || '',
        type: n.type,
        expertName: (n.campaigns as { expert_name: string } | null)?.expert_name || 'Unknown',
        campaignId: n.campaign_id,
      })));
    }

    if (edgesResult.data) {
      setConnections(edgesResult.data.map(e => ({
        id: e.id,
        sourceId: e.source_node_id,
        targetId: e.target_node_id,
        relationship: e.relationship,
      })));
    }

    setIsLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Group by expert
  const itemsByExpert = useMemo(() => {
    const grouped: Record<string, KnowledgeItem[]> = {};
    items.forEach(item => {
      if (!grouped[item.expertName]) {
        grouped[item.expertName] = [];
      }
      grouped[item.expertName].push(item);
    });
    return grouped;
  }, [items]);

  // Filter by search
  const filteredByExpert = useMemo(() => {
    if (!searchQuery.trim()) return itemsByExpert;

    const query = searchQuery.toLowerCase();
    const filtered: Record<string, KnowledgeItem[]> = {};

    Object.entries(itemsByExpert).forEach(([expert, expertItems]) => {
      const matching = expertItems.filter(item =>
        item.title.toLowerCase().includes(query) ||
        item.insight.toLowerCase().includes(query)
      );
      if (matching.length > 0) {
        filtered[expert] = matching;
      }
    });

    return filtered;
  }, [itemsByExpert, searchQuery]);

  const getRelatedItems = (itemId: string) => {
    return connections
      .filter(c => c.sourceId === itemId || c.targetId === itemId)
      .map(conn => {
        const relatedId = conn.sourceId === itemId ? conn.targetId : conn.sourceId;
        return items.find(i => i.id === relatedId);
      })
      .filter(Boolean) as KnowledgeItem[];
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const totalItems = Object.values(filteredByExpert).flat().length;

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold mb-1">Captured Knowledge</h1>
        <p className="text-muted-foreground">
          {items.length} insights from {Object.keys(itemsByExpert).length} experts
        </p>
      </div>

      {/* Search */}
      <div className="mb-6 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search insights..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20"
        />
      </div>

      {/* Knowledge Cards */}
      {totalItems === 0 ? (
        <div className="text-center py-12 border rounded-lg bg-card">
          <Lightbulb className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" />
          <p className="text-muted-foreground mb-2">
            {searchQuery ? 'No matching insights' : 'No knowledge captured yet'}
          </p>
          <p className="text-sm text-muted-foreground">
            {searchQuery ? 'Try a different search term' : 'Complete capture sessions to build your knowledge base.'}
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(filteredByExpert).map(([expertName, expertItems]) => (
            <div key={expertName}>
              {/* Expert Header */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center font-medium text-sm">
                  {expertName.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <h2 className="font-medium">{expertName}</h2>
                  <p className="text-sm text-muted-foreground">{expertItems.length} insights</p>
                </div>
              </div>

              {/* Insights */}
              <div className="grid gap-3">
                {expertItems.map(item => {
                  const isSelected = selectedItem?.id === item.id;
                  const relatedItems = getRelatedItems(item.id);

                  return (
                    <div
                      key={item.id}
                      className={cn(
                        "p-4 border rounded-lg bg-card cursor-pointer transition-all",
                        isSelected ? "ring-2 ring-foreground border-foreground" : "hover:border-foreground/30"
                      )}
                      onClick={() => setSelectedItem(isSelected ? null : item)}
                    >
                      <div className="flex items-start gap-3">
                        <Lightbulb className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium mb-1">{item.title}</p>
                          <p className="text-sm text-muted-foreground">{item.insight}</p>

                          {/* Related items when selected */}
                          {isSelected && relatedItems.length > 0 && (
                            <div className="mt-4 pt-4 border-t">
                              <p className="text-xs text-muted-foreground uppercase font-medium mb-2">Related</p>
                              <div className="space-y-2">
                                {relatedItems.map(related => (
                                  <button
                                    key={related.id}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedItem(related);
                                    }}
                                    className="block w-full text-left p-2 rounded bg-secondary/50 hover:bg-secondary text-sm"
                                  >
                                    <span className="font-medium">{related.title}</span>
                                    <span className="text-muted-foreground"> — {related.insight.substring(0, 60)}...</span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
