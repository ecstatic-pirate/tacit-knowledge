'use client';

import React, { useState, useMemo } from 'react';
import { CaretDown, X, ArrowRight } from 'phosphor-react';
import { cn } from '@/lib/utils';

export interface GraphNode {
  id: string;
  label: string;
  type: 'core' | 'system' | 'process' | 'skill' | 'concept';
  description?: string;
}

export interface GraphEdge {
  id: string;
  sourceId: string;
  targetId: string;
  relationship: 'requires' | 'enables' | 'related_to' | 'part_of';
}

type LayoutType = 'hierarchical' | 'radial' | 'linear';

interface KnowledgeGraphExplorerProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

// Color mapping for node types
const nodeColors: Record<GraphNode['type'], { bg: string; text: string; border: string }> = {
  core: { bg: '#fee2e2', text: '#dc2626', border: '#991b1b' },      // red
  system: { bg: '#fef3c7', text: '#d97706', border: '#92400e' },    // amber
  process: { bg: '#ede9fe', text: '#7c3aed', border: '#5b21b6' },   // violet
  skill: { bg: '#dbeafe', text: '#2563eb', border: '#1e40af' },     // blue
  concept: { bg: '#d1fae5', text: '#059669', border: '#065f46' },   // emerald
};

const nodeLabels: Record<GraphNode['type'], string> = {
  core: 'Core Outcome',
  system: 'System/Tool',
  process: 'Process',
  skill: 'Skill',
  concept: 'Concept',
};

const relationshipLabels: Record<GraphEdge['relationship'], string> = {
  requires: 'Requires',
  enables: 'Enables',
  related_to: 'Related to',
  part_of: 'Part of',
};

