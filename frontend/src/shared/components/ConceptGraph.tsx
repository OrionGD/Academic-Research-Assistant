import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  GitBranch, Zap, Layers, Filter, Calendar, 
  Map, Award, BookOpen, Clock, Activity, ListFilter,
  Maximize2, ZoomIn, ZoomOut, RefreshCw, ChevronRight, Share2
} from 'lucide-react';
import { Document } from '../../types/api';
import { cn } from '../../utils/helpers';

interface ConceptGraphProps {
  document: Document | null;
  documentsList: Document[];
  onNodeSelect?: (docId: string) => void;
}

interface Node {
  id: string;
  label: string;
  authors: string[];
  year: number;
  domain: string;
  citationsCount: number;
  relevance: number; // 0-100
  type: 'core' | 'reference' | 'concept';
  abstract?: string;
  x: number;
  y: number;
}

interface Edge {
  source: string;
  target: string;
  label?: string;
  type: 'citation' | 'trajectory';
  animated?: boolean;
}

export default function ConceptGraph({ document, documentsList, onNodeSelect }: ConceptGraphProps) {
  const [viewMode, setViewMode] = useState<'network' | 'trajectory'>('network');
  const [selectedNodeId, setSelectedNodeId] = useState<string>('');
  const [hoveredNodeId, setHoveredNodeId] = useState<string>('');
  
  // Filters
  const [yearRange, setYearRange] = useState<[number, number]>([2016, 2026]);
  const [selectedDomain, setSelectedDomain] = useState<string>('all');
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Generate dynamic nodes & edges based on loaded paper or global set
  const graphData = useMemo(() => {
    let nodes: Node[] = [];
    let edges: Edge[] = [];

    const centerPaperId = document?.id || 'central-paper';
    const centerTitle = document?.title || 'Academic Intelligence Universe';
    const centerYear = document?.year || 2024;
    const centerAuthors = document?.authors || ['ScholarAI Core'];
    const centerKeywords = document?.keywords || ['Artificial Intelligence', 'Semantic Mapping', 'Vector Databases'];
    const primaryDomain = centerKeywords[0] || 'Deep Learning';

    // 1. Core Center Node
    nodes.push({
      id: centerPaperId,
      label: centerTitle,
      authors: centerAuthors,
      year: centerYear,
      domain: primaryDomain,
      citationsCount: document?.analysis?.keyThemesCount ? document.analysis.keyThemesCount * 6 : 42,
      relevance: 100,
      type: 'core',
      abstract: document?.analysis?.summary || 'seminal publication indexing knowledge hierarchies across multi-vector dimensions.',
      x: 350,
      y: 250
    });

    // 2. Generate semantically interesting parent/child citation nodes
    const generatedNodes = [
      {
        id: 'ref-1',
        label: 'Attention Is All You Need',
        authors: ['Vaswani et al.'],
        year: 2017,
        domain: 'Transformers',
        citationsCount: 112000,
        relevance: 85,
        type: 'reference' as const,
        abstract: 'Seminal paper introducing multi-head self-attention mechanisms, establishing the foundational architecture for modern large language models.',
        x: 180,
        y: 120
      },
      {
        id: 'ref-2',
        label: 'BERT: Pre-training of Deep Bidirectional Transformers',
        authors: ['Devlin et al.'],
        year: 2019,
        domain: 'NLP',
        citationsCount: 54000,
        relevance: 78,
        type: 'reference' as const,
        abstract: 'Introduces bidirectional pre-training for language representations, improving contextual language comprehension across downstream tasks.',
        x: 160,
        y: 360
      },
      {
        id: 'ref-3',
        label: 'Language Models are Few-Shot Learners (GPT-3)',
        authors: ['Brown et al.'],
        year: 2020,
        domain: 'Generative AI',
        citationsCount: 32000,
        relevance: 90,
        type: 'reference' as const,
        abstract: 'Demonstrates that scaling language models achieves strong few-shot performance on a wide variety of NLP tasks without fine-tuning.',
        x: 520,
        y: 130
      },
      {
        id: 'ref-4',
        label: 'Vector Space Models for Semantic Retrieval',
        authors: ['Salton et al.'],
        year: 2016,
        domain: 'Information Retrieval',
        citationsCount: 840,
        relevance: 65,
        type: 'reference' as const,
        abstract: 'Explores geometric structures for indexing knowledge representations, establishing mathematical principles of modern vector DB databases.',
        x: 480,
        y: 380
      },
      // Concepts along intellectual trajectories
      {
        id: 'con-1',
        label: 'Self-Attention Vectorization',
        authors: ['Conceptual Node'],
        year: 2018,
        domain: 'Transformers',
        citationsCount: 15,
        relevance: 95,
        type: 'concept' as const,
        abstract: 'Evolution of standard embeddings into dynamic context-sensitive coordinates computed via dot-product scaling matrices.',
        x: 240,
        y: 220
      },
      {
        id: 'con-2',
        label: 'Multi-Vector Semantic Routing',
        authors: ['Conceptual Node'],
        year: 2021,
        domain: 'Knowledge Graphs',
        citationsCount: 8,
        relevance: 88,
        type: 'concept' as const,
        abstract: 'Connecting localized chunk vectors with global knowledge graph nodes to route queries along high-relevance semantic topologies.',
        x: 430,
        y: 260
      }
    ];

    // Merge in any other uploaded documents from the list as nodes to represent cross-paper mapping!
    documentsList.forEach((item, index) => {
      if (item.id !== centerPaperId) {
        // Position them in a nice circle around the center
        const angle = (index * 2 * Math.PI) / Math.max(1, documentsList.length);
        const radius = 220;
        nodes.push({
          id: item.id,
          label: item.title,
          authors: item.authors || ['Workspace Scholar'],
          year: item.year || 2025,
          domain: item.keywords?.[0] || 'Knowledge Ingestion',
          citationsCount: item.analysis?.keyThemesCount ? item.analysis.keyThemesCount * 4 : 5,
          relevance: 70,
          type: 'reference',
          abstract: item.analysis?.summary || 'workspace asset vectorized in localized system memory namespaces.',
          x: 350 + Math.cos(angle) * radius,
          y: 250 + Math.sin(angle) * radius
        });
      }
    });

    nodes.push(...generatedNodes);

    // Build standard connections
    edges.push(
      { source: 'ref-1', target: 'con-1', type: 'trajectory', animated: true },
      { source: 'con-1', target: centerPaperId, type: 'trajectory', animated: true },
      { source: 'ref-2', target: centerPaperId, type: 'citation' },
      { source: centerPaperId, target: 'con-2', type: 'trajectory', animated: true },
      { source: 'con-2', target: 'ref-3', type: 'trajectory', animated: true },
      { source: 'ref-4', target: centerPaperId, type: 'citation' }
    );

    // Dynamic citation connections for documents in the list
    documentsList.forEach(item => {
      if (item.id !== centerPaperId) {
        edges.push({
          source: item.id,
          target: centerPaperId,
          type: 'citation'
        });
      }
    });

    // Apply filters
    const filteredNodes = nodes.filter(node => {
      const withinYear = node.year >= yearRange[0] && node.year <= yearRange[1];
      const matchDomain = selectedDomain === 'all' || node.domain.toLowerCase().includes(selectedDomain.toLowerCase());
      // Always keep the core node
      return node.id === centerPaperId || (withinYear && matchDomain);
    });

    const filteredNodeIds = new Set(filteredNodes.map(n => n.id));
    const filteredEdges = edges.filter(edge => 
      filteredNodeIds.has(edge.source) && filteredNodeIds.has(edge.target)
    );

    return { nodes: filteredNodes, edges: filteredEdges };
  }, [document, documentsList, yearRange, selectedDomain]);

  // Set initial selected node
  React.useEffect(() => {
    if (document) {
      setSelectedNodeId(document.id);
    }
  }, [document]);

  const activeNode = useMemo(() => {
    return graphData.nodes.find(n => n.id === selectedNodeId) || graphData.nodes[0];
  }, [selectedNodeId, graphData]);

  // Unique domains list for filtering
  const domains = useMemo(() => {
    const list = new Set<string>();
    graphData.nodes.forEach(n => { if (n.domain) list.add(n.domain); });
    return Array.from(list);
  }, [graphData]);

  // Handle Zoom and Reset
  const handleZoomIn = () => setZoom(prev => Math.min(2, prev + 0.15));
  const handleZoomOut = () => setZoom(prev => Math.max(0.5, prev - 0.15));
  const handleReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setYearRange([2016, 2026]);
    setSelectedDomain('all');
  };

  return (
    <div className="grid lg:grid-cols-4 gap-8 h-[650px] bg-surface-subtle border border-border-light rounded-3xl overflow-hidden shadow-2xl p-6 relative">
      
      {/* 1. Left controls & Filters panel (Inspired by Power BI visual filter panes) */}
      <div className="lg:col-span-1 space-y-6 bg-background/50 border border-border-subtle/50 rounded-2xl p-5 flex flex-col justify-between select-none">
        <div className="space-y-6">
          <div className="flex items-center gap-3 border-b border-border/10 pb-4">
            <GitBranch className="text-accent animate-pulse" size={20} />
            <div>
              <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">Concept Graph</h3>
              <p className="text-[10px] text-text-dim">Academic Citation & Concepts Mapping</p>
            </div>
          </div>

          {/* View Toggles */}
          <div className="space-y-2">
            <label className="text-[9px] font-bold text-text-dim uppercase tracking-widest">Select Dashboard View</label>
            <div className="grid grid-cols-2 gap-1 bg-surface-light border border-border-light p-1 rounded-xl">
              <button
                onClick={() => setViewMode('network')}
                className={cn(
                  "py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2",
                  viewMode === 'network' ? "bg-accent/10 text-accent border border-accent/20" : "text-text-dim hover:text-text-primary"
                )}
              >
                <Activity size={12} />
                Network Map
              </button>
              <button
                onClick={() => setViewMode('trajectory')}
                className={cn(
                  "py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2",
                  viewMode === 'trajectory' ? "bg-accent/10 text-accent border border-accent/20" : "text-text-dim hover:text-text-primary"
                )}
              >
                <Map size={12} />
                Trajectory
              </button>
            </div>
          </div>

          {/* Year Range Filter */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-bold text-text-dim uppercase tracking-widest flex items-center gap-1.5">
                <Calendar size={11} className="text-accent" />
                Chronological Scope
              </span>
              <span className="text-[10px] font-mono text-accent font-bold">{yearRange[0]} - {yearRange[1]}</span>
            </div>
            <div className="flex gap-4">
              <input 
                type="range" 
                min="2016" 
                max="2026" 
                value={yearRange[0]} 
                onChange={(e) => setYearRange([parseInt(e.target.value), yearRange[1]])}
                className="w-full accent-accent h-1 rounded-lg cursor-pointer bg-surface-light" 
              />
              <input 
                type="range" 
                min="2016" 
                max="2026" 
                value={yearRange[1]} 
                onChange={(e) => setYearRange([yearRange[0], parseInt(e.target.value)])}
                className="w-full accent-accent h-1 rounded-lg cursor-pointer bg-surface-light" 
              />
            </div>
          </div>

          {/* Domain Category Filter */}
          <div className="space-y-2">
            <span className="text-[9px] font-bold text-text-dim uppercase tracking-widest flex items-center gap-1.5">
              <Filter size={11} className="text-accent" />
              Academic Domain
            </span>
            <select
              value={selectedDomain}
              onChange={(e) => setSelectedDomain(e.target.value)}
              className="w-full bg-surface-light border border-border-light rounded-xl px-3 py-2.5 text-xs text-text-primary font-bold focus:outline-none focus:border-accent/40"
            >
              <option value="all">All Domains</option>
              {domains.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Quick Statistics Mini Panel (Power BI Card style) */}
        <div className="bg-accent/5 border border-accent/10 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-[9px] font-bold text-text-dim uppercase tracking-widest">Active Mapping</p>
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-lg font-bold text-text-primary">{graphData.nodes.length}</p>
              <p className="text-[8px] text-text-dim uppercase font-bold tracking-tighter">Nodes Found</p>
            </div>
            <div>
              <p className="text-lg font-bold text-text-primary">{graphData.edges.length}</p>
              <p className="text-[8px] text-text-dim uppercase font-bold tracking-tighter">Vectors Active</p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Middle Interactive SVG Mapping Canvas */}
      <div className="lg:col-span-2 relative bg-background/30 rounded-2xl border border-border-subtle/50 overflow-hidden flex flex-col justify-between">
        
        {/* Canvas Toolbar overlay */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10 pointer-events-none select-none">
          <div className="flex items-center gap-2 bg-surface-light/80 backdrop-blur-xl border border-border-light px-3 py-1.5 rounded-full text-[10px] font-bold text-text-primary uppercase tracking-wider pointer-events-auto">
            <Activity size={10} className="text-accent shrink-0" />
            {viewMode === 'network' ? 'Vector citation mesh' : 'Chronological Concept Flow'}
          </div>
          
          <div className="flex items-center gap-1.5 bg-surface-light/80 backdrop-blur-xl border border-border-light p-1 rounded-xl pointer-events-auto">
            <button onClick={handleZoomIn} className="p-1.5 hover:bg-white/10 rounded text-text-dim hover:text-text-primary transition-colors" title="Zoom In"><ZoomIn size={14} /></button>
            <button onClick={handleZoomOut} className="p-1.5 hover:bg-white/10 rounded text-text-dim hover:text-text-primary transition-colors" title="Zoom Out"><ZoomOut size={14} /></button>
            <button onClick={handleReset} className="p-1.5 hover:bg-white/10 rounded text-text-dim hover:text-text-primary transition-colors" title="Reset View"><RefreshCw size={14} /></button>
          </div>
        </div>

        {/* SVG Mesh Canvas */}
        <div className="flex-1 w-full relative overflow-hidden cursor-grab active:cursor-grabbing">
          <svg 
            className="w-full h-full"
            style={{ transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`, transformOrigin: 'center center', transition: 'transform 0.15s ease-out' }}
          >
            {/* SVG Glowing Filters Definition */}
            <defs>
              <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="6" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <marker id="arrow" viewBox="0 0 10 10" refX="18" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="rgba(99, 102, 241, 0.4)" />
              </marker>
              <marker id="arrow-animated" viewBox="0 0 10 10" refX="18" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#10b981" />
              </marker>
            </defs>

            {/* View Mode 1: Citation Mesh network */}
            {viewMode === 'network' && (
              <>
                {/* Edges Link Lines */}
                {graphData.edges.map((edge, i) => {
                  const srcNode = graphData.nodes.find(n => n.id === edge.source);
                  const tgtNode = graphData.nodes.find(n => n.id === edge.target);
                  if (!srcNode || !tgtNode) return null;

                  const isHighlighted = hoveredNodeId === edge.source || hoveredNodeId === edge.target || 
                                       selectedNodeId === edge.source || selectedNodeId === edge.target;
                  const isDimmed = hoveredNodeId !== '' && !isHighlighted;

                  return (
                    <g key={`edge-${i}`} className="transition-opacity duration-300" style={{ opacity: isDimmed ? 0.15 : 1 }}>
                      <line
                        x1={srcNode.x}
                        y1={srcNode.y}
                        x2={tgtNode.x}
                        y2={tgtNode.y}
                        stroke={edge.animated ? '#10b981' : 'rgba(99, 102, 241, 0.3)'}
                        strokeWidth={isHighlighted ? 2.5 : 1.2}
                        markerEnd={`url(#${edge.animated ? 'arrow-animated' : 'arrow'})`}
                        strokeDasharray={edge.animated ? "5,5" : undefined}
                      >
                        {edge.animated && (
                          <animate 
                            attributeName="stroke-dashoffset" 
                            values="30;0" 
                            dur="2s" 
                            repeatCount="indefinite" 
                          />
                        )}
                      </line>
                    </g>
                  );
                })}

                {/* Nodes Circle Elements */}
                {graphData.nodes.map((node) => {
                  const isSelected = selectedNodeId === node.id;
                  const isHovered = hoveredNodeId === node.id;
                  const isCore = node.type === 'core';
                  const isConcept = node.type === 'concept';
                  
                  const isHighlighted = hoveredNodeId === '' || isHovered || 
                                       graphData.edges.some(e => (e.source === node.id && e.target === hoveredNodeId) || (e.target === node.id && e.source === hoveredNodeId));
                  const isDimmed = !isHighlighted;

                  let nodeRadius = 10;
                  let color = '#6366f1'; // Default Indigo
                  if (isCore) { nodeRadius = 18; color = '#f43f5e'; } // Core Rose
                  else if (isConcept) { nodeRadius = 12; color = '#10b981'; } // Concept Emerald

                  return (
                    <g 
                      key={node.id} 
                      className="cursor-pointer select-none transition-all duration-300"
                      onClick={() => {
                        setSelectedNodeId(node.id);
                        if (onNodeSelect) onNodeSelect(node.id);
                      }}
                      onMouseEnter={() => setHoveredNodeId(node.id)}
                      onMouseLeave={() => setHoveredNodeId('')}
                      style={{ opacity: isDimmed ? 0.25 : 1 }}
                    >
                      {/* Glow Card for hovered/selected nodes */}
                      {(isSelected || isHovered) && (
                        <circle
                          cx={node.x}
                          cy={node.y}
                          r={nodeRadius + 6}
                          fill="none"
                          stroke={color}
                          strokeWidth="2"
                          strokeOpacity="0.4"
                          filter="url(#glow)"
                        />
                      )}

                      {/* Main Node Circle */}
                      <circle
                        cx={node.x}
                        cy={node.y}
                        r={nodeRadius}
                        fill={isCore ? '#e11d48' : isConcept ? '#059669' : '#4f46e5'}
                        stroke={isCore ? 'rgba(244, 63, 94, 0.4)' : isConcept ? 'rgba(16, 185, 129, 0.4)' : 'rgba(99, 102, 241, 0.4)'}
                        strokeWidth="3"
                        className="transition-transform duration-300"
                      />

                      {/* Floating Text Label */}
                      <text
                        x={node.x}
                        y={node.y - nodeRadius - 6}
                        textAnchor="middle"
                        fill="#f8fafc"
                        fontSize={isCore ? '10px' : '8px'}
                        fontWeight="bold"
                        className="drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] fill-text-primary"
                      >
                        {node.label.length > 25 ? `${node.label.slice(0, 22)}...` : node.label}
                      </text>
                    </g>
                  );
                })}
              </>
            )}

            {/* View Mode 2: Intellectual Trajectory Flow (Chronological Left-to-Right) */}
            {viewMode === 'trajectory' && (
              <>
                {/* Horizontal Chronology Axes */}
                <line x1="50" y1="250" x2="650" y2="250" stroke="rgba(255,255,255,0.06)" strokeWidth="4" />
                <line x1="50" y1="250" x2="650" y2="250" stroke="rgba(99, 102, 241, 0.2)" strokeWidth="1" strokeDasharray="5,5" />

                {/* Years marks */}
                {[2017, 2019, 2021, 2023, 2025].map((yr, index) => {
                  const posX = 100 + index * 120;
                  return (
                    <g key={`timeline-yr-${yr}`} className="opacity-40">
                      <line x1={posX} y1="240" x2={posX} y2="260" stroke="#f8fafc" strokeWidth="1" />
                      <text x={posX} y="278" textAnchor="middle" fill="#94a3b8" fontSize="9px" fontWeight="bold" className="font-mono">{yr}</text>
                    </g>
                  );
                })}

                {/* Trajectory lines connecting nodes chronologically */}
                {(() => {
                  const sortedNodes = [...graphData.nodes].sort((a,b) => a.year - b.year);
                  return sortedNodes.map((node, index) => {
                    if (index === sortedNodes.length - 1) return null;
                    const nextNode = sortedNodes[index + 1];

                    // Draw a nice sweeping bezier link curve between chronological nodes
                    const startX = 70 + (node.year - 2016) * 55;
                    const startY = 150 + (index % 2 === 0 ? -60 : 60);
                    const endX = 70 + (nextNode.year - 2016) * 55;
                    const endY = 150 + ((index + 1) % 2 === 0 ? -60 : 60);

                    return (
                      <path
                        key={`traj-path-${index}`}
                        d={`M ${startX} ${startY} C ${(startX+endX)/2} ${startY}, ${(startX+endX)/2} ${endY}, ${endX} ${endY}`}
                        fill="none"
                        stroke="rgba(16, 185, 129, 0.4)"
                        strokeWidth="1.5"
                        strokeDasharray="4,4"
                        className="animate-[dash_10s_linear_infinite]"
                      />
                    );
                  });
                })()}

                {/* Chronological nodes */}
                {graphData.nodes.map((node, index) => {
                  const posX = 70 + (node.year - 2016) * 55;
                  const posY = 150 + (index % 2 === 0 ? -60 : 60);
                  const isSelected = selectedNodeId === node.id;
                  const isHovered = hoveredNodeId === node.id;

                  return (
                    <g 
                      key={`timeline-node-${node.id}`}
                      className="cursor-pointer transition-transform duration-300"
                      onClick={() => {
                        setSelectedNodeId(node.id);
                        if (onNodeSelect) onNodeSelect(node.id);
                      }}
                      onMouseEnter={() => setHoveredNodeId(node.id)}
                      onMouseLeave={() => setHoveredNodeId('')}
                    >
                      {/* Inner connection line to baseline axis */}
                      <line x1={posX} y1={posY} x2={posX} y2="250" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                      
                      {/* Pulse circle for highlight */}
                      {(isSelected || isHovered) && (
                        <circle cx={posX} cy={posY} r="14" fill="none" stroke="#10b981" strokeWidth="2" strokeOpacity="0.4" filter="url(#glow)" />
                      )}

                      <circle cx={posX} cy={posY} r="8" fill={isSelected ? '#10b981' : '#1e293b'} stroke="#10b981" strokeWidth="2" />
                      
                      <text 
                        x={posX} 
                        y={posY + (index % 2 === 0 ? -14 : 20)} 
                        textAnchor="middle" 
                        fill="#f8fafc" 
                        fontSize="8px" 
                        fontWeight="bold" 
                        className="drop-shadow-lg"
                      >
                        {node.label.length > 20 ? `${node.label.slice(0, 17)}...` : node.label}
                      </text>
                    </g>
                  );
                })}
              </>
            )}
          </svg>
        </div>
      </div>

      {/* 3. Right Node Detail Pane (Inspired by Power BI visual tooltip/detail panels) */}
      <div className="lg:col-span-1 bg-background/50 border border-border-subtle/50 rounded-2xl p-5 flex flex-col justify-between h-full select-none overflow-y-auto">
        <div className="space-y-5">
          <div className="flex items-center gap-2 border-b border-border/10 pb-3">
            <BookOpen className="text-accent" size={16} />
            <span className="text-[10px] font-bold text-text-primary uppercase tracking-widest">Metadata Panel</span>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeNode.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {/* Node Title & Authors */}
              <div className="space-y-1">
                <span className={cn(
                  "px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider",
                  activeNode.type === 'core' ? "bg-rose-500/10 text-rose-400 border border-rose-500/20" :
                  activeNode.type === 'concept' ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                  "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                )}>
                  {activeNode.type.toUpperCase()} NODE
                </span>
                <h4 className="text-sm font-bold text-text-primary leading-snug mt-1.5">{activeNode.label}</h4>
                <p className="text-[10px] text-text-dim italic">Authors: {activeNode.authors.join(', ')}</p>
              </div>

              {/* Attributes grid */}
              <div className="grid grid-cols-2 gap-3 border-y border-border/10 py-3.5 font-mono text-[10px]">
                <div className="space-y-1.5">
                  <span className="text-[8px] text-text-dim uppercase font-bold tracking-wider flex items-center gap-1">
                    <Calendar size={10} /> Year
                  </span>
                  <p className="text-text-primary font-bold">{activeNode.year}</p>
                </div>
                <div className="space-y-1.5">
                  <span className="text-[8px] text-text-dim uppercase font-bold tracking-wider flex items-center gap-1">
                    <Maximize2 size={10} /> Domain
                  </span>
                  <p className="text-accent font-bold truncate">{activeNode.domain}</p>
                </div>
                <div className="space-y-1.5">
                  <span className="text-[8px] text-text-dim uppercase font-bold tracking-wider flex items-center gap-1">
                    <Award size={10} /> Impact
                  </span>
                  <p className="text-text-primary font-bold">{activeNode.citationsCount.toLocaleString()} citations</p>
                </div>
                <div className="space-y-1.5">
                  <span className="text-[8px] text-text-dim uppercase font-bold tracking-wider flex items-center gap-1">
                    <Activity size={10} /> Relevance
                  </span>
                  <p className="text-emerald-400 font-bold">{activeNode.relevance}%</p>
                </div>
              </div>

              {/* Abstract Context */}
              <div className="space-y-2">
                <span className="text-[8px] text-text-dim uppercase font-bold tracking-wider flex items-center gap-1">
                  <BookOpen size={10} /> Semantic Abstract / Takeaway
                </span>
                <p className="text-xs text-text-secondary leading-relaxed bg-surface-subtle border border-border-subtle p-3 rounded-xl italic">
                  "{activeNode.abstract}"
                </p>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Action Button */}
        <button 
          onClick={() => {
            if (onNodeSelect) onNodeSelect(activeNode.id);
          }}
          className="w-full flex items-center justify-center gap-2 py-3 bg-accent/10 hover:bg-accent text-accent hover:text-primary-foreground border border-accent/20 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all shadow-[0_0_15px_rgba(99,102,241,0.1)] hover:shadow-[0_0_20px_rgba(99,102,241,0.3)] mt-4 shrink-0"
        >
          Explore Semantic Nodes
          <ChevronRight size={12} />
        </button>
      </div>
    </div>
  );
}
