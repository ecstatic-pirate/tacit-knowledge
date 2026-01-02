'use client';

import React, { useState, useMemo } from 'react';
import { CaretDown } from 'phosphor-react';
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

type LayoutType = 'hierarchical' | 'radial' | 'linear' | 'mindmap' | 'forcedirected' | 'swimlane';

interface GraphLayoutVisualizerProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  title?: string;
  defaultLayout?: LayoutType;
}

// Color mapping for node types
const nodeColors: Record<GraphNode['type'], string> = {
  core: '#ef4444',      // red
  system: '#f59e0b',    // amber
  process: '#8b5cf6',   // violet
  skill: '#3b82f6',     // blue
  concept: '#10b981',   // emerald
};

const nodeLabels: Record<GraphNode['type'], string> = {
  core: 'Core',
  system: 'System',
  process: 'Process',
  skill: 'Skill',
  concept: 'Concept',
};

const relationshipIcons: Record<GraphEdge['relationship'], string> = {
  requires: '→',
  enables: '⇒',
  related_to: '↔',
  part_of: '⊂',
};

export function GraphLayoutVisualizer({
  nodes,
  edges,
  title = 'Knowledge Graph',
  defaultLayout = 'hierarchical',
}: GraphLayoutVisualizerProps) {
  const [selectedLayout, setSelectedLayout] = useState<LayoutType>(defaultLayout);

  // Calculate positions based on layout type
  const positions = useMemo(() => {
    const positions: Record<string, { x: number; y: number }> = {};
    const nodeCount = nodes.length;

    switch (selectedLayout) {
      case 'hierarchical': {
        // Top-down hierarchical layout
        const levels: string[][] = [];
        const visited = new Set<string>();

        // Find root nodes (no incoming edges)
        const roots = nodes.filter(n => !edges.some(e => e.targetId === n.id));
        if (roots.length === 0) {
          // Fallback: use all nodes
          nodes.forEach((n, i) => {
            positions[n.id] = {
              x: (i % 3) * 150 + 50,
              y: Math.floor(i / 3) * 80 + 50,
            };
          });
        } else {
          roots.forEach((n, i) => {
            positions[n.id] = {
              x: 150,
              y: i * 100 + 50,
            };
            visited.add(n.id);
          });

          // BFS to position other nodes
          let currentY = 150;
          edges.forEach(edge => {
            if (visited.has(edge.sourceId) && !visited.has(edge.targetId)) {
              positions[edge.targetId] = {
                x: 350,
                y: currentY,
              };
              visited.add(edge.targetId);
              currentY += 80;
            }
          });
        }
        break;
      }

      case 'radial': {
        // Center node positioned in middle, others around it
        const centerNode = nodes.find(n => n.type === 'core') || nodes[0];
        if (centerNode) {
          positions[centerNode.id] = { x: 250, y: 200 };
        }

        const otherNodes = nodes.filter(n => n.id !== centerNode?.id);
        const angle = (Math.PI * 2) / Math.max(otherNodes.length, 1);
        const radius = 150;

        otherNodes.forEach((n, i) => {
          positions[n.id] = {
            x: 250 + radius * Math.cos(i * angle),
            y: 200 + radius * Math.sin(i * angle),
          };
        });
        break;
      }

      case 'linear': {
        // Left to right flow
        const levels: Set<string>[] = [];
        const inDegree: Record<string, number> = {};
        nodes.forEach(n => {
          inDegree[n.id] = edges.filter(e => e.targetId === n.id).length;
        });

        let currentLevel = 0;
        let processed = new Set<string>();

        while (processed.size < nodes.length) {
          const levelNodes = nodes.filter(
            n => !processed.has(n.id) && inDegree[n.id] === 0
          );

          if (levelNodes.length === 0) break;

          levelNodes.forEach((n, i) => {
            positions[n.id] = {
              x: currentLevel * 120 + 50,
              y: (i * 100) + 50,
            };
            processed.add(n.id);
          });

          // Decrease in-degree for next level
          levelNodes.forEach(n => {
            edges
              .filter(e => e.sourceId === n.id)
              .forEach(e => {
                inDegree[e.targetId]--;
              });
          });

          currentLevel++;
        }
        break;
      }

      case 'mindmap': {
        // Tree structure from center
        const centerNode = nodes[0];
        positions[centerNode.id] = { x: 200, y: 200 };

        let yOffset = 100;
        nodes.slice(1).forEach((n, i) => {
          const isLeft = i % 2 === 0;
          positions[n.id] = {
            x: isLeft ? 50 : 350,
            y: yOffset + (i * 60),
          };
        });
        break;
      }

      case 'forcedirected': {
        // Random initial positions (force-directed would need D3/similar)
        nodes.forEach((n, i) => {
          positions[n.id] = {
            x: Math.random() * 400 + 25,
            y: Math.random() * 350 + 25,
          };
        });
        break;
      }

      case 'swimlane': {
        // Group by type in horizontal lanes
        const typeOrder: GraphNode['type'][] = ['system', 'process', 'skill', 'concept', 'core'];
        const nodesByType: Record<GraphNode['type'], GraphNode[]> = {
          core: [],
          system: [],
          process: [],
          skill: [],
          concept: [],
        };

        nodes.forEach(n => {
          nodesByType[n.type].push(n);
        });

        let yOffset = 0;
        typeOrder.forEach(type => {
          const typeNodes = nodesByType[type];
          const laneHeight = 100;

          typeNodes.forEach((n, i) => {
            positions[n.id] = {
              x: (i * 120) + 50,
              y: yOffset + laneHeight / 2,
            };
          });

          yOffset += laneHeight;
        });
        break;
      }
    }

    return positions;
  }, [nodes, edges, selectedLayout]);

  const SVGView = () => {
    const width = 500;
    const height = 600;
    const padding = 40;

    return (
      <svg width={width} height={height} className="border border-border rounded-lg bg-card">
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="10"
            refX="9"
            refY="3"
            orient="auto"
          >
            <polygon points="0 0, 10 3, 0 6" fill="#6b7280" />
          </marker>
        </defs>

        {/* Edges */}
        {edges.map(edge => {
          const source = positions[edge.sourceId];
          const target = positions[edge.targetId];
          if (!source || !target) return null;

          return (
            <g key={edge.id}>
              <line
                x1={source.x}
                y1={source.y}
                x2={target.x}
                y2={target.y}
                stroke="#d1d5db"
                strokeWidth="2"
                markerEnd="url(#arrowhead)"
              />
              <text
                x={(source.x + target.x) / 2}
                y={(source.y + target.y) / 2}
                fontSize="11"
                fill="#9ca3af"
                textAnchor="middle"
              >
                {relationshipIcons[edge.relationship]}
              </text>
            </g>
          );
        })}

        {/* Nodes */}
        {nodes.map(node => {
          const pos = positions[node.id];
          if (!pos) return null;

          const color = nodeColors[node.type];
          const nodeSize = node.type === 'core' ? 50 : 40;

          return (
            <g key={node.id}>
              <circle
                cx={pos.x}
                cy={pos.y}
                r={nodeSize / 2}
                fill={color}
                opacity="0.1"
                stroke={color}
                strokeWidth="2"
              />
              <circle
                cx={pos.x}
                cy={pos.y}
                r={nodeSize / 2 - 6}
                fill={color}
                opacity="0.8"
              />
              <text
                x={pos.x}
                y={pos.y}
                fontSize="11"
                fill="white"
                textAnchor="middle"
                dominantBaseline="middle"
                fontWeight="bold"
                className="pointer-events-none"
              >
                {node.label.length > 12 ? node.label.substring(0, 10) + '...' : node.label}
              </text>
            </g>
          );
        })}
      </svg>
    );
  };

  const TextualView = () => {
    switch (selectedLayout) {
      case 'hierarchical':
        return (
          <div className="space-y-4 text-sm font-mono p-4 bg-card border border-border rounded-lg overflow-x-auto">
            <div>Customer Loyalty Program (CORE)</div>
            <div className="ml-4">├─ Barista Training (SKILL)</div>
            <div className="ml-4">├─ Single-Origin Sourcing (SKILL)</div>
            <div className="ml-8">└─ Seasonal Menu Planning (PROCESS)</div>
            <div className="ml-4">└─ Preventive Maintenance (PROCESS)</div>
            <div className="ml-8">└─ Espresso Machine (SYSTEM)</div>
          </div>
        );
      case 'radial':
        return (
          <div className="space-y-2 text-sm p-4 bg-card border border-border rounded-lg">
            <div className="text-center font-semibold mb-4">Customer Loyalty (HUB)</div>
            <div className="grid grid-cols-2 gap-4">
              <div>Barista Training</div>
              <div>Single-Origin</div>
              <div>Espresso Machine</div>
              <div>Seasonal Menu</div>
            </div>
          </div>
        );
      case 'linear':
        return (
          <div className="space-y-3 text-sm p-4 bg-card border border-border rounded-lg overflow-x-auto">
            <div className="flex gap-4">
              <div className="border px-3 py-2 rounded">Espresso Machine</div>
              <div>→</div>
              <div className="border px-3 py-2 rounded">Preventive Maintenance</div>
              <div>→</div>
              <div className="border px-3 py-2 rounded">Barista Training</div>
              <div>→</div>
              <div className="border px-3 py-2 rounded">Customer Loyalty</div>
            </div>
          </div>
        );
      case 'swimlane':
        return (
          <div className="space-y-3 text-sm p-4 bg-card border border-border rounded-lg">
            <div className="border-t-2 border-amber-500 pt-2">
              <div className="font-semibold mb-2 text-amber-600">System</div>
              <div>Espresso Machine</div>
            </div>
            <div className="border-t-2 border-violet-500 pt-2">
              <div className="font-semibold mb-2 text-violet-600">Process</div>
              <div>Preventive Maintenance, Seasonal Menu Planning</div>
            </div>
            <div className="border-t-2 border-blue-500 pt-2">
              <div className="font-semibold mb-2 text-blue-600">Skill</div>
              <div>Barista Training, Single-Origin Sourcing</div>
            </div>
            <div className="border-t-2 border-red-500 pt-2">
              <div className="font-semibold mb-2 text-red-600">Core</div>
              <div>Customer Loyalty Program</div>
            </div>
          </div>
        );
      case 'mindmap':
        return (
          <div className="space-y-2 text-sm font-mono p-4 bg-card border border-border rounded-lg overflow-x-auto">
            <div>Customer Loyalty Program</div>
            <div className="ml-6">├─ Barista Training Program</div>
            <div className="ml-6">├─ Single-Origin Sourcing</div>
            <div className="ml-12">└─ Seasonal Menu Planning</div>
            <div className="ml-6">├─ Preventive Maintenance</div>
            <div className="ml-12">└─ Espresso Machine</div>
            <div className="ml-6">└─ Staff Scheduling</div>
          </div>
        );
      default:
        return (
          <div className="text-sm p-4 bg-card border border-border rounded-lg">
            Force-directed layout (requires rendering library)
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with dropdown */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{title}</h3>
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
            <option value="hierarchical">Hierarchical (Top-Down)</option>
            <option value="radial">Radial (Hub & Spoke)</option>
            <option value="linear">Linear (Flow)</option>
            <option value="mindmap">Mind Map</option>
            <option value="forcedirected">Force-Directed</option>
            <option value="swimlane">Swimlane (By Type)</option>
          </select>
          <CaretDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none text-muted-foreground" weight="bold" />
        </div>
      </div>

      {/* Visualization */}
      {selectedLayout === 'forcedirected' ? (
        <TextualView />
      ) : (
        <>
          <SVGView />
          <TextualView />
        </>
      )}

      {/* Legend */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
        {Object.entries(nodeLabels).map(([type, label]) => (
          <div key={type} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: nodeColors[type as GraphNode['type']] }}
            />
            <span className="text-muted-foreground">{label}</span>
          </div>
        ))}
      </div>

      {/* Relationships legend */}
      <div className="grid grid-cols-2 gap-3 text-xs border-t border-border pt-4">
        {Object.entries(relationshipIcons).map(([rel, icon]) => (
          <div key={rel} className="flex items-center gap-2">
            <span className="font-mono">{icon}</span>
            <span className="text-muted-foreground capitalize">{rel.replace('_', ' ')}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
