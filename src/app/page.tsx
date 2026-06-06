"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import dynamic from "next/dynamic";
import { forceCollide } from "d3-force";
import { 
  Network,
  Briefcase, 
  Terminal, 
  Cpu, 
  Sparkles, 
  Search, 
  SlidersHorizontal, 
  Sun, 
  Moon, 
  Mail, 
  ArrowRight,
  Focus,
  Maximize2,
  Download,
  Activity,
  Compass,
  FolderKanban,
  Database,
  Lightbulb,
  Clock,
  User,
  Sliders
} from "lucide-react";
import DetailSidebar from "@/components/DetailSidebar";

// Node definition matching build pipeline
interface NodeData {
  id: string;
  title: string;
  type: "project" | "tech" | "concept";
  status: "completed" | "in-progress" | "idea" | "long-term";
  ai_involvement: number;
  motivation: string;
  purpose: string;
  content: string;
  tech_stack: string[];
  concepts: string[];
  related_nodes: { id: string; type: string }[];
  x?: number;
  y?: number;
}

// Link definition
interface LinkData {
  source: string | NodeData;
  target: string | NodeData;
  type: "implements" | "belongs_to" | "inspired_by" | "optimize_for";
}

// Graph data structure
interface GraphData {
  nodes: NodeData[];
  links: LinkData[];
}

// Dynamically import the ForceGraph2D component with SSR disabled
const ForceGraph2D = dynamic(
  () => import("react-force-graph-2d").then((mod) => mod.default),
  {
    ssr: false,
    loading: () => (
      <div className="graph-loading-overlay">
        <div className="spinner-icon"></div>
        <span className="spinner-text">渲染网络拓扑结构中...</span>
      </div>
    ),
  }
);

// Custom Canvas drawing for node symbols based on ID/Category (Option 1 theme)
const drawNodeIconSymbol = (
  ctx: CanvasRenderingContext2D, 
  id: string, 
  type: string, 
  cx: number, 
  cy: number
) => {
  const normId = id.toLowerCase();
  
  if (normId.includes("python")) {
    // Python dual snakes logo representation
    ctx.lineWidth = 1.2;
    ctx.strokeStyle = "#3b82f6";
    ctx.beginPath();
    ctx.arc(cx - 1.5, cy - 1.5, 3.5, Math.PI * 0.5, Math.PI * 1.5);
    ctx.lineTo(cx, cy - 5);
    ctx.stroke();
    
    ctx.strokeStyle = "#f59e0b";
    ctx.beginPath();
    ctx.arc(cx + 1.5, cy + 1.5, 3.5, Math.PI * 1.5, Math.PI * 0.5);
    ctx.lineTo(cx, cy + 5);
    ctx.stroke();
  } 
  else if (normId.includes("pytorch")) {
    // PyTorch flame logo
    ctx.fillStyle = "#EE4C2C";
    ctx.beginPath();
    ctx.moveTo(cx, cy - 5);
    ctx.lineTo(cx + 3, cy);
    ctx.lineTo(cx + 1, cy + 5);
    ctx.lineTo(cx - 3, cy + 2);
    ctx.closePath();
    ctx.fill();
  } 
  else if (normId.includes("networkx")) {
    // Network topology dots
    ctx.strokeStyle = "#3b82f6";
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(cx - 3, cy - 3); ctx.lineTo(cx + 3, cy + 3);
    ctx.moveTo(cx + 3, cy - 3); ctx.lineTo(cx - 3, cy + 3);
    ctx.stroke();
    
    ctx.fillStyle = "#3b82f6";
    ctx.beginPath(); ctx.arc(cx - 3, cy - 3, 1.8, 0, 2 * Math.PI); ctx.fill();
    ctx.beginPath(); ctx.arc(cx + 3, cy + 3, 1.8, 0, 2 * Math.PI); ctx.fill();
    ctx.beginPath(); ctx.arc(cx + 3, cy - 3, 1.8, 0, 2 * Math.PI); ctx.fill();
    ctx.beginPath(); ctx.arc(cx - 3, cy + 3, 1.8, 0, 2 * Math.PI); ctx.fill();
  } 
  else if (normId.includes("neo4j")) {
    // Neo4j connections
    ctx.fillStyle = "#005a9e";
    ctx.beginPath();
    ctx.arc(cx, cy - 2, 2.5, 0, 2 * Math.PI);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx - 3, cy + 3, 2, 0, 2 * Math.PI);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx + 3, cy + 3, 2, 0, 2 * Math.PI);
    ctx.fill();
    ctx.strokeStyle = "#005a9e";
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(cx, cy - 2); ctx.lineTo(cx - 3, cy + 3);
    ctx.moveTo(cx, cy - 2); ctx.lineTo(cx + 3, cy + 3);
    ctx.stroke();
  } 
  else if (normId.includes("nlp")) {
    // Natural language brain
    ctx.strokeStyle = "#8b5cf6";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(cx - 1.5, cy, 3.5, 4.5, 0, 0, 2 * Math.PI);
    ctx.ellipse(cx + 1.5, cy, 3.5, 4.5, 0, 0, 2 * Math.PI);
    ctx.stroke();
  } 
  else if (normId.includes("知识图谱") || normId.includes("knowledge-graph")) {
    // Graph network nodes
    ctx.strokeStyle = "#a855f7";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, 4, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.fillStyle = "#a855f7";
    ctx.beginPath();
    ctx.arc(cx - 3, cy - 1, 1.5, 0, 2 * Math.PI);
    ctx.arc(cx + 3, cy + 1, 1.5, 0, 2 * Math.PI);
    ctx.fill();
  } 
  else if (normId.includes("graphrag")) {
    // Graph retrieval magnifying glass
    ctx.strokeStyle = "#06b6d4";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(cx - 1, cy - 1, 3, 0, 2 * Math.PI);
    ctx.moveTo(cx + 1, cy + 1);
    ctx.lineTo(cx + 4.5, cy + 4.5);
    ctx.stroke();
  } 
  else if (normId.includes("text2kg")) {
    // Extraction arrow from document
    ctx.strokeStyle = "#2563eb";
    ctx.lineWidth = 1;
    ctx.strokeRect(cx - 4, cy - 4.5, 8, 9);
    ctx.beginPath();
    ctx.moveTo(cx - 2, cy); ctx.lineTo(cx + 2, cy);
    ctx.lineTo(cx, cy + 2);
    ctx.stroke();
  } 
  else if (normId.includes("mindflow")) {
    // Visual thoughts flow
    ctx.strokeStyle = "#f97316";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(cx - 5, cy - 3);
    ctx.bezierCurveTo(cx - 2, cy - 5, cx + 2, cy - 1, cx + 5, cy - 3);
    ctx.moveTo(cx - 5, cy + 1);
    ctx.bezierCurveTo(cx - 2, cy - 1, cx + 2, cy + 3, cx + 5, cy + 1);
    ctx.stroke();
  } 
  else if (normId.includes("diffgraph")) {
    // Difference/delta network
    ctx.strokeStyle = "#06b6d4";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(cx, cy - 4);
    ctx.lineTo(cx + 4.5, cy + 3.5);
    ctx.lineTo(cx - 4.5, cy + 3.5);
    ctx.closePath();
    ctx.stroke();
  } 
  else {
    // Category default fallbacks
    ctx.lineWidth = 1.2;
    if (type === "project") {
      ctx.strokeStyle = "#2563eb";
      ctx.strokeRect(cx - 4, cy - 4, 8, 8);
    } else if (type === "tech") {
      ctx.strokeStyle = "#10b981";
      ctx.beginPath();
      ctx.moveTo(cx - 4, cy); ctx.lineTo(cx + 4, cy);
      ctx.moveTo(cx, cy - 4); ctx.lineTo(cx, cy + 4);
      ctx.stroke();
    } else {
      ctx.strokeStyle = "#8b5cf6";
      ctx.beginPath();
      ctx.arc(cx, cy, 4, 0, 2 * Math.PI);
      ctx.stroke();
    }
  }
};

// 3D Isometric Cube Drawing Helper for the central node
const drawIsometricCube = (ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number) => {
  ctx.save();
  ctx.lineWidth = 0.8;
  ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
  
  const h = size;
  const w = size * 0.86;

  // Left Face
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx - w, cy - h / 2);
  ctx.lineTo(cx - w, cy + h / 2);
  ctx.lineTo(cx, cy + h);
  ctx.closePath();
  ctx.fillStyle = "rgba(6, 182, 212, 0.45)";
  ctx.fill();
  ctx.stroke();

  // Right Face
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx + w, cy - h / 2);
  ctx.lineTo(cx + w, cy + h / 2);
  ctx.lineTo(cx, cy + h);
  ctx.closePath();
  ctx.fillStyle = "rgba(37, 99, 235, 0.65)";
  ctx.fill();
  ctx.stroke();

  // Top Face
  ctx.beginPath();
  ctx.moveTo(cx, cy - h);
  ctx.lineTo(cx - w, cy - h / 2);
  ctx.lineTo(cx, cy);
  ctx.lineTo(cx + w, cy - h / 2);
  ctx.closePath();
  ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
  ctx.fill();
  ctx.stroke();

  ctx.restore();
};

export default function Home() {
  const fgRef = useRef<any>(null);

  // States
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], links: [] });
  const [selectedNode, setSelectedNode] = useState<NodeData | null>(null);
  const [hoveredNode, setHoveredNode] = useState<NodeData | null>(null);
  
  // Theme state
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  
  // Filtering & Interaction States
  const [activeSidebarTab, setActiveSidebarTab] = useState<string>("network");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [aiFilterVal, setAiFilterVal] = useState<number>(0);
  const [showFiltersDropdown, setShowFiltersDropdown] = useState<boolean>(false);
  
  // Fused Option 2 category filters
  const [categoryFilters, setCategoryFilters] = useState({
    project: true,
    tech: true,
    concept: true
  });
  
  // Focus & Expand states
  const [isFocusMode, setIsFocusMode] = useState<boolean>(false);
  const [isExpandMode, setIsExpandMode] = useState<boolean>(false);

  // Load Graph Data
  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await fetch("/data/graph.json");
        const data: GraphData = await res.json();
        
        // Initial coordinates setting for clean dispersion animation
        const bangData: GraphData = {
          nodes: data.nodes.map((node) => ({
            ...node,
            x: node.x !== undefined ? node.x : (Math.random() - 0.5) * 50,
            y: node.y !== undefined ? node.y : (Math.random() - 0.5) * 50,
          })),
          links: data.links,
        };

        setGraphData(bangData);
        
        // Auto-select the central core project node initially
        const centralProject = data.nodes.find(n => n.id === "graphmind");
        if (centralProject) {
          setSelectedNode(centralProject);
        }
      } catch (err) {
        console.error("Failed to load graph data:", err);
      }
    };
    loadData();
  }, []);

  // Configure D3 forces dynamically
  useEffect(() => {
    if (fgRef.current && graphData.nodes.length > 0) {
      fgRef.current.d3Force(
        "collide",
        forceCollide((node: any) => {
          if (node.id === "graphmind") {
            return 75; // Large collision bounds for center node
          }
          return 35; // Surrounding nodes boundary
        })
      );

      fgRef.current.d3Force("charge").strength(-240);
      fgRef.current.d3Force("link").distance((link: any) => {
        if (link.type === "belongs_to") return 75;
        if (link.type === "implements") return 65;
        return 70;
      });

      fgRef.current.d3ReheatSimulation();
    }
  }, [graphData]);

  // Compute category counts for category filters (Option 2 style)
  const categoryCounts = useMemo(() => {
    const counts = { project: 0, tech: 0, concept: 0 };
    graphData.nodes.forEach(node => {
      if (node.type in counts) {
        counts[node.type as keyof typeof counts]++;
      }
    });
    return counts;
  }, [graphData.nodes]);

  // Combined Filters Logic: Tab, Search, AI range slider, Category checkboxes
  const filteredNodes = useMemo(() => {
    return graphData.nodes.filter((node) => {
      // 1. Sidebar tab filter
      if (activeSidebarTab === "projects" && node.type !== "project") return false;
      if (activeSidebarTab === "technologies" && node.type !== "tech") return false;
      if (activeSidebarTab === "concepts" && node.type !== "concept") return false;
      
      // 2. Search query filter
      if (searchQuery.trim() !== "") {
        const query = searchQuery.toLowerCase();
        const matchesTitle = node.title.toLowerCase().includes(query);
        const matchesId = node.id.toLowerCase().includes(query);
        const matchesMotivation = node.motivation?.toLowerCase().includes(query) || false;
        const matchesTech = node.tech_stack?.some(t => t.toLowerCase().includes(query)) || false;
        if (!matchesTitle && !matchesId && !matchesMotivation && !matchesTech) return false;
      }
      
      // 3. AI involvement filter (Only filters projects, keeps tech/concept nodes)
      if (node.type === "project" && node.ai_involvement < aiFilterVal) {
        return false;
      }
      
      // 4. Checkbox category filters (Option 2)
      if (!categoryFilters[node.type as keyof typeof categoryFilters]) {
        return false;
      }
      
      return true;
    });
  }, [graphData.nodes, activeSidebarTab, searchQuery, aiFilterVal, categoryFilters]);

  // Filter links where both endpoints are visible
  const filteredLinks = useMemo(() => {
    const nodeIds = new Set(filteredNodes.map((n) => n.id));
    return graphData.links.filter((link) => {
      const sourceId = typeof link.source === "object" ? (link.source as NodeData).id : (link.source as string);
      const targetId = typeof link.target === "object" ? (link.target as NodeData).id : (link.target as string);
      return nodeIds.has(sourceId) && nodeIds.has(targetId);
    });
  }, [graphData.links, filteredNodes]);

  // Compute highlighting sets (1st and 2nd degree based on Expand mode)
  const highlightedNodeIds = useMemo(() => {
    const set = new Set<string>();
    if (!selectedNode) return set;

    set.add(selectedNode.id);

    // First degree connections
    const firstDegree = new Set<string>();
    for (const link of graphData.links) {
      const sourceId = typeof link.source === "object" ? (link.source as NodeData).id : (link.source as string);
      const targetId = typeof link.target === "object" ? (link.target as NodeData).id : (link.target as string);

      if (sourceId === selectedNode.id) {
        firstDegree.add(targetId);
        set.add(targetId);
      } else if (targetId === selectedNode.id) {
        firstDegree.add(sourceId);
        set.add(sourceId);
      }
    }

    // Second degree connections if Expand Mode is active
    if (isExpandMode) {
      for (const link of graphData.links) {
        const sourceId = typeof link.source === "object" ? (link.source as NodeData).id : (link.source as string);
        const targetId = typeof link.target === "object" ? (link.target as NodeData).id : (link.target as string);

        if (firstDegree.has(sourceId) && !set.has(targetId)) {
          set.add(targetId);
        } else if (firstDegree.has(targetId) && !set.has(sourceId)) {
          set.add(sourceId);
        }
      }
    }

    return set;
  }, [selectedNode, isExpandMode, graphData.links]);

  // Handles camera focusing on search/selection
  const handleSelectNodeById = (nodeId: string) => {
    const node = graphData.nodes.find(
      (n) => n.id.toLowerCase() === nodeId.toLowerCase() || n.title.toLowerCase() === nodeId.toLowerCase()
    );
    if (node && fgRef.current) {
      setSelectedNode(node);
      
      // Center camera and zoom in smoothly
      setTimeout(() => {
        if (node.x !== undefined && node.y !== undefined) {
          fgRef.current.centerAt(node.x, node.y, 800);
          fgRef.current.zoom(node.id === "graphmind" ? 1.8 : 2.5, 800);
        }
      }, 50);
    }
  };

  const handleNodeClick = (node: any) => {
    setSelectedNode(node);
    if (fgRef.current && node.x !== undefined && node.y !== undefined) {
      fgRef.current.centerAt(node.x, node.y, 800);
      fgRef.current.zoom(node.id === "graphmind" ? 1.8 : 2.6, 800);
    }
  };

  const handleBackgroundClick = () => {
    if (fgRef.current) {
      fgRef.current.zoomToFit(800, 80);
    }
  };

  // Keyboard shortcut listener for Search (⌘ K or Ctrl K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        const searchInput = document.getElementById("global-search-input");
        if (searchInput) searchInput.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Custom Light-themed Canvas Drawing for Nodes (Option 1 details)
  const drawNode = (node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const isSelected = selectedNode && selectedNode.id === node.id;
    const isHovered = hoveredNode && hoveredNode.id === node.id;
    
    // Focus Mode dimming logic
    const isHighlighted = !isFocusMode || highlightedNodeIds.size === 0 || highlightedNodeIds.has(node.id);
    
    ctx.save();
    ctx.globalAlpha = isHighlighted ? 1.0 : 0.12;

    // 🌟 1. SPECIAL CORE CENTER NODE (GraphMind Octagon)
    if (node.id === "graphmind") {
      const size = 44;
      ctx.beginPath();
      // Draw octagon bounds
      for (let i = 0; i < 8; i++) {
        const angle = (Math.PI / 4) * i + Math.PI / 8;
        const ox = node.x + size * Math.cos(angle);
        const oy = node.y + size * Math.sin(angle);
        if (i === 0) ctx.moveTo(ox, oy);
        else ctx.lineTo(ox, oy);
      }
      ctx.closePath();

      // Soft glow shadow
      ctx.shadowBlur = 20;
      ctx.shadowColor = isDarkMode ? "rgba(59, 130, 246, 0.4)" : "rgba(37, 99, 235, 0.25)";

      // Gradient Fill (Deep blue base)
      const gradient = ctx.createRadialGradient(node.x, node.y, 5, node.x, node.y, size);
      if (isDarkMode) {
        gradient.addColorStop(0, "#0c1e3d");
        gradient.addColorStop(1, "#030612");
      } else {
        gradient.addColorStop(0, "#2563eb");
        gradient.addColorStop(0.7, "#1d4ed8");
        gradient.addColorStop(1, "#1e3a8a");
      }
      ctx.fillStyle = gradient;
      ctx.fill();

      // Octagon outline
      ctx.shadowBlur = 0; // reset
      ctx.lineWidth = isSelected ? 3.5 : isHovered ? 2.5 : 1.5;
      ctx.strokeStyle = isSelected || isHovered ? (isDarkMode ? "#00f2ff" : "#3b82f6") : "rgba(255, 255, 255, 0.4)";
      ctx.stroke();

      // Draw Cube icon inside octagon
      drawIsometricCube(ctx, node.x, node.y - 10, 9);

      // Write text titles inside
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 8.5px Outfit, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillText("GraphMind", node.x, node.y + 6);
      
      ctx.font = "500 5.5px sans-serif";
      ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
      ctx.fillText("知识图谱构建工具", node.x, node.y + 16);

      // 92% AI Involvement pill
      const capW = 38;
      const capH = 8;
      const cx = node.x - capW / 2;
      const cy = node.y + 24;
      ctx.beginPath();
      ctx.roundRect(cx, cy, capW, capH, 4);
      ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
      ctx.fill();
      ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
      ctx.lineWidth = 0.5;
      ctx.stroke();

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 4.8px sans-serif";
      ctx.fillText("92% AI", node.x, cy + 1.8);

      ctx.restore();
      return;
    }

    // 🌟 2. STANDARD SATELLITE NODES (White circle card)
    const r = isSelected || isHovered ? 16 : 14;
    let categoryColor = "#2563eb"; // blue for project
    if (node.type === "tech") categoryColor = "#10b981"; // green
    else if (node.type === "concept") categoryColor = "#8b5cf6"; // purple

    // Subtle drop shadow for 3D card layout
    ctx.shadowBlur = 10;
    ctx.shadowColor = isDarkMode ? "rgba(0, 0, 0, 0.5)" : "rgba(148, 163, 184, 0.25)";
    ctx.shadowOffsetY = 4;

    // Fill white card background
    ctx.beginPath();
    ctx.arc(node.x, node.y, r, 0, 2 * Math.PI);
    ctx.fillStyle = isDarkMode ? "#0d1527" : "#ffffff";
    ctx.fill();

    // Border stroke with category color
    ctx.shadowBlur = 0; // reset
    ctx.shadowOffsetY = 0;
    ctx.lineWidth = isSelected ? 3.0 : isHovered ? 2.0 : 1.0;
    ctx.strokeStyle = isSelected || isHovered ? categoryColor : (isDarkMode ? "rgba(255,255,255,0.1)" : "rgba(226, 232, 240, 0.8)");
    ctx.stroke();

    // Draw customized inner symbols
    drawNodeIconSymbol(ctx, node.id, node.type, node.x, node.y);

    // Draw labels underneath
    const fontSize = Math.max(9 / globalScale, 6.5);
    ctx.font = `600 ${fontSize}px Outfit, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    
    // Label colors
    ctx.fillStyle = isSelected ? categoryColor : (isDarkMode ? "#f3f4f6" : "#1e293b");
    
    // Main Title
    ctx.fillText(node.title, node.x, node.y + r + 5);

    // Category / AI Involvement Subtitle
    let subtitle = "";
    if (node.type === "project") {
      subtitle = `${node.ai_involvement}% AI`;
    } else if (node.type === "tech") {
      subtitle = "技术栈";
    } else {
      subtitle = "理论概念";
    }
    
    ctx.font = `500 ${fontSize * 0.8}px sans-serif`;
    ctx.fillStyle = isSelected ? categoryColor : (isDarkMode ? "#6b7280" : "#64748b");
    ctx.fillText(subtitle, node.x, node.y + r + 5 + fontSize + 1);

    ctx.restore();
  };

  // Curved relationship connections logic
  const getLinkColor = (link: any) => {
    const sourceId = typeof link.source === "object" ? link.source.id : link.source;
    const targetId = typeof link.target === "object" ? link.target.id : link.target;
    
    const isHighlighted = !isFocusMode || 
                         (highlightedNodeIds.has(sourceId) && highlightedNodeIds.has(targetId));

    if (!isHighlighted) return isDarkMode ? "rgba(255, 255, 255, 0.02)" : "rgba(0, 0, 0, 0.02)";

    switch (link.type) {
      case "implements": return isDarkMode ? "rgba(59, 130, 246, 0.35)" : "rgba(37, 99, 235, 0.25)";
      case "belongs_to": return isDarkMode ? "rgba(168, 85, 247, 0.3)" : "rgba(139, 92, 246, 0.2)";
      case "inspired_by": return isDarkMode ? "rgba(16, 185, 129, 0.35)" : "rgba(16, 185, 129, 0.25)";
      case "optimize_for": return isDarkMode ? "rgba(249, 115, 22, 0.35)" : "rgba(249, 115, 22, 0.25)";
      default: return "rgba(148, 163, 184, 0.15)";
    }
  };

  const getLinkWidth = (link: any) => {
    return link.type === "optimize_for" ? 1.5 : 0.8;
  };

  const getLinkLineDash = (link: any) => {
    if (link.type === "belongs_to") return [3, 3];
    if (link.type === "inspired_by") return [1, 2];
    return null;
  };

  // Animate flow particles along relations
  const getLinkParticles = (link: any) => {
    const sourceId = typeof link.source === "object" ? link.source.id : link.source;
    const targetId = typeof link.target === "object" ? link.target.id : link.target;
    const isHighlighted = !isFocusMode || 
                         (highlightedNodeIds.has(sourceId) && highlightedNodeIds.has(targetId));

    if (!isHighlighted) return 0;
    if (link.type === "belongs_to") return 0; // Keep hierarchy links static
    return link.type === "optimize_for" ? 2 : 1;
  };

  const getLinkParticleSpeed = (link: any) => {
    return link.type === "optimize_for" ? 0.012 : 0.007;
  };

  const getLinkParticleColor = (link: any) => {
    switch (link.type) {
      case "implements": return "var(--color-primary)";
      case "inspired_by": return "var(--color-green)";
      case "optimize_for": return "var(--color-orange)";
      default: return "var(--color-purple)";
    }
  };

  // Export data triggered by button
  const handleExportData = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(graphData, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "nexusmind_graph.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Sparkline values for bottom stats
  const sparklineData = "10,18,15,28,32,45,40,55,62,71";

  return (
    <div className={`theme-container ${isDarkMode ? "dark-theme" : ""}`}>
      {/* Ambient background blur spots */}
      <div className="ambient-glow-container">
        <div className="glow-blob glow-1"></div>
        <div className="glow-blob glow-2"></div>
        <div className="glow-blob glow-3"></div>
      </div>

      {/* 1. LEFT VERTICAL NAVIGATION BAR */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-circle">N</div>
          <h1 className="logo-text-h1">Neural Map</h1>
        </div>

        <nav className="sidebar-nav">
          <a 
            href="#" 
            onClick={(e) => { e.preventDefault(); setActiveSidebarTab("network"); }}
            className={`sidebar-link ${activeSidebarTab === "network" ? "active" : ""}`}
          >
            <Network className="sidebar-link-icon" />
            <span>关系星图</span>
          </a>
          <a 
            href="#" 
            onClick={(e) => { e.preventDefault(); setActiveSidebarTab("projects"); }}
            className={`sidebar-link ${activeSidebarTab === "projects" ? "active" : ""}`}
          >
            <Briefcase className="sidebar-link-icon" />
            <span>项目列表</span>
          </a>
          <a 
            href="#" 
            onClick={(e) => { e.preventDefault(); setActiveSidebarTab("technologies"); }}
            className={`sidebar-link ${activeSidebarTab === "technologies" ? "active" : ""}`}
          >
            <Terminal className="sidebar-link-icon" />
            <span>技术选型</span>
          </a>
          <a 
            href="#" 
            onClick={(e) => { e.preventDefault(); setActiveSidebarTab("concepts"); }}
            className={`sidebar-link ${activeSidebarTab === "concepts" ? "active" : ""}`}
          >
            <Cpu className="sidebar-link-icon" />
            <span>知识概念</span>
          </a>
          <a 
            href="#" 
            onClick={(e) => { e.preventDefault(); }}
            className="sidebar-link"
          >
            <Clock className="sidebar-link-icon" />
            <span>构建历程</span>
          </a>
          <a 
            href="#" 
            onClick={(e) => { e.preventDefault(); }}
            className="sidebar-link"
          >
            <User className="sidebar-link-icon" />
            <span>关于作者</span>
          </a>
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-footer-row">
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)} 
              className="sidebar-icon-btn"
              title={isDarkMode ? "切换到亮色模式" : "切换到暗色模式"}
            >
              {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <a 
              href="https://github.com/Keyuuuuuu/neural-map" 
              target="_blank" 
              rel="noopener noreferrer"
              className="sidebar-icon-btn"
              title="GitHub 仓库"
            >
              <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"></path><path d="M9 18c-4.51 2-5-2-7-2"></path></svg>
            </a>
            <a 
              href="mailto:contact@kenoma.me" 
              className="sidebar-icon-btn"
              title="邮件联系"
            >
              <Mail size={18} />
            </a>
          </div>
        </div>
      </aside>

      {/* 2. MAIN APP CONTENT CONTAINER */}
      <div className="app-container">
        <main className="main-layout">
          
          {/* CONTENT COLUMN: Header, Force Graph Canvas, Stats Board */}
          <section className="content-column">
            
            {/* Header Bar */}
            <div className="header-bar">
              <div className="header-title-section">
                <div className="header-title-row">
                  <h2 className="header-title-text">My Knowledge Graph</h2>
                  <Sparkles className="spark-icon" />
                </div>
                <span className="header-subtitle">探索我的项目、技术与知识网络</span>
              </div>

              {/* Top controls panel (Search, AI Range slider, Filters, Profile) */}
              <div className="header-controls">
                
                {/* Global node search */}
                <div className="search-wrapper">
                  <Search size={16} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--text-secondary)" }} />
                  <input 
                    type="text" 
                    id="global-search-input"
                    className="search-input"
                    placeholder="Search projects, tech, concepts..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <span className="search-shortcut">⌘ K</span>
                </div>

                {/* AI Involvement range slider */}
                <div className="ai-slider-wrapper">
                  <span className="ai-slider-label">AI Involvement</span>
                  <div className="slider-container">
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      value={aiFilterVal}
                      onChange={(e) => setAiFilterVal(Number(e.target.value))}
                      className="custom-slider"
                    />
                  </div>
                  <span className="slider-percent-lbl">{aiFilterVal}%</span>
                </div>

                {/* Fused Option 2 Filters Button */}
                <div style={{ position: "relative" }}>
                  <button 
                    onClick={() => setShowFiltersDropdown(!showFiltersDropdown)}
                    className={`btn-filter ${showFiltersDropdown ? "active" : ""}`}
                  >
                    <SlidersHorizontal size={15} />
                    <span>Filters</span>
                    {Object.values(categoryFilters).filter(v => !v).length > 0 && (
                      <span className="filter-badge">
                        {Object.values(categoryFilters).filter(v => !v).length}
                      </span>
                    )}
                  </button>

                  {/* Fused Option 2 Filters Dropdown */}
                  {showFiltersDropdown && (
                    <div className="filters-dropdown">
                      <span className="filters-section-title">按节点类别筛选</span>
                      <div className="filters-list">
                        <label className="filter-checkbox-label">
                          <div className="filter-checkbox-left">
                            <input 
                              type="checkbox" 
                              checked={categoryFilters.project}
                              onChange={() => setCategoryFilters({...categoryFilters, project: !categoryFilters.project})}
                            />
                            <div className="checkbox-custom"></div>
                            <span>项目 (Projects)</span>
                          </div>
                          <span className="filter-count-badge">{categoryCounts.project}</span>
                        </label>
                        <label className="filter-checkbox-label">
                          <div className="filter-checkbox-left">
                            <input 
                              type="checkbox" 
                              checked={categoryFilters.tech}
                              onChange={() => setCategoryFilters({...categoryFilters, tech: !categoryFilters.tech})}
                            />
                            <div className="checkbox-custom"></div>
                            <span>技术栈 (Technologies)</span>
                          </div>
                          <span className="filter-count-badge">{categoryCounts.tech}</span>
                        </label>
                        <label className="filter-checkbox-label">
                          <div className="filter-checkbox-left">
                            <input 
                              type="checkbox" 
                              checked={categoryFilters.concept}
                              onChange={() => setCategoryFilters({...categoryFilters, concept: !categoryFilters.concept})}
                            />
                            <div className="checkbox-custom"></div>
                            <span>理论概念 (Concepts)</span>
                          </div>
                          <span className="filter-count-badge">{categoryCounts.concept}</span>
                        </label>
                      </div>

                      <span className="filters-section-title">图谱对焦选项</span>
                      <div className="filters-list">
                        <label className="filter-checkbox-label">
                          <div className="filter-checkbox-left">
                            <input 
                              type="checkbox" 
                              checked={isFocusMode}
                              onChange={() => setIsFocusMode(!isFocusMode)}
                            />
                            <div className="checkbox-custom"></div>
                            <span>开启高亮聚焦模型 (Focus)</span>
                          </div>
                        </label>
                        <label className="filter-checkbox-label">
                          <div className="filter-checkbox-left">
                            <input 
                              type="checkbox" 
                              checked={isExpandMode}
                              onChange={() => setIsExpandMode(!isExpandMode)}
                            />
                            <div className="checkbox-custom"></div>
                            <span>扩展至二级连线 (Expand)</span>
                          </div>
                        </label>
                      </div>
                    </div>
                  )}
                </div>

                <div className="user-avatar" title="个人主页">
                  <span>AK</span>
                </div>
              </div>
            </div>

            {/* Center Canvas Force Graph Panel */}
            <div className="canvas-container">
              <ForceGraph2D
                ref={fgRef}
                graphData={{ nodes: filteredNodes, links: filteredLinks }}
                nodeCanvasObject={drawNode}
                nodePointerAreaPaint={(node, color, ctx) => {
                  const r = node.id === "graphmind" ? 50 : 18;
                  ctx.beginPath();
                  ctx.arc(node.x ?? 0, node.y ?? 0, r, 0, 2 * Math.PI);
                  ctx.fillStyle = color;
                  ctx.fill();
                }}
                onNodeClick={handleNodeClick}
                onNodeHover={(node) => setHoveredNode(node as NodeData | null)}
                onBackgroundClick={handleBackgroundClick}
                linkColor={getLinkColor}
                linkWidth={getLinkWidth}
                linkLineDash={getLinkLineDash}
                linkDirectionalParticles={getLinkParticles}
                linkDirectionalParticleSpeed={getLinkParticleSpeed}
                linkDirectionalParticleWidth={1.5}
                linkDirectionalParticleColor={getLinkParticleColor}
                linkCurvature={0.15} // Curved relationship lines (neural vibe)
                cooldownTicks={120}
              />

              {/* Relationship Legend (Option 1 overlay) */}
              <div className="legend-panel">
                <span className="legend-title">关系图例</span>
                <div className="legend-item">
                  <div className="legend-line" style={{ backgroundColor: "var(--color-primary)" }}></div>
                  <span>实现 (implements)</span>
                </div>
                <div className="legend-item">
                  <div className="legend-line" style={{ border: "1px dashed var(--color-purple)", height: 0 }}></div>
                  <span>属于 (belongs_to)</span>
                </div>
                <div className="legend-item">
                  <div className="legend-line" style={{ border: "1px dotted var(--color-green)", height: 0 }}></div>
                  <span>启发 (inspired_by)</span>
                </div>
                <div className="legend-item">
                  <div className="legend-line" style={{ border: "1px dashed var(--color-orange)", height: 0 }}></div>
                  <span>优化 (optimize_for)</span>
                </div>
              </div>

              {/* Camera navigation controls overlay */}
              <div className="toolbox-panel">
                <button 
                  onClick={() => setIsFocusMode(!isFocusMode)}
                  className={`toolbox-btn ${isFocusMode ? "active" : ""}`}
                  title="鼠标对焦模式"
                >
                  <Sliders size={15} />
                </button>
                <button 
                  onClick={() => fgRef.current && fgRef.current.zoom(fgRef.current.zoom() * 1.3, 400)}
                  className="toolbox-btn"
                  title="放大"
                >
                  <span>+</span>
                </button>
                <button 
                  onClick={() => fgRef.current && fgRef.current.zoom(fgRef.current.zoom() / 1.3, 400)}
                  className="toolbox-btn"
                  title="缩小"
                >
                  <span>−</span>
                </button>
                <button 
                  onClick={handleBackgroundClick}
                  className="toolbox-btn"
                  title="自适应缩放"
                >
                  <Maximize2 size={13} />
                </button>
              </div>

              <div className="canvas-hint">
                <Activity size={12} style={{ marginRight: "4px", display: "inline", verticalAlign: "middle" }} /> 
                <span>使用滚轮缩放，拖拽背景平移</span>
              </div>
            </div>

            {/* Bottom Panel (High-level Stats and Actions) */}
            <div className="bottom-panel">
              
              {/* Stats Board Card */}
              <div className="stats-board-card">
                <div className="stats-board-item">
                  <span className="stats-board-num">28</span>
                  <span className="stats-board-label">个项目</span>
                </div>
                <div className="stats-board-divider"></div>
                <div className="stats-board-item">
                  <span className="stats-board-num">42</span>
                  <span className="stats-board-label">项技术栈</span>
                </div>
                <div className="stats-board-divider"></div>
                <div className="stats-board-item">
                  <span className="stats-board-num">16</span>
                  <span className="stats-board-label">个理论概念</span>
                </div>
                <div className="stats-board-divider"></div>
                <div className="stats-board-item">
                  <span className="stats-board-num">156</span>
                  <span className="stats-board-label">条关系</span>
                </div>
                <div className="stats-board-divider"></div>
                <div className="stats-board-item sparkline-container">
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <span className="stats-board-num">71%</span>
                    <span className="stats-board-label">AI Avg. Involvement</span>
                  </div>
                  
                  {/* SVG Animated Sparkline */}
                  <svg className="sparkline-svg">
                    <defs>
                      <linearGradient id="sparkline-grad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <path 
                      className="sparkline-path" 
                      d={`M 0 20 Q 8 8, 15 15 T 30 10 T 45 5 T 60 12`}
                    />
                    <path 
                      className="sparkline-gradient"
                      d={`M 0 20 Q 8 8, 15 15 T 30 10 T 45 5 T 60 12 L 60 24 L 0 24 Z`}
                    />
                  </svg>
                </div>
              </div>

              {/* Stats right quick actions */}
              <div className="quick-actions-row">
                <button 
                  onClick={() => setIsFocusMode(!isFocusMode)}
                  className={`btn-action ${isFocusMode ? "active" : ""}`}
                >
                  <Focus size={14} />
                  <span>高亮模式</span>
                </button>
                <button 
                  onClick={() => setIsExpandMode(!isExpandMode)}
                  className={`btn-action ${isExpandMode ? "active" : ""}`}
                >
                  <Maximize2 size={14} />
                  <span>二级关系</span>
                </button>
                <button 
                  onClick={handleExportData}
                  className="btn-action"
                >
                  <Download size={14} />
                  <span>导出图谱</span>
                </button>
              </div>

            </div>

          </section>

          {/* RIGHT DETAIL SIDEBAR: Dynamic node spec dashboard */}
          <aside className="detail-sidebar-container">
            <DetailSidebar 
              selectedNode={selectedNode}
              onClose={() => setSelectedNode(null)}
              onSelectNodeById={handleSelectNodeById}
            />
          </aside>

        </main>
      </div>
    </div>
  );
}
