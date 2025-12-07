// @ts-nocheck
import React, { useState, useRef, useEffect } from 'react';
import { Workflow, Status, Transition, AIAnalysisResult } from '../types';
import { Plus, X, ArrowRight, MousePointer2, Move, ZoomIn, ZoomOut, Save, Cpu, AlertTriangle, CheckCircle } from 'lucide-react';
import { analyzeWorkflow } from '../services/geminiService';

interface WorkflowBuilderProps {
  workflow: Workflow;
  onSave: (w: Workflow) => void;
}

const WorkflowBuilder: React.FC<WorkflowBuilderProps> = ({ workflow: initialWorkflow, onSave }) => {
  const [workflow, setWorkflow] = useState<Workflow>(initialWorkflow);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [scale, setScale] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Dragging logic
  const dragItem = useRef<string | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const handleMouseDown = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    dragItem.current = id;
    const node = workflow.statuses.find(s => s.id === id);
    if (node) {
      setDragOffset({
        x: e.clientX - node.position.x * scale,
        y: e.clientY - node.position.y * scale
      });
      setIsDragging(true);
      setSelectedNode(id);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && dragItem.current) {
      const newX = (e.clientX - dragOffset.x) / scale;
      const newY = (e.clientY - dragOffset.y) / scale;
      
      setWorkflow(prev => ({
        ...prev,
        statuses: prev.statuses.map(s => 
          s.id === dragItem.current 
            ? { ...s, position: { x: Math.max(0, newX), y: Math.max(0, newY) } }
            : s
        )
      }));
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    dragItem.current = null;
  };

  const addStatus = () => {
    const newId = `status-${Date.now()}`;
    const newStatus: Status = {
      id: newId,
      name: 'New Status',
      category: 'todo',
      color: '#64748b',
      position: { x: 100, y: 100 }
    };
    setWorkflow(prev => ({ ...prev, statuses: [...prev.statuses, newStatus] }));
  };

  const removeStatus = (id: string) => {
    setWorkflow(prev => ({
      ...prev,
      statuses: prev.statuses.filter(s => s.id !== id),
      transitions: prev.transitions.filter(t => t.from !== id && t.to !== id)
    }));
    setSelectedNode(null);
  };

  const handleAIAnalysis = async () => {
    setIsAnalyzing(true);
    const result = await analyzeWorkflow(workflow);
    setAiAnalysis(result);
    setIsAnalyzing(false);
  };

  // Helper to draw bezier curves
  const getPath = (start: Status, end: Status) => {
    const sx = start.position.x + 160; // Width of card
    const sy = start.position.y + 40;  // Height/2
    const ex = end.position.x;
    const ey = end.position.y + 40;
    
    // Control points
    const c1x = sx + (ex - sx) / 2;
    const c1y = sy;
    const c2x = ex - (ex - sx) / 2;
    const c2y = ey;

    return `M ${sx} ${sy} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${ex} ${ey}`;
  };

  return (
    <div className="flex h-full flex-col bg-slate-50 dark:bg-slate-900 overflow-hidden" onMouseMove={handleMouseMove} onMouseUp={handleMouseUp}>
      {/* Toolbar */}
      <div className="h-14 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-between px-4 shrink-0 z-10">
        <div className="flex items-center space-x-2">
          <button onClick={addStatus} className="flex items-center space-x-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium transition-colors">
            <Plus size={16} />
            <span>Add Status</span>
          </button>
          <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-2" />
          <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-700 rounded p-0.5">
            <button onClick={() => setScale(s => Math.max(0.5, s - 0.1))} className="p-1 hover:bg-white dark:hover:bg-slate-600 rounded text-slate-600 dark:text-slate-300">
              <ZoomOut size={16} />
            </button>
            <span className="text-xs w-12 text-center text-slate-600 dark:text-slate-300">{Math.round(scale * 100)}%</span>
            <button onClick={() => setScale(s => Math.min(2, s + 0.1))} className="p-1 hover:bg-white dark:hover:bg-slate-600 rounded text-slate-600 dark:text-slate-300">
              <ZoomIn size={16} />
            </button>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <button 
            onClick={handleAIAnalysis}
            className="flex items-center space-x-2 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 px-3 py-1.5 rounded transition-colors"
          >
            <Cpu size={16} />
            <span>{isAnalyzing ? 'Analyzing...' : 'AI Optimization'}</span>
          </button>
          <button onClick={() => onSave(workflow)} className="flex items-center space-x-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 px-3 py-1.5 rounded transition-colors">
            <Save size={16} />
            <span>Save</span>
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Canvas */}
        <div className="flex-1 relative overflow-auto bg-slate-50 dark:bg-slate-950 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] dark:bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px]">
          <div 
            className="origin-top-left transition-transform duration-75"
            style={{ 
              transform: `scale(${scale})`,
              width: '2000px', 
              height: '2000px' 
            }}
          >
            <svg className="absolute top-0 left-0 w-full h-full pointer-events-none z-0">
               <defs>
                <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                  <polygon points="0 0, 10 3.5, 0 7" fill="#94a3b8" />
                </marker>
              </defs>
              {workflow.transitions.map(t => {
                const start = workflow.statuses.find(s => s.id === t.from);
                const end = workflow.statuses.find(s => s.id === t.to);
                if (!start || !end) return null;
                return (
                  <path 
                    key={t.id}
                    d={getPath(start, end)}
                    stroke="#94a3b8"
                    strokeWidth="2"
                    fill="none"
                    markerEnd="url(#arrowhead)"
                  />
                );
              })}
            </svg>

            {workflow.statuses.map(status => (
              <div
                key={status.id}
                className={`absolute w-40 p-3 rounded-lg shadow-sm border-2 cursor-move group transition-colors z-10
                  ${selectedNode === status.id 
                    ? 'border-blue-500 bg-white dark:bg-slate-800 ring-2 ring-blue-200 dark:ring-blue-900' 
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-blue-300 dark:hover:border-slate-600'
                  }`}
                style={{ 
                  left: status.position.x, 
                  top: status.position.y 
                }}
                onMouseDown={(e) => handleMouseDown(e, status.id)}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className={`w-3 h-3 rounded-full mt-1.5`} style={{ backgroundColor: status.color }} />
                  <button 
                    onClick={(e) => { e.stopPropagation(); removeStatus(status.id); }}
                    className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500"
                  >
                    <X size={14} />
                  </button>
                </div>
                <input 
                  value={status.name}
                  onChange={(e) => {
                    setWorkflow(prev => ({
                      ...prev,
                      statuses: prev.statuses.map(s => s.id === status.id ? { ...s, name: e.target.value } : s)
                    }))
                  }}
                  className="w-full bg-transparent font-medium text-slate-800 dark:text-slate-100 focus:outline-none text-sm"
                />
                <div className="text-[10px] text-slate-400 uppercase tracking-wider mt-1">{status.category}</div>
                
                {/* Connect Handles */}
                <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-slate-200 dark:bg-slate-700 rounded-full border border-slate-300 dark:border-slate-600 hover:bg-blue-500 hover:border-blue-600 cursor-crosshair transition-colors" />
                <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-slate-200 dark:bg-slate-700 rounded-full border border-slate-300 dark:border-slate-600 cursor-default" />
              </div>
            ))}
          </div>
        </div>

        {/* AI Sidebar */}
        {aiAnalysis && (
          <div className="w-80 border-l border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-y-auto z-20 shadow-xl animate-in slide-in-from-right">
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-purple-50 dark:bg-purple-900/20">
              <h3 className="font-semibold text-purple-900 dark:text-purple-100 flex items-center">
                <Cpu size={18} className="mr-2" />
                AI Analysis
              </h3>
              <button onClick={() => setAiAnalysis(null)} className="text-purple-800 dark:text-purple-200 hover:bg-purple-100 dark:hover:bg-purple-800 rounded p-1">
                <X size={16} />
              </button>
            </div>
            
            <div className="p-4 space-y-6">
              <div>
                <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">Workflow Efficiency Score</div>
                <div className="flex items-center space-x-3">
                  <div className="flex-1 h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${aiAnalysis.score > 80 ? 'bg-green-500' : aiAnalysis.score > 50 ? 'bg-yellow-500' : 'bg-red-500'}`} 
                      style={{ width: `${aiAnalysis.score}%` }} 
                    />
                  </div>
                  <span className="font-bold text-slate-700 dark:text-slate-200">{aiAnalysis.score}/100</span>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase text-slate-400 mb-2 flex items-center">
                   <AlertTriangle size={12} className="mr-1" /> Potential Bottlenecks
                </h4>
                <ul className="space-y-2">
                  {aiAnalysis.bottlenecks.map((b, i) => (
                    <li key={i} className="text-sm bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 p-2 rounded border border-red-100 dark:border-red-900/30">
                      {b}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase text-slate-400 mb-2 flex items-center">
                   <Move size={12} className="mr-1" /> Suggestions
                </h4>
                <ul className="space-y-2">
                  {aiAnalysis.suggestions.map((s, i) => (
                    <li key={i} className="text-sm bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 p-2 rounded border border-blue-100 dark:border-blue-900/30">
                      {s}
                    </li>
                  ))}
                </ul>
              </div>

               <div>
                <h4 className="text-xs font-bold uppercase text-slate-400 mb-2 flex items-center">
                   <CheckCircle size={12} className="mr-1" /> Automation Tips
                </h4>
                <ul className="space-y-2">
                  {aiAnalysis.automationOpportunities.map((a, i) => (
                    <li key={i} className="text-sm bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200 p-2 rounded border border-green-100 dark:border-green-900/30">
                      {a}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkflowBuilder;