'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useApp } from '@/context/app-context';
import { Lightbulb, Rows } from 'phosphor-react';
import { cn } from '@/lib/utils';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingState } from '@/components/ui/loading-state';
import { SearchInput } from '@/components/ui/search-input';
import { SectionDivider } from '@/components/ui/section-divider';
import { containers, spacing, components } from '@/lib/design-system';
import { KnowledgeGraphExplorer } from '@/components/visualizations/knowledge-graph-explorer';
import type { GraphNode, GraphEdge } from '@/components/visualizations/knowledge-graph-explorer';

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
  const { isLoading: authLoading, appUser } = useApp();
  const [items, setItems] = useState<KnowledgeItem[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<KnowledgeItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'visualization' | 'list'>('visualization');
  const supabase = useMemo(() => createClient(), []);

  // Log auth state for debugging
  useEffect(() => {
    console.log('[Graph] Auth state changed:', { authLoading, appUser: appUser?.id });
  }, [authLoading, appUser]);

  const fetchData = useCallback(async () => {
    // Wait for auth to be ready before fetching
    if (authLoading) {
      console.log('[Graph] Auth still loading, skipping fetch');
      return;
    }

    console.log('[Graph] Starting data fetch');
    setIsLoading(true);

    try {
      console.log('[Graph] Fetching graph nodes and edges');
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

      if (nodesResult.error) {
        console.error('[Graph] Error fetching nodes:', nodesResult.error);
        setItems([]);
      } else if (nodesResult.data) {
        console.log('[Graph] Fetched nodes:', nodesResult.data.length);
        setItems(nodesResult.data.map(n => ({
          id: n.id,
          title: n.label,
          insight: n.description || '',
          type: n.type,
          expertName: (n.campaigns as { expert_name: string } | null)?.expert_name || 'Unknown',
          campaignId: n.campaign_id,
        })));
      } else {
        console.log('[Graph] No nodes data returned');
        setItems([]);
      }

      if (edgesResult.error) {
        console.error('[Graph] Error fetching edges:', edgesResult.error);
        setConnections([]);
      } else if (edgesResult.data) {
        console.log('[Graph] Fetched edges:', edgesResult.data.length);
        setConnections(edgesResult.data.map(e => ({
          id: e.id,
          sourceId: e.source_node_id,
          targetId: e.target_node_id,
          relationship: e.relationship,
        })));
      } else {
        console.log('[Graph] No edges data returned');
        setConnections([]);
      }
      console.log('[Graph] Data fetch completed successfully');
    } catch (error) {
      console.error('[Graph] Exception during fetch:', error);
      setItems([]);
      setConnections([]);
    } finally {
      setIsLoading(false);
    }
  }, [supabase, authLoading]);

  useEffect(() => {
    if (!authLoading) {
      console.log('[Graph] Auth ready, fetching data');
      fetchData();
    }
  }, [fetchData, authLoading]);

  // Safety timeout: if still loading after 5 seconds, show empty state
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (isLoading) {
        console.warn('[Graph] Data fetch timeout after 5s, showing empty state');
        setIsLoading(false);
        setItems([]);
        setConnections([]);
      }
    }, 5000);

    return () => clearTimeout(timeout);
  }, [isLoading]);

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
      <div className={containers.pageContainer}>
        <div className={containers.pageInner}>
          <LoadingState />
        </div>
      </div>
    );
  }

  const totalItems = Object.values(filteredByExpert).flat().length;
  const expertCount = Object.keys(itemsByExpert).length;

  // Convert to graph nodes and edges for visualization
  const graphNodes: GraphNode[] = items.map(item => ({
    id: item.id,
    label: item.title,
    type: (item.type as GraphNode['type']) || 'concept',
    description: item.insight,
  }));

  const graphEdges: GraphEdge[] = connections.map(conn => ({
    id: conn.id,
    sourceId: conn.sourceId,
    targetId: conn.targetId,
    relationship: (conn.relationship as GraphEdge['relationship']) || 'related_to',
  }));

  return (
    <div className={containers.pageContainer}>
      <div className={containers.wideContainer}>
        <div className="flex items-start justify-between gap-4 mb-8">
          <PageHeader
            title="Captured Knowledge"
            subtitle={
              items.length === 0
                ? 'Your knowledge base will appear here as you capture expert insights'
                : `${items.length} insight${items.length !== 1 ? 's' : ''} from ${expertCount} expert${expertCount !== 1 ? 's' : ''}`
            }
          />
          {items.length > 0 && (
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('visualization')}
                className={cn(
                  'px-4 py-2 rounded-lg font-medium text-sm transition-colors',
                  viewMode === 'visualization'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-muted-foreground hover:text-foreground'
                )}
              >
                Visualize
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  'px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center gap-2',
                  viewMode === 'list'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-muted-foreground hover:text-foreground'
                )}
              >
                <Rows className="w-4 h-4" weight="bold" />
                List
              </button>
            </div>
          )}
        </div>

        {/* Search - only show in list view */}
        {items.length > 0 && viewMode === 'list' && (
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search insights..."
            className="mb-8"
          />
        )}

        {/* Empty State */}
        {totalItems === 0 ? (
          <EmptyState
            icon={Lightbulb}
            title={searchQuery ? 'No matching insights' : 'No knowledge captured yet'}
            description={
              searchQuery
                ? 'Try adjusting your search query to find insights'
                : 'Complete capture sessions with your experts to build your knowledge base. Knowledge will appear here once sessions are processed.'
            }
          />
        ) : viewMode === 'visualization' ? (
          // Visualization View
          <div className="space-y-8">
            {graphNodes.length > 0 && (
              <KnowledgeGraphExplorer
                nodes={graphNodes}
                edges={graphEdges}
              />
            )}
          </div>
        ) : (
          // List View
          <div className={spacing.sectionGap}>
          {Object.entries(filteredByExpert).map(([expertName, expertItems]) => (
            <div key={expertName} className="pt-6 first:pt-0">
              {/* Expert Header */}
              <SectionDivider>
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center font-semibold text-sm text-primary">
                  {expertName.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-semibold text-foreground">{expertName}</h2>
                  <p className="text-sm text-muted-foreground">{expertItems.length} captured insight{expertItems.length !== 1 ? 's' : ''}</p>
                </div>
              </SectionDivider>

              {/* Insights */}
              <div className="grid gap-3">
                {expertItems.map(item => {
                  const isSelected = selectedItem?.id === item.id;
                  const relatedItems = getRelatedItems(item.id);

                  return (
                    <div
                      key={item.id}
                      className={cn(
                        "p-4 border rounded-lg cursor-pointer transition-all duration-200",
                        isSelected
                          ? "bg-primary/5 border-primary/40 ring-1 ring-primary/20"
                          : "bg-card border-border hover:border-foreground/20"
                      )}
                      onClick={() => setSelectedItem(isSelected ? null : item)}
                    >
                      <div className="flex items-start gap-3">
                        <Lightbulb className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" weight="bold" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <p className="font-medium text-foreground">{item.title}</p>
                            <span className="text-xs px-2 py-1 rounded-full bg-secondary text-muted-foreground capitalize">
                              {item.type}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2">{item.insight}</p>

                          {/* Related items when selected */}
                          {isSelected && relatedItems.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-border/50">
                              <p className="text-xs text-muted-foreground uppercase font-semibold mb-3 tracking-wide">Connected Insights</p>
                              <div className="space-y-2">
                                {relatedItems.map(related => (
                                  <button
                                    key={related.id}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedItem(related);
                                    }}
                                    className="block w-full text-left p-3 rounded-md bg-secondary/30 hover:bg-secondary/60 text-sm transition-colors"
                                  >
                                    <span className="font-medium text-foreground">{related.title}</span>
                                    <div className="text-xs text-muted-foreground mt-1">{related.insight.substring(0, 70)}</div>
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
    </div>
  );
}
