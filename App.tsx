import React, { useState, useEffect, useCallback } from 'react';
import { Canvas } from './components/Canvas';
import { extractEntityGraph } from './services/gemini';
import { GraphData, NodeData, EdgeData } from './types';
import { Loader2, Zap, Send, Network, Undo2, Redo2, ShieldAlert } from 'lucide-react';

export default function App() {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [graph, setGraph] = useState<GraphData>({ nodes: [], edges: [] });
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 768);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 768 && sidebarOpen) {
        // Maybe don't auto close, just let user close it
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [sidebarOpen]);

  // Undo/Redo State
  const [history, setHistory] = useState<GraphData[]>([]);
  const [redoStack, setRedoStack] = useState<GraphData[]>([]);

  const commitToHistory = useCallback((newGraph: GraphData) => {
    setHistory(prev => [...prev, graph]);
    setRedoStack([]);
    setGraph(newGraph);
  }, [graph]);

  const undo = useCallback(() => {
    if (history.length === 0) return;
    const previous = history[history.length - 1];
    setRedoStack(prev => [graph, ...prev]);
    setGraph(previous);
    setHistory(prev => prev.slice(0, -1));
  }, [history, graph]);

  const redo = useCallback(() => {
    if (redoStack.length === 0) return;
    const next = redoStack[0];
    setHistory(prev => [...prev, graph]);
    setGraph(next);
    setRedoStack(prev => prev.slice(1));
  }, [redoStack, graph]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'y') {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    try {
      const newExtractedData = await extractEntityGraph(prompt);
      
      // Merge with existing graph
      const newNodes = [...graph.nodes, ...newExtractedData.nodes];
      const newEdges = [...graph.edges, ...newExtractedData.edges];
      
      // Deduplicate nodes loosely by label
      const uniqueNodes: NodeData[] = [];
      const seenLabels = new Set();
      newNodes.forEach(n => {
        if (!seenLabels.has(n.label)) {
          seenLabels.add(n.label);
          uniqueNodes.push(n);
        }
      });

      commitToHistory({ nodes: uniqueNodes, edges: newEdges });
      setPrompt(''); // Clear prompt on success
    } catch (error) {
      console.error("Failed to generate graph", error);
      alert("Something went wrong generating the connections.");
    } finally {
      setLoading(false);
    }
  };

  const updateNodePosition = (id: string, x: number, y: number) => {
    const current = graph.nodes.find(d => d.id === id);
    if (current && current.position.x === x && current.position.y === y) return;

    const newNodes = graph.nodes.map(d => d.id === id ? { ...d, position: { x, y } } : d);
    commitToHistory({ nodes: newNodes, edges: graph.edges });
  };

  const deleteNode = (id: string) => {
    const newNodes = graph.nodes.filter(d => d.id !== id);
    // Also remove connected edges
    const newEdges = graph.edges.filter(e => e.sourceId !== id && e.targetId !== id);
    commitToHistory({ nodes: newNodes, edges: newEdges });
  };

  return (
    <div className="w-screen h-screen flex flex-col overflow-hidden bg-slate-950 text-slate-100 font-sans selection:bg-cyan-500/30">
      {/* Header / Toolbar */}
      <div className="h-14 bg-slate-900 border-b border-slate-800 flex items-center px-4 sm:px-6 justify-between z-20 shadow-sm relative">
        <div className="flex items-center gap-2 sm:gap-3">
           <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
             <Network size={18} className="text-white" />
           </div>
           <h1 className="font-bold text-lg sm:text-xl tracking-tight text-white flex items-center gap-2">
             Vision Canvas
             <span className="hidden sm:inline-block px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-[10px] font-mono tracking-widest uppercase text-cyan-400">Beta</span>
           </h1>
        </div>
        
        {/* Toolbar Actions */}
        <div className="flex items-center gap-1 sm:gap-2 bg-slate-800 p-1 rounded-lg border border-slate-700">
           <button 
             onClick={undo} 
             disabled={history.length === 0}
             className="p-1.5 hover:bg-slate-700 rounded-md text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent transition-all"
             title="Undo (Ctrl+Z)"
           >
             <Undo2 size={18} />
           </button>
           <button 
             onClick={redo} 
             disabled={redoStack.length === 0}
             className="p-1.5 hover:bg-slate-700 rounded-md text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent transition-all"
             title="Redo (Ctrl+Y)"
           >
             <Redo2 size={18} />
           </button>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <button className="hidden sm:block text-sm font-medium text-slate-400 hover:text-cyan-400 transition-colors">Export JSON</button>
          {/* Mobile toggle button */}
          <button 
            className="sm:hidden w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center border border-slate-700 text-cyan-400"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <Zap className="w-4 h-4" />
          </button>
          <div className="hidden sm:flex w-8 h-8 rounded-full bg-slate-800 items-center justify-center border border-slate-700">
            <ShieldAlert className="w-4 h-4 text-slate-400" />
          </div>
        </div>
      </div>

      <div className="flex-1 relative flex">
        {/* Canvas Area */}
        <div className="flex-1 relative bg-slate-950">
           <Canvas 
             graph={graph} 
             onUpdateNodePosition={updateNodePosition} 
             onDeleteNode={deleteNode}
           />
           
           {/* Empty State */}
           {graph.nodes.length === 0 && !loading && (
             <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
               <div className="text-center max-w-md p-8 border border-slate-800/50 rounded-3xl bg-slate-900/50 backdrop-blur-sm">
                 <div className="w-16 h-16 bg-slate-800 rounded-2xl shadow-inner border border-slate-700 mx-auto flex items-center justify-center mb-6 relative">
                   <div className="absolute inset-0 bg-cyan-500/20 rounded-2xl blur-xl"></div>
                   <Network className="text-cyan-400 w-8 h-8 relative z-10" />
                 </div>
                 <h2 className="text-2xl font-bold text-white mb-3">Initialize Nexus</h2>
                 <p className="text-slate-400 text-sm leading-relaxed">Paste an article, plot summary, or dossier into the terminal to extract entities and map their hidden connections.</p>
               </div>
             </div>
           )}
        </div>

        {/* Floating Input Panel (Sidebar) */}
        <div className={`absolute left-0 sm:left-6 top-0 sm:top-6 bottom-0 sm:bottom-6 w-full sm:w-96 bg-slate-900/95 backdrop-blur-xl sm:border border-slate-700/60 sm:shadow-2xl sm:rounded-2xl flex flex-col transition-transform duration-300 z-30 ${sidebarOpen ? 'translate-x-0' : '-translate-x-[110%]'}`}>
          <div className="p-5 border-b border-slate-800 flex justify-between items-center">
            <h2 className="font-semibold text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-cyan-400" />
              Extraction Terminal
            </h2>
            <button onClick={() => setSidebarOpen(false)} className="text-slate-500 hover:text-white">&times;</button>
          </div>
          
          <div className="p-5 flex-1 flex flex-col gap-4 overflow-y-auto custom-scrollbar">
             <div>
               <label className="block text-[10px] font-mono text-cyan-500 mb-2 uppercase tracking-widest">Input Raw Data</label>
               <textarea 
                  className="w-full h-48 p-4 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-300 focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition-all resize-none placeholder:text-slate-700 font-mono"
                  placeholder="> Upload unstructured text here...
> E.g. 'Operation Firewall: Alice initiated contact with Bob at CyberDyne Corp. Bob secretly funds project Xcalibur...'"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
               />
               <p className="text-[10px] text-slate-600 mt-2 text-right">Awaiting string stream...</p>
             </div>

             <div className="border-t border-slate-800 pt-4">
               <label className="block text-[10px] font-mono text-cyan-500 mb-2 uppercase tracking-widest">Extracted Entities ({graph.nodes.length})</label>
               {graph.nodes.length > 0 ? (
                 <div className="space-y-2">
                   {graph.nodes.map(n => (
                     <div key={n.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-sm text-slate-300">
                       <div className="w-2 h-2 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.8)]"></div>
                       <span className="font-medium truncate">{n.label}</span>
                       <span className="text-[10px] text-slate-500 font-mono ml-auto">{n.type}</span>
                     </div>
                   ))}
                 </div>
               ) : (
                 <div className="text-sm text-slate-600 font-mono p-2">&gt; System idling.</div>
               )}
             </div>
          </div>

          <div className="p-5 border-t border-slate-800 bg-slate-900/50 rounded-b-2xl">
            <button 
              onClick={handleGenerate}
              disabled={loading || !prompt.trim()}
              className="w-full py-3.5 px-4 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 disabled:text-slate-600 disabled:cursor-not-allowed text-white rounded-xl font-medium shadow-lg shadow-cyan-900/50 transition-all flex items-center justify-center gap-2 group"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin w-4 h-4" />
                  Extracting...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  Run Extraction
                </>
              )}
            </button>
          </div>
        </div>

        {/* Toggle Sidebar Button (visible when closed) */}
        {!sidebarOpen && (
          <button 
            onClick={() => setSidebarOpen(true)}
            className="hidden sm:block absolute left-6 top-6 p-3 bg-slate-900 rounded-xl shadow-lg border border-slate-700 text-cyan-500 hover:bg-slate-800 z-10"
          >
            <Zap className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
}