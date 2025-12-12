'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, Move, Network } from 'lucide-react';

interface Node {
  id: string;
  x: number;
  y: number;
  label: string;
  type: 'core' | 'skill' | 'concept';
  connections: string[];
}

const initialNodes: Node[] = [
  { id: '1', x: 400, y: 300, label: 'Billing System', type: 'core', connections: ['2', '3', '4'] },
  { id: '2', x: 250, y: 200, label: 'Legacy Mainframe', type: 'skill', connections: ['1', '5'] },
  { id: '3', x: 550, y: 200, label: 'Reconciliation', type: 'skill', connections: ['1', '6', '7'] },
  { id: '4', x: 400, y: 450, label: 'Compliance', type: 'concept', connections: ['1', '7'] },
  { id: '5', x: 150, y: 250, label: 'COBOL', type: 'concept', connections: ['2'] },
  { id: '6', x: 650, y: 150, label: 'Audit Logs', type: 'concept', connections: ['3'] },
  { id: '7', x: 500, y: 400, label: 'Dunning', type: 'concept', connections: ['3', '4'] },
  { id: '8', x: 300, y: 100, label: 'Batch Processing', type: 'skill', connections: ['2'] },
];

export function KnowledgeGraphView() {
  const [scale, setScale] = useState(1);
  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  // Simple "physics" or movement simulation (visual only)
  useEffect(() => {
    const interval = setInterval(() => {
      setNodes((prevNodes) =>
        prevNodes.map((node) => ({
          ...node,
          x: node.x + Math.sin(Date.now() / 1000 + parseInt(node.id)) * 0.5,
          y: node.y + Math.cos(Date.now() / 1000 + parseInt(node.id)) * 0.5,
        }))
      );
    }, 50);
    return () => clearInterval(interval);
  }, []);

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
         <Button variant="ghost" size="icon">
           <Move className="w-4 h-4" />
         </Button>
       </div>

       {/* Legend */}
       <div className="absolute bottom-4 left-4 z-10 bg-background/80 backdrop-blur-sm p-3 rounded-md border shadow-sm text-xs space-y-2">
         <div className="flex items-center gap-2">
           <div className="w-3 h-3 rounded-full bg-primary" />
           <span className="font-medium">Core System</span>
         </div>
         <div className="flex items-center gap-2">
           <div className="w-3 h-3 rounded-full bg-blue-500" />
           <span className="font-medium">Skill</span>
         </div>
         <div className="flex items-center gap-2">
           <div className="w-3 h-3 rounded-full bg-emerald-500" />
           <span className="font-medium">Concept</span>
         </div>
       </div>

       <svg className="w-full h-full cursor-grab active:cursor-grabbing" viewBox="0 0 800 600">
         <g transform={`scale(${scale}) translate(${(800 * (1 - scale)) / 2}, ${(600 * (1 - scale)) / 2})`}>
           {/* Grid */}
           <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
             <path d="M 40 0 L 0 0 0 40" fill="none" stroke="var(--border)" strokeWidth="0.5" opacity="0.5"/>
           </pattern>
           <rect width="100%" height="100%" fill="url(#grid)" />

           {/* Connections */}
           {nodes.map((node) =>
             node.connections.map((targetId) => {
               const target = nodes.find((n) => n.id === targetId);
               if (!target) return null;
               return (
                 <line
                   key={`${node.id}-${targetId}`}
                   x1={node.x}
                   y1={node.y}
                   x2={target?.x}
                   y2={target?.y}
                   stroke="currentColor"
                   strokeWidth="1"
                   className="text-border transition-colors duration-300"
                   opacity={hoveredNode && (hoveredNode === node.id || hoveredNode === targetId) ? 1 : 0.3}
                 />
               );
             })
           )}

           {/* Nodes */}
           {nodes.map((node) => (
             <g
               key={node.id}
               transform={`translate(${node.x}, ${node.y})`}
               onMouseEnter={() => setHoveredNode(node.id)}
               onMouseLeave={() => setHoveredNode(null)}
               className="transition-transform duration-300 hover:scale-110 cursor-pointer"
             >
               {/* Pulse Effect for Core Nodes */}
               {node.type === 'core' && (
                 <circle
                   r="30"
                   className="fill-primary/10 animate-pulse"
                 />
               )}
               
               {/* Node Circle */}
               <circle
                 r={node.type === 'core' ? 20 : 12}
                 className={`
                   transition-all duration-300
                   ${node.type === 'core' ? 'fill-primary' : ''}
                   ${node.type === 'skill' ? 'fill-blue-500' : ''}
                   ${node.type === 'concept' ? 'fill-emerald-500' : ''}
                   ${hoveredNode === node.id ? 'stroke-4 stroke-white/50' : 'stroke-0'}
                 `}
               />

               {/* Label */}
               <text
                 y={node.type === 'core' ? 35 : 25}
                 textAnchor="middle"
                 className={`
                   text-[10px] font-medium fill-foreground select-none pointer-events-none
                   ${hoveredNode === node.id ? 'font-bold' : ''}
                 `}
               >
                 {node.label}
               </text>
             </g>
           ))}
         </g>
       </svg>
    </div>
  );
}


