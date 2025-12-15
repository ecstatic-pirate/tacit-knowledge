'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, Move, RefreshCw, Loader2, Network, Info } from 'lucide-react';
import { useKnowledgeGraph, KnowledgeNode } from '@/lib/hooks';
import { cn } from '@/lib/utils';

interface KnowledgeGraphViewProps {
  campaignId?: string;
}

// Node type styling
const nodeStyles: Record<KnowledgeNode['type'], { fill: string; size: number; pulse?: boolean }> = {
  core: { fill: 'fill-primary', size: 20, pulse: true },
  system: { fill: 'fill-amber-500', size: 18, pulse: true },
  skill: { fill: 'fill-blue-500', size: 14 },
  process: { fill: 'fill-violet-500', size: 14 },
  concept: { fill: 'fill-emerald-500', size: 12 },
};

// Relationship colors
const relationshipColors: Record<string, string> = {
  requires: 'stroke-red-400',
  enables: 'stroke-emerald-400',
  related_to: 'stroke-blue-400',
  part_of: 'stroke-amber-400',
  default: 'stroke-border',
};

export function KnowledgeGraphView({ campaignId }: KnowledgeGraphViewProps) {
  const { nodes, edges, isLoading, error, updateNodePosition, refresh } = useKnowledgeGraph(campaignId);
  const [scale, setScale] = useState(1);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<KnowledgeNode | null>(null);
  const [draggingNode, setDraggingNode] = useState<string | null>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const svgRef = useRef<SVGSVGElement>(null);

  // Handle drag start
  const handleMouseDown = useCallback((e: React.MouseEvent, node: KnowledgeNode) => {
    e.preventDefault();
    setDraggingNode(node.id);
    const svg = svgRef.current;
    if (!svg) return;

    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const svgP = pt.matrixTransform(svg.getScreenCTM()?.inverse());

    setOffset({
      x: svgP.x / scale - node.x,
      y: svgP.y / scale - node.y,
    });
  }, [scale]);

  // Handle drag move
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!draggingNode) return;

    const svg = svgRef.current;
    if (!svg) return;

    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const svgP = pt.matrixTransform(svg.getScreenCTM()?.inverse());

    const newX = svgP.x / scale - offset.x;
    const newY = svgP.y / scale - offset.y;

    // Update position locally for smooth dragging
    updateNodePosition(draggingNode, newX, newY);
  }, [draggingNode, offset, scale, updateNodePosition]);

  // Handle drag end
  const handleMouseUp = useCallback(() => {
    setDraggingNode(null);
  }, []);

  // Handle node click
  const handleNodeClick = useCallback((node: KnowledgeNode) => {
    if (!draggingNode) {
      setSelectedNode(selectedNode?.id === node.id ? null : node);
    }
  }, [draggingNode, selectedNode]);

  // Loading state
  if (isLoading) {
    return (
      <div className="relative w-full h-[600px] bg-background rounded-xl border overflow-hidden flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Loading knowledge graph...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="relative w-full h-[600px] bg-background rounded-xl border overflow-hidden flex items-center justify-center">
        <div className="text-center">
          <Network className="w-8 h-8 text-red-500 mx-auto mb-2" />
          <p className="text-sm text-red-500 mb-2">Failed to load graph</p>
          <Button variant="outline" size="sm" onClick={refresh}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  // Empty state
  if (nodes.length === 0) {
    return (
      <div className="relative w-full h-[600px] bg-background rounded-xl border overflow-hidden flex items-center justify-center">
        <div className="text-center max-w-sm">
          <Network className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-semibold mb-2">No Knowledge Graph Yet</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Complete interview sessions to automatically build your knowledge graph.
            The AI will extract concepts and relationships from your conversations.
          </p>
          <Button variant="outline" size="sm" onClick={refresh}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[600px] bg-background rounded-xl border overflow-hidden group">
      {/* Toolbar */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2 bg-background/80 backdrop-blur-sm p-1 rounded-md border shadow-sm">
        <Button variant="ghost" size="icon" onClick={() => setScale(s => Math.min(s + 0.1, 2))}>
          <ZoomIn className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => setScale(s => Math.max(s - 0.1, 0.5))}>
          <ZoomOut className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={refresh}>
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-10 bg-background/80 backdrop-blur-sm p-3 rounded-md border shadow-sm text-xs space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-primary" />
          <span className="font-medium">Core System</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-amber-500" />
          <span className="font-medium">System</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500" />
          <span className="font-medium">Skill</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-violet-500" />
          <span className="font-medium">Process</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-emerald-500" />
          <span className="font-medium">Concept</span>
        </div>
        <div className="text-muted-foreground mt-2 pt-2 border-t">
          {nodes.length} nodes · {edges.length} connections
        </div>
      </div>

      {/* Selected Node Details */}
      {selectedNode && (
        <div className="absolute top-4 left-4 z-10 bg-background/95 backdrop-blur-sm p-4 rounded-md border shadow-lg max-w-xs">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="text-xs text-muted-foreground uppercase font-medium mb-1">
                {selectedNode.type}
              </div>
              <h4 className="font-semibold">{selectedNode.label}</h4>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0"
              onClick={() => setSelectedNode(null)}
            >
              ×
            </Button>
          </div>
          {selectedNode.description && (
            <p className="text-sm text-muted-foreground mt-2">
              {selectedNode.description}
            </p>
          )}
          <div className="text-xs text-muted-foreground mt-3 pt-2 border-t">
            {selectedNode.connections.length} connections
          </div>
        </div>
      )}

      {/* SVG Canvas */}
      <svg
        ref={svgRef}
        className="w-full h-full cursor-grab active:cursor-grabbing"
        viewBox="0 0 800 600"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <g transform={`scale(${scale}) translate(${(800 * (1 - scale)) / 2 / scale}, ${(600 * (1 - scale)) / 2 / scale})`}>
          {/* Grid */}
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="var(--border)" strokeWidth="0.5" opacity="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />

          {/* Edges */}
          {edges.map((edge) => {
            const sourceNode = nodes.find((n) => n.id === edge.source);
            const targetNode = nodes.find((n) => n.id === edge.target);
            if (!sourceNode || !targetNode) return null;

            const isHighlighted = hoveredNode && (hoveredNode === edge.source || hoveredNode === edge.target);
            const strokeClass = relationshipColors[edge.relationship] || relationshipColors.default;

            return (
              <g key={edge.id}>
                <line
                  x1={sourceNode.x}
                  y1={sourceNode.y}
                  x2={targetNode.x}
                  y2={targetNode.y}
                  className={cn(strokeClass, 'transition-opacity duration-300')}
                  strokeWidth={isHighlighted ? 2 : 1}
                  opacity={isHighlighted ? 1 : 0.3}
                />
                {/* Edge label on hover */}
                {isHighlighted && (
                  <text
                    x={(sourceNode.x + targetNode.x) / 2}
                    y={(sourceNode.y + targetNode.y) / 2 - 5}
                    textAnchor="middle"
                    className="text-[8px] fill-muted-foreground select-none pointer-events-none"
                  >
                    {edge.relationship.replace('_', ' ')}
                  </text>
                )}
              </g>
            );
          })}

          {/* Nodes */}
          {nodes.map((node) => {
            const style = nodeStyles[node.type] || nodeStyles.concept;
            const isHovered = hoveredNode === node.id;
            const isSelected = selectedNode?.id === node.id;

            return (
              <g
                key={node.id}
                transform={`translate(${node.x}, ${node.y})`}
                onMouseEnter={() => setHoveredNode(node.id)}
                onMouseLeave={() => setHoveredNode(null)}
                onMouseDown={(e) => handleMouseDown(e, node)}
                onClick={() => handleNodeClick(node)}
                className={cn(
                  'transition-transform duration-150 cursor-pointer',
                  draggingNode === node.id && 'cursor-grabbing'
                )}
              >
                {/* Pulse Effect for Core/System Nodes */}
                {style.pulse && (
                  <circle
                    r={style.size + 10}
                    className="fill-primary/10 animate-pulse"
                  />
                )}

                {/* Selection ring */}
                {isSelected && (
                  <circle
                    r={style.size + 4}
                    className="fill-none stroke-primary stroke-2"
                  />
                )}

                {/* Node Circle */}
                <circle
                  r={style.size}
                  className={cn(
                    style.fill,
                    'transition-all duration-300',
                    (isHovered || isSelected) && 'stroke-2 stroke-white/50'
                  )}
                />

                {/* Label */}
                <text
                  y={style.size + 12}
                  textAnchor="middle"
                  className={cn(
                    'text-[10px] font-medium fill-foreground select-none pointer-events-none',
                    (isHovered || isSelected) && 'font-bold'
                  )}
                >
                  {node.label}
                </text>
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}