export function KnowledgeGraphExplorer({ nodes, edges }: KnowledgeGraphExplorerProps) {
  const [selectedLayout, setSelectedLayout] = useState<LayoutType>('hierarchical');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  const selectedNode = selectedNodeId ? nodes.find(n => n.id === selectedNodeId) : null;

  // Get related nodes
  const relatedConnections = useMemo(() => {
    if (!selectedNodeId) return [];
    return edges.filter(e => e.sourceId === selectedNodeId || e.targetId === selectedNodeId);
  }, [selectedNodeId, edges]);

  const relatedNodes = useMemo(() => {
    return relatedConnections.map(conn => ({
      node: nodes.find(n => n.id === (conn.sourceId === selectedNodeId ? conn.targetId : conn.sourceId))!,
      relationship: conn.relationship,
      direction: conn.sourceId === selectedNodeId ? 'outgoing' : 'incoming',
    }));
  }, [relatedConnections, selectedNodeId, nodes]);

  // Calculate positions based on layout
  const positions = useMemo(() => {
    const positions: Record<string, { x: number; y: number }> = {};

    if (selectedLayout === 'hierarchical') {
      // Find core node
      const coreNode = nodes.find(n => n.type === 'core');
      if (coreNode) {
        positions[coreNode.id] = { x: 300, y: 50 };
      }

      // Position others by type
      let yOffset = 180;
      const types: GraphNode['type'][] = ['system', 'process', 'skill', 'concept'];

      types.forEach(type => {
        const typeNodes = nodes.filter(n => n.type === type && n.id !== coreNode?.id);
        typeNodes.forEach((node, i) => {
          positions[node.id] = {
            x: 50 + (i % 2) * 220,
            y: yOffset,
          };
        });
        yOffset += 120;
      });
    } else if (selectedLayout === 'radial') {
      const coreNode = nodes.find(n => n.type === 'core') || nodes[0];
      if (coreNode) {
        positions[coreNode.id] = { x: 300, y: 250 };
      }

      const otherNodes = nodes.filter(n => n.id !== coreNode?.id);
      const angle = (Math.PI * 2) / Math.max(otherNodes.length, 1);
      const radius = 200;

      otherNodes.forEach((n, i) => {
        positions[n.id] = {
          x: 300 + radius * Math.cos(i * angle),
          y: 250 + radius * Math.sin(i * angle),
        };
      });
    } else {
      // Linear layout
      let xOffset = 30;
      nodes.forEach(node => {
        positions[node.id] = {
          x: xOffset,
          y: 250,
        };
        xOffset += 180;
      });
    }

    return positions;
  }, [nodes, selectedLayout]);

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Knowledge Graph Explorer</h3>
        <div className="relative">
          <select
            value={selectedLayout}
            onChange={(e) => setSelectedLayout(e.target.value as LayoutType)}
            className={cn(
              'appearance-none px-4 py-2 pr-10 border border-border rounded-lg bg-card',
              'text-sm font-medium cursor-pointer',
              'focus:outline-none focus:ring-2 focus:ring-primary/20'
            )}
          >
            <option value="hierarchical">Hierarchical Layout</option>
            <option value="radial">Radial Layout</option>
            <option value="linear">Linear Layout</option>
          </select>
          <CaretDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none text-muted-foreground" weight="bold" />
        </div>
      </div>

      {/* Main Content - Split Pane */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Graph Section - Takes 2/3 on desktop */}
        <div className="lg:col-span-2">
          <div className="border border-border rounded-lg bg-card overflow-hidden">
            <svg
              width="100%"
              height="600"
              className="bg-gradient-to-br from-background to-secondary/10"
              viewBox="0 0 600 500"
            >
              <defs>
                <marker
                  id="arrowhead"
                  markerWidth="10"
                  markerHeight="10"
                  refX="9"
                  refY="3"
                  orient="auto"
                >
                  <polygon points="0 0, 10 3, 0 6" fill="#9ca3af" />
                </marker>
                <marker
                  id="arrowhead-hover"
                  markerWidth="10"
                  markerHeight="10"
                  refX="9"
                  refY="3"
                  orient="auto"
                >
                  <polygon points="0 0, 10 3, 0 6" fill="#3b82f6" />
                </marker>
              </defs>

              {/* Edges */}
              {edges.map(edge => {
                const source = positions[edge.sourceId];
                const target = positions[edge.targetId];
                if (!source || !target) return null;

                const isSelected = selectedNodeId && (selectedNodeId === edge.sourceId || selectedNodeId === edge.targetId);

                return (
                  <g key={edge.id}>
                    <line
                      x1={source.x}
                      y1={source.y}
                      x2={target.x}
                      y2={target.y}
                      stroke={isSelected ? '#3b82f6' : '#d1d5db'}
                      strokeWidth={isSelected ? 3 : 2}
                      markerEnd={isSelected ? 'url(#arrowhead-hover)' : 'url(#arrowhead)'}
                      opacity={isSelected ? 1 : 0.6}
                      className="transition-all"
                    />
                  </g>
                );
              })}

              {/* Nodes */}
              {nodes.map(node => {
                const pos = positions[node.id];
                if (!pos) return null;

                const colors = nodeColors[node.type];
                const isSelected = selectedNodeId === node.id;
                const isHovered = hoveredNodeId === node.id;
                const isRelated = selectedNodeId && (selectedNodeId === node.id || relatedNodes.some(r => r.node.id === node.id));
                const nodeSize = node.type === 'core' ? 80 : 60;

                return (
                  <g
                    key={node.id}
                    onClick={() => setSelectedNodeId(isSelected ? null : node.id)}
                    onMouseEnter={() => setHoveredNodeId(node.id)}
                    onMouseLeave={() => setHoveredNodeId(null)}
                    className="cursor-pointer transition-all"
                  >
                    {/* Shadow effect when selected */}
                    {isSelected && (
                      <circle
                        cx={pos.x}
                        cy={pos.y}
                        r={nodeSize / 2 + 8}
                        fill={colors.bg}
                        opacity="0.3"
                      />
                    )}

                    {/* Node circle */}
                    <circle
                      cx={pos.x}
                      cy={pos.y}
                      r={nodeSize / 2}
                      fill={colors.bg}
                      stroke={isSelected || isHovered ? colors.text : colors.border}
                      strokeWidth={isSelected ? 3 : isHovered ? 2 : 1.5}
                      opacity={isRelated || !selectedNodeId ? 1 : 0.4}
                      className="transition-all"
                    />

                    {/* Node label */}
                    <text
                      x={pos.x}
                      y={pos.y}
                      fontSize="13"
                      fontWeight="600"
                      fill={colors.text}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="pointer-events-none"
                    >
                      {node.label.split(' ').map((word, i) => (
                        <tspan key={i} x={pos.x} dy={i === 0 ? '-0.5em' : '1.2em'}>
                          {word.length > 10 ? word.substring(0, 10) : word}
                        </tspan>
                      ))}
                    </text>

                    {/* Type label below node */}
                    <text
                      x={pos.x}
                      y={pos.y + nodeSize / 2 + 16}
                      fontSize="10"
                      fill={colors.text}
                      textAnchor="middle"
                      opacity="0.7"
                      className="pointer-events-none"
                    >
                      {nodeLabels[node.type]}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Legend */}
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-5 gap-3">
            {Object.entries(nodeLabels).map(([type, label]) => {
              const colors = nodeColors[type as GraphNode['type']];
              return (
                <div key={type} className="flex items-center gap-2 text-xs">
                  <div
                    className="w-4 h-4 rounded-full border-2"
                    style={{
                      backgroundColor: colors.bg,
                      borderColor: colors.border,
                    }}
                  />
                  <span className="text-muted-foreground">{label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Details Panel - Takes 1/3 on desktop */}
        <div className="lg:col-span-1">
          {selectedNode ? (
            <div className="border border-border rounded-lg bg-card p-6 space-y-6">
              {/* Header */}
              <div>
                <button
                  onClick={() => setSelectedNodeId(null)}
                  className="float-right p-1 hover:bg-secondary rounded"
                >
                  <X className="w-5 h-5" weight="bold" />
                </button>

                <div
                  className="inline-block px-3 py-1 rounded-full text-xs font-semibold mb-3"
                  style={{
                    backgroundColor: nodeColors[selectedNode.type].bg,
                    color: nodeColors[selectedNode.type].text,
                  }}
                >
                  {nodeLabels[selectedNode.type]}
                </div>

                <h3 className="text-xl font-bold text-foreground">{selectedNode.label}</h3>
                {selectedNode.description && (
                  <p className="text-sm text-muted-foreground mt-2">{selectedNode.description}</p>
                )}
              </div>

              {/* Related Items */}
              {relatedNodes.length > 0 && (
                <div className="space-y-3 border-t border-border pt-4">
                  <div className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                    Connected Knowledge
                  </div>

                  <div className="space-y-3">
                    {relatedNodes.map((item, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedNodeId(item.node.id)}
                        className="w-full text-left p-3 rounded-lg border border-border hover:border-primary/40 hover:bg-primary/5 transition-all group"
                      >
                        <div className="flex items-start gap-2">
                          <div className="mt-1">
                            {item.direction === 'outgoing' ? (
                              <ArrowRight className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" weight="bold" />
                            ) : (
                              <ArrowRight className="w-4 h-4 text-muted-foreground rotate-180 group-hover:scale-110 transition-transform" weight="bold" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-semibold text-muted-foreground mb-1">
                              {item.direction === 'outgoing' ? 'This' : 'Connected to by'}
                            </div>
                            <div className="text-xs font-medium text-primary mb-1">
                              {relationshipLabels[item.relationship]}
                            </div>
                            <div className="text-sm font-medium text-foreground truncate">
                              {item.node.label}
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {relatedNodes.length === 0 && (
                <div className="text-center py-6 text-muted-foreground">
                  <p className="text-sm">No connections found</p>
                </div>
              )}
            </div>
          ) : (
            <div className="border border-dashed border-border rounded-lg bg-secondary/30 p-6 text-center">
              <p className="text-sm text-muted-foreground">
                Click on a node in the graph to explore its connections and details
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
