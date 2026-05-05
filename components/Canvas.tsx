import React, { useRef, useState, useEffect } from 'react';
import { GraphData, CanvasState, NodeData } from '../types';
import { User, Building2, MapPin, Calendar, Box, Lightbulb, Trash2 } from 'lucide-react';

interface CanvasProps {
  graph: GraphData;
  onUpdateNodePosition: (id: string, x: number, y: number) => void;
  onDeleteNode: (id: string) => void;
}

const GRID_SIZE = 20;

const getIconForType = (type: string) => {
  switch (type) {
    case 'PERSON': return <User className="w-4 h-4 text-emerald-400" />;
    case 'ORGANIZATION': return <Building2 className="w-4 h-4 text-blue-400" />;
    case 'LOCATION': return <MapPin className="w-4 h-4 text-rose-400" />;
    case 'EVENT': return <Calendar className="w-4 h-4 text-amber-400" />;
    case 'OBJECT': return <Box className="w-4 h-4 text-purple-400" />;
    case 'CONCEPT': return <Lightbulb className="w-4 h-4 text-cyan-400" />;
    default: return <Box className="w-4 h-4 text-slate-400" />;
  }
};

export const Canvas: React.FC<CanvasProps> = ({ graph, onUpdateNodePosition, onDeleteNode }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [state, setState] = useState<CanvasState>({ scale: 1, offsetX: 0, offsetY: 0 });
  const [draggedItem, setDraggedItem] = useState<{ id: string; x: number; y: number } | null>(null);

  const interactionRef = useRef({
    isPanning: false,
    isDragging: false,
    startX: 0,
    startY: 0,
    initialPanX: 0,
    initialPanY: 0,
    dragItemId: null as string | null,
    initialItemX: 0,
    initialItemY: 0,
  });

  const rAFRef = useRef<number>();

  const gridStyle = {
    backgroundImage: 'radial-gradient(#334155 1px, transparent 1px)',
    backgroundSize: `${GRID_SIZE * state.scale}px ${GRID_SIZE * state.scale}px`,
    backgroundPosition: `${state.offsetX}px ${state.offsetY}px`
  };

  const updateVisuals = (mouseX: number, mouseY: number) => {
     const { isPanning, isDragging, startX, startY, initialPanX, initialPanY, dragItemId, initialItemX, initialItemY } = interactionRef.current;
     
     if (isPanning) {
       const dx = mouseX - startX;
       const dy = mouseY - startY;
       setState(prev => ({
         ...prev,
         offsetX: initialPanX + dx,
         offsetY: initialPanY + dy
       }));
     } else if (isDragging && dragItemId) {
       const dx = (mouseX - startX) / state.scale;
       const dy = (mouseY - startY) / state.scale;
       
       let newX = initialItemX + dx;
       let newY = initialItemY + dy;

       newX = Math.round(newX / GRID_SIZE) * GRID_SIZE;
       newY = Math.round(newY / GRID_SIZE) * GRID_SIZE;

       setDraggedItem({ id: dragItemId, x: newX, y: newY });
     }

     rAFRef.current = undefined;
  };

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    const target = e.target as HTMLElement;
    const handle = target.closest('.node-handle');
    const card = target.closest('.node-card');
    
    if (target.closest('button')) return;

    let clientX, clientY;
    if ('touches' in e) {
      if (e.touches.length > 1) return; // Multiple touches (e.g. pinch) handled elsewhere or ignored
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    interactionRef.current.startX = clientX;
    interactionRef.current.startY = clientY;

    if (handle && card) {
       const id = card.getAttribute('data-id');
       if (id) {
         const node = graph.nodes.find(d => d.id === id);
         if (node) {
           interactionRef.current.isDragging = true;
           interactionRef.current.dragItemId = id;
           interactionRef.current.initialItemX = node.position.x;
           interactionRef.current.initialItemY = node.position.y;
           
           setDraggedItem({ id, x: node.position.x, y: node.position.y });
         }
       }
    } else {
      interactionRef.current.isPanning = true;
      interactionRef.current.initialPanX = state.offsetX;
      interactionRef.current.initialPanY = state.offsetY;
    }
  };

  useEffect(() => {
    const onMouseMove = (e: MouseEvent | TouchEvent) => {
      let clientX, clientY;
      if ('touches' in e) {
        if (e.touches.length > 1) return;
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else {
        clientX = e.clientX;
        clientY = e.clientY;
      }

      if (interactionRef.current.isPanning || interactionRef.current.isDragging) {
         if (!rAFRef.current) {
           rAFRef.current = requestAnimationFrame(() => updateVisuals(clientX, clientY));
         }
      }
    };

    const onMouseUp = () => {
      if (interactionRef.current.isDragging && interactionRef.current.dragItemId && draggedItem) {
        onUpdateNodePosition(interactionRef.current.dragItemId, draggedItem.x, draggedItem.y);
      }

      interactionRef.current.isPanning = false;
      interactionRef.current.isDragging = false;
      interactionRef.current.dragItemId = null;
      setDraggedItem(null);
      if (rAFRef.current) cancelAnimationFrame(rAFRef.current);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('touchmove', onMouseMove, { passive: false });
    window.addEventListener('touchend', onMouseUp);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchmove', onMouseMove);
      window.removeEventListener('touchend', onMouseUp);
      if (rAFRef.current) cancelAnimationFrame(rAFRef.current);
    };
  }, [draggedItem, state.scale, onUpdateNodePosition]); 

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const zoomSensitivity = 0.002;
      const newScale = Math.min(Math.max(0.1, state.scale - e.deltaY * zoomSensitivity), 5);
      
      // Calculate mouse position relative to canvas
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        // Adjust offsets to zoom in on mouse point
        const newOffsetX = mouseX - (mouseX - state.offsetX) * (newScale / state.scale);
        const newOffsetY = mouseY - (mouseY - state.offsetY) * (newScale / state.scale);

        setState({ scale: newScale, offsetX: newOffsetX, offsetY: newOffsetY });
      } else {
        setState(prev => ({ ...prev, scale: newScale }));
      }
    } else {
      setState(prev => ({
        ...prev,
        offsetX: prev.offsetX - e.deltaX,
        offsetY: prev.offsetY - e.deltaY
      }));
    }
  };

  useEffect(() => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    setState({ scale: 1, offsetX: width / 2, offsetY: height / 2 });
  }, []);

  // Make getNodeCenter dynamic for SVG rendering
  const getNodeCenter = (id: string) => {
    const isDragging = draggedItem?.id === id;
    const node = graph.nodes.find(n => n.id === id);
    if (!node) return { x: 0, y: 0 };
    
    const x = isDragging ? draggedItem.x : node.position.x;
    const y = isDragging ? draggedItem.y : node.position.y;
    
    // Approximate center of the card (width ~ 280, height ~ 100)
    return { x: x + 140, y: y + 50 };
  };

  return (
    <div 
      ref={containerRef}
      className="w-full h-full relative cursor-grab active:cursor-grabbing overflow-hidden outline-none bg-slate-950 touch-none"
      onMouseDown={handleMouseDown}
      onTouchStart={handleMouseDown}
      onWheel={handleWheel}
      style={gridStyle}
      tabIndex={0}
    >
      <div 
        className="absolute top-0 left-0 w-full h-full origin-top-left pointer-events-none"
        style={{ 
          transform: `translate(${state.offsetX}px, ${state.offsetY}px) scale(${state.scale})` 
        }}
      >
        {/* Render SVG Edges underneath nodes */}
        <svg className="absolute inset-0 w-full h-full overflow-visible pointer-events-none">
          <defs>
            <marker id="arrowhead" markerWidth="6" markerHeight="4" refX="5" refY="2" orient="auto" fill="#475569">
              <polygon points="0 0, 6 2, 0 4" />
            </marker>
          </defs>
          {graph.edges.map(edge => {
            const start = getNodeCenter(edge.sourceId);
            const end = getNodeCenter(edge.targetId);
            
            // Basic cubic bezier for connections
            const midX = (start.x + end.x) / 2;
            const pathData = `M ${start.x} ${start.y} C ${midX} ${start.y}, ${midX} ${end.y}, ${end.x} ${end.y}`;
            
            return (
              <g key={edge.id}>
                <path
                  d={pathData}
                  fill="none"
                  stroke="#475569"
                  strokeWidth="2"
                  markerEnd="url(#arrowhead)"
                  opacity="0.6"
                />
                <rect 
                  x={midX - (edge.label.length * 3.5) - 4} 
                  y={((start.y + end.y) / 2) - 10} 
                  width={(edge.label.length * 7) + 8} 
                  height="20" 
                  fill="#020617" 
                  rx="4"
                  opacity="0.8"
                />
                <text
                  x={midX}
                  y={(start.y + end.y) / 2}
                  fill="#94a3b8"
                  fontSize="10"
                  fontFamily="monospace"
                  textAnchor="middle"
                  alignmentBaseline="middle"
                >
                  {edge.label}
                </text>
              </g>
            );
          })}
        </svg>

        {graph.nodes.map(node => {
          const isDragging = draggedItem?.id === node.id;
          const x = isDragging ? draggedItem.x : node.position.x;
          const y = isDragging ? draggedItem.y : node.position.y;
          
          return (
            <div
              key={node.id}
              data-id={node.id}
              className="node-card absolute pointer-events-auto transition-transform duration-75 ease-out shadow-lg"
              style={{ 
                transform: `translate(${x}px, ${y}px)`,
                zIndex: isDragging ? 10 : 1,
                transition: isDragging ? 'none' : 'transform 0.1s cubic-bezier(0.4, 0, 0.2, 1)',
                width: 280
              }}
            >
               <div className="bg-slate-900 border border-slate-700/50 rounded-xl overflow-hidden shadow-2xl backdrop-blur-md">
                 {/* Header drag handle */}
                 <div className="node-handle h-8 bg-slate-800/80 border-b border-slate-700/50 flex items-center px-3 cursor-grab active:cursor-grabbing justify-between group">
                   <div className="flex items-center gap-2">
                     {getIconForType(node.type)}
                     <span className="text-[10px] uppercase tracking-widest font-mono text-slate-400">{node.type}</span>
                   </div>
                   <button 
                     onClick={(e) => { e.stopPropagation(); onDeleteNode(node.id); }}
                     className="text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                   >
                     <Trash2 size={14} />
                   </button>
                 </div>
                 
                 {/* Body */}
                 <div className="p-4">
                   <h3 className="font-semibold text-white mb-1 tracking-tight">{node.label}</h3>
                   <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">{node.description}</p>
                 </div>
               </div>
            </div>
          );
        })}
      </div>

      <div className="absolute bottom-6 right-6 bg-slate-900/80 backdrop-blur p-2 rounded-lg shadow-lg border border-slate-800 text-[10px] text-cyan-500/70 font-mono pointer-events-none select-none">
        ZOOM {(state.scale * 100).toFixed(0)}% | PAN {Math.round(state.offsetX)},{Math.round(state.offsetY)}
      </div>
    </div>
  );
};