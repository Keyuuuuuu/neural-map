"use client";

import React, { useState, useEffect, useRef, useTransition, useMemo } from "react";
import dynamic from "next/dynamic";
import { forceCollide } from "d3-force";
import { 
  Briefcase, 
  Terminal, 
  Cpu, 
  Star, 
  Activity, 
  Workflow, 
  ArrowRight, 
  Sun, 
  Moon, 
  FolderGit2, 
  Network,
  Code2
} from "lucide-react";
import DetailSidebar from "@/components/DetailSidebar";

// Node definition
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
      <div style={styles.graphLoading}>
        <div style={styles.spinner}></div>
        <span style={styles.loadingText}>渲染网络拓扑结构中...</span>
      </div>
    ),
  }
);

// Custom Canvas drawing for circular node icons based on ID
const drawNodeIcon = (ctx: CanvasRenderingContext2D, id: string, cx: number, cy: number) => {
  const normId = id.toLowerCase();
  
  if (normId.includes("python")) {
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = "#387eb8";
    ctx.beginPath();
    ctx.arc(cx - 1.5, cy - 1.5, 3.5, Math.PI * 0.5, Math.PI * 1.5);
    ctx.lineTo(cx, cy - 5);
    ctx.stroke();
    
    ctx.strokeStyle = "#ffe052";
    ctx.beginPath();
    ctx.arc(cx + 1.5, cy + 1.5, 3.5, Math.PI * 1.5, Math.PI * 0.5);
    ctx.lineTo(cx, cy + 5);
    ctx.stroke();
  } 
  else if (normId.includes("pytorch")) {
    ctx.fillStyle = "#EE4C2C";
    ctx.beginPath();
    ctx.moveTo(cx, cy - 6);
    ctx.lineTo(cx + 3.5, cy - 1);
    ctx.lineTo(cx + 1, cy + 5);
    ctx.lineTo(cx - 3.5, cy + 2);
    ctx.closePath();
    ctx.fill();
  } 
  else if (normId.includes("networkx") || normId.includes("graph-theory")) {
    ctx.strokeStyle = "#3b82f6";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx - 4, cy - 4); ctx.lineTo(cx + 4, cy + 4);
    ctx.moveTo(cx + 4, cy - 4); ctx.lineTo(cx - 4, cy + 4);
    ctx.stroke();
    
    ctx.fillStyle = "#60a5fa";
    ctx.beginPath(); ctx.arc(cx - 4, cy - 4, 2, 0, 2 * Math.PI); ctx.fill();
    ctx.beginPath(); ctx.arc(cx + 4, cy + 4, 2, 0, 2 * Math.PI); ctx.fill();
    ctx.beginPath(); ctx.arc(cx + 4, cy - 4, 2, 0, 2 * Math.PI); ctx.fill();
    ctx.beginPath(); ctx.arc(cx - 4, cy + 4, 2, 0, 2 * Math.PI); ctx.fill();
  } 
  else if (normId.includes("faiss")) {
    ctx.strokeStyle = "#10b981";
    ctx.lineWidth = 1.2;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.ellipse(cx, cy - 3.5 + i * 3.5, 4.5, 1.5, 0, 0, 2 * Math.PI);
      ctx.stroke();
    }
  } 
  else if (normId.includes("docker")) {
    ctx.fillStyle = "#0db7ed";
    ctx.beginPath();
    ctx.ellipse(cx - 1, cy + 1, 5, 2.8, 0, 0, 2 * Math.PI);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(cx + 4, cy + 1);
    ctx.lineTo(cx + 6, cy - 2);
    ctx.lineTo(cx + 5, cy + 2);
    ctx.closePath();
    ctx.fill();
  } 
  else if (normId.includes("github")) {
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(cx, cy + 0.8, 3.8, 0, 2 * Math.PI);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(cx - 2.8, cy - 2);
    ctx.lineTo(cx - 3.8, cy - 4.5);
    ctx.lineTo(cx - 1, cy - 2);
    ctx.moveTo(cx + 2.8, cy - 2);
    ctx.lineTo(cx + 3.8, cy - 4.5);
    ctx.lineTo(cx + 1, cy - 2);
    ctx.closePath();
    ctx.fill();
  } 
  else if (normId.includes("nlp") || normId.includes("llm")) {
    ctx.strokeStyle = "#10b981";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(cx - 0.8, cy - 0.8, 4.2, 0, 2 * Math.PI);
    ctx.moveTo(cx - 3.8, cy + 2.8);
    ctx.lineTo(cx - 6.5, cy + 4.8);
    ctx.lineTo(cx - 4.8, cy + 1);
    ctx.stroke();
  } 
  else if (normId.includes("yaml") || normId.includes("data-engineering")) {
    ctx.strokeStyle = "#d1d5db";
    ctx.lineWidth = 1.2;
    ctx.strokeRect(cx - 4, cy - 5, 8, 10);
    ctx.beginPath();
    ctx.moveTo(cx - 2, cy - 2); ctx.lineTo(cx + 2, cy - 2);
    ctx.moveTo(cx - 2, cy + 1); ctx.lineTo(cx + 2, cy + 1);
    ctx.stroke();
  } 
  else if (normId.includes("markdown-parser") || normId.includes("parser")) {
    ctx.strokeStyle = "#3b82f6";
    ctx.lineWidth = 1.2;
    ctx.strokeRect(cx - 4.5, cy - 5.5, 9, 11);
    ctx.fillStyle = "#3b82f6";
    ctx.font = "bold 5.5px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("M", cx, cy + 0.5);
  } 
  else if (normId.includes("semantic-retrieval")) {
    ctx.strokeStyle = "#a855f7";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(cx - 5, cy + 4);
    ctx.quadraticCurveTo(cx, cy, cx + 4, cy - 4);
    ctx.stroke();
    ctx.fillStyle = "#c084fc";
    ctx.beginPath(); ctx.arc(cx + 4, cy - 4, 2, 0, 2 * Math.PI); ctx.fill();
  } 
  else if (normId.includes("information-retrieval")) {
    ctx.strokeStyle = "#a855f7";
    ctx.lineWidth = 1.2;
    ctx.strokeRect(cx - 4.5, cy - 3.5, 9, 7);
    ctx.beginPath();
    ctx.moveTo(cx - 2, cy + 0.5); ctx.lineTo(cx + 2, cy + 0.5);
    ctx.stroke();
  } 
  else if (normId.includes("rag-framework") || normId.includes("ai-systems")) {
    ctx.strokeStyle = "#a855f7";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(cx - 5, cy - 3); ctx.lineTo(cx + 5, cy - 3);
    ctx.moveTo(cx - 5, cy); ctx.lineTo(cx + 5, cy);
    ctx.moveTo(cx - 5, cy + 3); ctx.lineTo(cx + 5, cy + 3);
    ctx.stroke();
  } 
  else {
    // Default abstract web icon
    ctx.strokeStyle = "#3b82f6";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(cx, cy, 4, 0, 2 * Math.PI);
    ctx.stroke();
  }
};

// 3D Isometric Cube Drawing Helper for the central Octagon
const drawCubeIcon = (ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number) => {
  ctx.save();
  ctx.lineWidth = 1.0;
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
  ctx.fillStyle = "rgba(0, 242, 255, 0.35)";
  ctx.fill();
  ctx.stroke();

  // Right Face
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx + w, cy - h / 2);
  ctx.lineTo(cx + w, cy + h / 2);
  ctx.lineTo(cx, cy + h);
  ctx.closePath();
  ctx.fillStyle = "rgba(59, 130, 246, 0.55)";
  ctx.fill();
  ctx.stroke();

  // Top Face
  ctx.beginPath();
  ctx.moveTo(cx, cy - h);
  ctx.lineTo(cx - w, cy - h / 2);
  ctx.lineTo(cx, cy);
  ctx.lineTo(cx + w, cy - h / 2);
  ctx.closePath();
  ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
  ctx.fill();
  ctx.stroke();

  ctx.restore();
};

export default function Home() {
  const fgRef = useRef<any>(null);

  // States
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], links: [] });
  const [activeTab, setActiveTab] = useState<"overview" | "projects" | "knowledge" | "tech" | "archive">("overview");
  const [selectedNode, setSelectedNode] = useState<NodeData | null>(null);
  const [hoveredNode, setHoveredNode] = useState<NodeData | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(true);

  const [, startTransition] = useTransition();

  // Load Graph Data
  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await fetch("/data/graph.json");
        const data: GraphData = await res.json();

        // Big Bang Animation: Start all nodes at (0, 0) and explode
        const bangData: GraphData = {
          nodes: data.nodes.map((node) => ({
            ...node,
            x: 0,
            y: 0,
          })),
          links: data.links,
        };

        setGraphData(bangData);
        
        // Auto-select the central featured project initially
        const centralProject = data.nodes.find(n => n.id === "knowledge-graph-toolkit");
        if (centralProject) {
          setSelectedNode(centralProject);
        }
      } catch (err) {
        console.error("Failed to load graph data:", err);
      }
    };
    loadData();
  }, []);

  // Configure custom D3 forces
  useEffect(() => {
    if (fgRef.current && graphData.nodes.length > 0) {
      fgRef.current.d3Force(
        "collide",
        forceCollide((node: any) => {
          // Central node is huge (radius 46), surrounding nodes are radius 16
          if (node.id === "knowledge-graph-toolkit") {
            return 80;
          }
          return 38;
        })
      );

      fgRef.current.d3Force("charge").strength(-320);

      fgRef.current.d3Force("link").distance((link: any) => {
        if (link.type === "belongs_to") return 90;
        if (link.type === "implements") return 75;
        return 80;
      });

      fgRef.current.d3ReheatSimulation();
    }
  }, [graphData]);

  // Tab Filtering logic
  const filteredNodes = useMemo(() => {
    return graphData.nodes.filter((node) => {
      if (activeTab === "overview" || activeTab === "archive") return true;
      if (activeTab === "projects") return node.type === "project";
      if (activeTab === "knowledge") return node.type === "concept";
      if (activeTab === "tech") return node.type === "tech";
      return true;
    });
  }, [graphData.nodes, activeTab]);

  const filteredLinks = useMemo(() => {
    const nodeIds = new Set(filteredNodes.map((n) => n.id));
    return graphData.links.filter((link) => {
      const sourceId = typeof link.source === "object" ? (link.source as NodeData).id : (link.source as string);
      const targetId = typeof link.target === "object" ? (link.target as NodeData).id : (link.target as string);
      return nodeIds.has(sourceId) && nodeIds.has(targetId);
    });
  }, [graphData.links, filteredNodes]);

  // Highlight network on node click
  const highlightedNodeIds = useMemo(() => {
    const set = new Set<string>();
    if (!selectedNode) return set;

    set.add(selectedNode.id);

    // Find all links connected to selected node
    for (const link of graphData.links) {
      const sourceId = typeof link.source === "object" ? (link.source as NodeData).id : (link.source as string);
      const targetId = typeof link.target === "object" ? (link.target as NodeData).id : (link.target as string);

      if (sourceId === selectedNode.id) {
        set.add(targetId);
      } else if (targetId === selectedNode.id) {
        set.add(sourceId);
      }
    }
    return set;
  }, [selectedNode, graphData.links]);

  const handleSelectNodeById = (nodeId: string) => {
    const node = graphData.nodes.find((n) => n.id.toLowerCase() === nodeId.toLowerCase() || n.title.toLowerCase() === nodeId.toLowerCase());
    if (node && fgRef.current) {
      setSelectedNode(node);
      
      // Center camera and zoom in smoothly
      setTimeout(() => {
        if (node.x !== undefined && node.y !== undefined) {
          fgRef.current.centerAt(node.x, node.y, 800);
          fgRef.current.zoom(selectedNode?.id === "knowledge-graph-toolkit" ? 2.0 : 3.0, 800);
        }
      }, 50);
    }
  };

  const handleNodeClick = (node: any) => {
    setSelectedNode(node);
    if (fgRef.current && node.x !== undefined && node.y !== undefined) {
      fgRef.current.centerAt(node.x, node.y, 800);
      fgRef.current.zoom(node.id === "knowledge-graph-toolkit" ? 1.8 : 3.2, 800);
    }
  };

  const handleBackgroundClick = () => {
    // Zoom to fit all active nodes
    if (fgRef.current) {
      fgRef.current.zoomToFit(800, 80);
    }
  };

  // Draw custom nodes on Canvas
  const drawNode = (node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const isSelected = selectedNode && selectedNode.id === node.id;
    const isHighlighted = highlightedNodeIds.size === 0 || highlightedNodeIds.has(node.id);
    const isHovered = hoveredNode && hoveredNode.id === node.id;

    ctx.save();
    
    // Fade out non-connected nodes during focus mode
    ctx.globalAlpha = isHighlighted ? 1.0 : 0.08;

    // 🌟 Special central project node drawing (Large Octagon)
    if (node.id === "knowledge-graph-toolkit") {
      const size = 46;
      ctx.beginPath();
      // Draw octagon path
      for (let i = 0; i < 8; i++) {
        const angle = (Math.PI / 4) * i + Math.PI / 8;
        const ox = node.x + size * Math.cos(angle);
        const oy = node.y + size * Math.sin(angle);
        if (i === 0) ctx.moveTo(ox, oy);
        else ctx.lineTo(ox, oy);
      }
      ctx.closePath();

      // Outer glow
      ctx.shadowBlur = 15;
      ctx.shadowColor = "rgba(0, 242, 255, 0.4)";

      // Gradient fill
      const grad = ctx.createRadialGradient(node.x, node.y, 5, node.x, node.y, size);
      grad.addColorStop(0, "#081b37");
      grad.addColorStop(1, "#030612");
      ctx.fillStyle = grad;
      ctx.fill();

      // Octagon border
      ctx.shadowBlur = 0; // reset
      ctx.lineWidth = isSelected ? 3.0 : isHovered ? 2.2 : 1.5;
      ctx.strokeStyle = isSelected || isHovered ? "#00f2ff" : "rgba(0, 242, 255, 0.5)";
      ctx.stroke();

      // Draw cube icon
      drawCubeIcon(ctx, node.x, node.y - 12, 10);

      // Write text title inside octagon
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 7.5px Outfit, var(--font-sans)";
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillText("Knowledge Graph", node.x, node.y + 6);
      ctx.fillText("Construction Toolkit", node.x, node.y + 15);

      // Featured Project Capsule
      const capWidth = 56;
      const capHeight = 10;
      const cx = node.x - capWidth / 2;
      const cy = node.y + 26;
      ctx.beginPath();
      ctx.roundRect(cx, cy, capWidth, capHeight, 5);
      ctx.fillStyle = "rgba(59, 130, 246, 0.15)";
      ctx.fill();
      ctx.strokeStyle = "rgba(59, 130, 246, 0.45)";
      ctx.lineWidth = 0.5;
      ctx.stroke();

      ctx.fillStyle = "#60a5fa";
      ctx.font = "bold 5.2px Outfit, var(--font-sans)";
      ctx.fillText("★ Featured Project", node.x, cy + 2.5);

      ctx.restore();
      return;
    }

    // 🌟 Regular circular node drawing
    const r = isSelected || isHovered ? 18 : 16;
    let baseColor = "#3b82f6";
    if (node.type === "project") baseColor = "#3b82f6";
    else if (node.type === "tech") baseColor = "#10b981";
    else if (node.type === "concept") baseColor = "#a855f7";

    // 1. Draw Outer glow ring
    ctx.beginPath();
    ctx.arc(node.x, node.y, r * 1.5, 0, 2 * Math.PI);
    ctx.fillStyle = 
      node.type === "project" 
        ? "rgba(59, 130, 246, 0.08)" 
        : node.type === "tech" 
        ? "rgba(16, 185, 129, 0.08)" 
        : "rgba(168, 85, 247, 0.08)";
    ctx.fill();

    // 2. Draw glass circle core
    const gradient = ctx.createRadialGradient(
      node.x - r / 3,
      node.y - r / 3,
      r / 10,
      node.x,
      node.y,
      r
    );
    if (node.type === "project") {
      gradient.addColorStop(0, "rgba(96, 165, 250, 0.95)");
      gradient.addColorStop(0.3, "rgba(59, 130, 246, 0.5)");
      gradient.addColorStop(1, "rgba(30, 58, 138, 0.95)");
    } else if (node.type === "tech") {
      gradient.addColorStop(0, "rgba(110, 231, 183, 0.95)");
      gradient.addColorStop(0.3, "rgba(16, 185, 129, 0.5)");
      gradient.addColorStop(1, "rgba(6, 95, 70, 0.95)");
    } else {
      gradient.addColorStop(0, "rgba(216, 180, 254, 0.95)");
      gradient.addColorStop(0.3, "rgba(168, 85, 247, 0.5)");
      gradient.addColorStop(1, "rgba(88, 28, 135, 0.95)");
    }

    ctx.beginPath();
    ctx.arc(node.x, node.y, r, 0, 2 * Math.PI);
    ctx.fillStyle = gradient;
    ctx.fill();

    // 3. Draw border
    ctx.lineWidth = isSelected ? 2.5 : isHovered ? 1.8 : 1.0;
    ctx.strokeStyle = baseColor;
    ctx.stroke();

    // 4. Draw node icon
    drawNodeIcon(ctx, node.id, node.x, node.y);

    // 5. Draw text labels below
    const label = node.title || node.id;
    const fontSize = Math.max(9 / globalScale, 6.5);
    ctx.font = `${fontSize}px Outfit, var(--font-sans)`;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";

    // Text glow for hover/selection
    ctx.fillStyle = isSelected ? "#fff" : isHovered ? baseColor : "rgba(255, 255, 255, 0.8)";
    ctx.fillText(label, node.x, node.y + r + 5);

    ctx.restore();
  };

  // Custom link color, width, and particles
  const getLinkColor = (link: any) => {
    const sourceId = typeof link.source === "object" ? link.source.id : link.source;
    const targetId = typeof link.target === "object" ? link.target.id : link.target;
    const isHighlighted = highlightedNodeIds.size === 0 || 
                         (highlightedNodeIds.has(sourceId) && highlightedNodeIds.has(targetId));

    if (!isHighlighted) return "rgba(255, 255, 255, 0.01)";

    switch (link.type) {
      case "implements": return "rgba(16, 185, 129, 0.4)";
      case "belongs_to": return "rgba(156, 163, 175, 0.15)";
      case "inspired_by": return "rgba(168, 85, 247, 0.35)";
      case "optimize_for": return "rgba(245, 158, 11, 0.45)";
      default: return "rgba(255, 255, 255, 0.08)";
    }
  };

  const getLinkWidth = (link: any) => {
    return link.type === "optimize_for" ? 1.8 : 0.8;
  };

  const getLinkLineDash = (link: any) => {
    return link.type === "inspired_by" || link.type === "belongs_to" ? [2.5, 2.5] : null;
  };

  const getLinkParticles = (link: any) => {
    const sourceId = typeof link.source === "object" ? link.source.id : link.source;
    const targetId = typeof link.target === "object" ? link.target.id : link.target;
    const isHighlighted = highlightedNodeIds.size === 0 || 
                         (highlightedNodeIds.has(sourceId) && highlightedNodeIds.has(targetId));

    if (!isHighlighted || link.type === "belongs_to") return 0;
    return link.type === "optimize_for" ? 3 : 1;
  };

  const getLinkParticleSpeed = (link: any) => {
    return link.type === "optimize_for" ? 0.015 : 0.008;
  };

  return (
    <div className="dashboard-grid">
      {/* 1. Header Area */}
      <header className="dashboard-header">
        <div style={styles.logoRow}>
          <div style={styles.logoBox}>
            <span style={styles.logoLetter}>A</span>
          </div>
          <div style={styles.logoText}>
            <h1 style={styles.logoTitle}>ALEX K.</h1>
            <span style={styles.logoSubtitle}>Builder • Learner • Problem Solver</span>
          </div>
        </div>

        {/* Header Tabs */}
        <nav style={styles.navbar}>
          <a 
            href="#" 
            onClick={(e) => { e.preventDefault(); setActiveTab("overview"); }}
            className={`nav-link ${activeTab === "overview" ? "active" : ""}`}
          >
            Overview
          </a>
          <a 
            href="#" 
            onClick={(e) => { e.preventDefault(); setActiveTab("projects"); }}
            className={`nav-link ${activeTab === "projects" ? "active" : ""}`}
          >
            Projects
          </a>
          <a 
            href="#" 
            onClick={(e) => { e.preventDefault(); setActiveTab("knowledge"); }}
            className={`nav-link ${activeTab === "knowledge" ? "active" : ""}`}
          >
            Knowledge Map
          </a>
          <a 
            href="#" 
            onClick={(e) => { e.preventDefault(); setActiveTab("tech"); }}
            className={`nav-link ${activeTab === "tech" ? "active" : ""}`}
          >
            Tech Stack
          </a>
          <a 
            href="#" 
            onClick={(e) => { e.preventDefault(); setActiveTab("archive"); }}
            className={`nav-link ${activeTab === "archive" ? "active" : ""}`}
          >
            Archive
          </a>
        </nav>

        {/* Light/Dark Toggle */}
        <button 
          onClick={() => setIsDarkMode(!isDarkMode)} 
          style={styles.toggleBtn}
        >
          {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </header>

      {/* 2. Middle Panels (Left Banner, Center Graph, Right Sidebar) */}
      <div className="dashboard-middle">
        {/* Left Panel - Hero Info */}
        <div className="dashboard-left-panel">
          <div style={styles.heroTextContainer}>
            <span style={styles.welcomeText}>WELCOME TO MY</span>
            <h2 style={styles.mainTitle}>
              Project <br />
              <span className="gradient-text-blue-purple">Knowledge Atlas</span>
            </h2>
            <p style={styles.mainDesc}>
              An evolving network of projects, concepts, and technologies—connected by curiosity and built with purpose.
            </p>
          </div>

          <div style={styles.btnRow}>
            <button 
              onClick={() => handleSelectNodeById("knowledge-graph-toolkit")}
              className="btn-primary"
            >
              Explore Projects <ArrowRight size={16} />
            </button>
            <button 
              onClick={handleBackgroundClick} 
              className="btn-secondary"
            >
              <Workflow size={16} /> View Graph
            </button>
          </div>

          {/* Metrics Capsule */}
          <div className="stats-capsule">
            <div className="stat-box">
              <span className="stat-num">12</span>
              <span className="stat-lbl">Projects</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-box">
              <span className="stat-num">248+</span>
              <span className="stat-lbl">Technologies</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-box">
              <span className="stat-num">23</span>
              <span className="stat-lbl">Domains</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-box">
              <span className="stat-num">100+</span>
              <span className="stat-lbl">Connections</span>
            </div>
          </div>
        </div>

        {/* Center Panel - The Force Graph */}
        <div className="dashboard-center-panel">
          <ForceGraph2D
            ref={fgRef}
            graphData={{ nodes: filteredNodes, links: filteredLinks }}
            nodeCanvasObject={drawNode}
            nodePointerAreaPaint={(node, color, ctx) => {
              const r = node.id === "knowledge-graph-toolkit" ? 50 : 20;
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
            linkDirectionalParticleColor={(link) => {
              return link.type === "optimize_for" ? "#f59e0b" : link.type === "implements" ? "#10b981" : "#a855f7";
            }}
            cooldownTicks={120}
          />
          <div style={styles.hoverCaption}>
            <Activity size={12} style={{ marginRight: "4px" }} /> Hover nodes to explore connections
          </div>
        </div>

        {/* Right Panel - Sidebar details */}
        <div className="dashboard-right-panel">
          <DetailSidebar
            selectedNode={selectedNode}
            onClose={() => setSelectedNode(null)}
            onSelectNodeById={handleSelectNodeById}
          />
        </div>
      </div>

      {/* 3. Bottom Panels (3 Grid cards) */}
      <footer className="dashboard-bottom-row">
        {/* Card 1: Featured Projects */}
        <div className="glass-card bottom-card">
          <div className="bottom-card-header">
            <Star size={16} style={{ color: "#f59e0b" }} /> Featured Projects
          </div>
          <div style={styles.bottomListCol}>
            <div 
              onClick={() => handleSelectNodeById("knowledge-graph-toolkit")}
              className={`mini-project-card ${selectedNode?.id === "knowledge-graph-toolkit" ? "featured-active" : ""}`}
            >
              <div className="mini-project-card-header">
                <div className="mini-project-icon-wrapper"><FolderGit2 size={12} /></div>
                <span className="mini-project-title">Knowledge Graph Toolkit</span>
              </div>
              <span className="mini-project-desc">Featured • Core Toolkit</span>
            </div>
            
            <div 
              onClick={() => handleSelectNodeById("ai-research-assistant")}
              className={`mini-project-card ${selectedNode?.id === "ai-research-assistant" ? "featured-active" : ""}`}
            >
              <div className="mini-project-card-header">
                <div className="mini-project-icon-wrapper" style={{ color: "var(--color-green)" }}><Terminal size={12} /></div>
                <span className="mini-project-title">AI Research Assistant</span>
              </div>
              <span className="mini-project-desc">Python • LLM Integration</span>
            </div>

            <div 
              onClick={() => handleSelectNodeById("doc2kg-pipeline")}
              className={`mini-project-card ${selectedNode?.id === "doc2kg-pipeline" ? "featured-active" : ""}`}
            >
              <div className="mini-project-card-header">
                <div className="mini-project-icon-wrapper" style={{ color: "var(--color-purple)" }}><Briefcase size={12} /></div>
                <span className="mini-project-title">Doc2KG Pipeline</span>
              </div>
              <span className="mini-project-desc">NLP • Parsing</span>
            </div>

            <div 
              onClick={() => handleSelectNodeById("markdown-parser")}
              className={`mini-project-card ${selectedNode?.id === "markdown-parser" ? "featured-active" : ""}`}
            >
              <div className="mini-project-card-header">
                <div className="mini-project-icon-wrapper"><Code2 size={12} /></div>
                <span className="mini-project-title">Markdown Parser</span>
              </div>
              <span className="mini-project-desc">Python • Parsing</span>
            </div>
          </div>
          <a href="#" onClick={(e) => { e.preventDefault(); setActiveTab("projects"); }} className="bottom-card-link">
            View all projects <ArrowRight size={12} />
          </a>
        </div>

        {/* Card 2: Knowledge Domains */}
        <div className="glass-card bottom-card">
          <div className="bottom-card-header">
            <Network size={16} style={{ color: "var(--color-purple)" }} /> Knowledge Domains
          </div>
          <div style={styles.bottomListCol}>
            <div onClick={() => handleSelectNodeById("Information-Retrieval")} className="domain-list-item">
              <div className="domain-icon-wrapper"><Cpu size={14} /></div>
              <span className="domain-name">Information Retrieval</span>
            </div>
            
            <div onClick={() => handleSelectNodeById("Graph-Theory")} className="domain-list-item">
              <div className="domain-icon-wrapper"><Network size={14} /></div>
              <span className="domain-name">Graph Theory</span>
            </div>

            <div onClick={() => handleSelectNodeById("LLM-Integration")} className="domain-list-item">
              <div className="domain-icon-wrapper"><Workflow size={14} /></div>
              <span className="domain-name">NLP &amp; LLMs</span>
            </div>

            <div onClick={() => handleSelectNodeById("Data-Engineering")} className="domain-list-item">
              <div className="domain-icon-wrapper"><Terminal size={14} /></div>
              <span className="domain-name">Data Engineering</span>
            </div>

            <div onClick={() => handleSelectNodeById("AI Systems Design")} className="domain-list-item">
              <div className="domain-icon-wrapper"><Briefcase size={14} /></div>
              <span className="domain-name">AI Systems Design</span>
            </div>
          </div>
          <a href="#" onClick={(e) => { e.preventDefault(); setActiveTab("knowledge"); }} className="bottom-card-link">
            Explore knowledge map <ArrowRight size={12} />
          </a>
        </div>

        {/* Card 3: Tech Stack */}
        <div className="glass-card bottom-card">
          <div className="bottom-card-header">
            <Terminal size={16} style={{ color: "var(--color-green)" }} /> Tech Stack
          </div>
          <div style={styles.techGrid}>
            <div onClick={() => handleSelectNodeById("Python")} className="tech-circular-badge">
              <div className="tech-icon-circle"><Code2 size={16} style={{ color: "#387eb8" }} /></div>
              <span className="tech-label-mini">Python</span>
            </div>

            <div onClick={() => handleSelectNodeById("PyTorch")} className="tech-circular-badge">
              <div className="tech-icon-circle"><Cpu size={16} style={{ color: "#EE4C2C" }} /></div>
              <span className="tech-label-mini">PyTorch</span>
            </div>

            <div onClick={() => handleSelectNodeById("NetworkX")} className="tech-circular-badge">
              <div className="tech-icon-circle"><Network size={16} style={{ color: "#3b82f6" }} /></div>
              <span className="tech-label-mini">NetworkX</span>
            </div>

            <div onClick={() => handleSelectNodeById("FAISS")} className="tech-circular-badge">
              <div className="tech-icon-circle"><Terminal size={16} style={{ color: "#10b981" }} /></div>
              <span className="tech-label-mini">FAISS</span>
            </div>

            <div onClick={() => handleSelectNodeById("Docker")} className="tech-circular-badge">
              <div className="tech-icon-circle"><Workflow size={16} style={{ color: "#0db7ed" }} /></div>
              <span className="tech-label-mini">Docker</span>
            </div>

            <div onClick={() => handleSelectNodeById("GitHub")} className="tech-circular-badge">
              <div className="tech-icon-circle"><FolderGit2 size={16} style={{ color: "#fff" }} /></div>
              <span className="tech-label-mini">GitHub</span>
            </div>
          </div>
          <a href="#" onClick={(e) => { e.preventDefault(); setActiveTab("tech"); }} className="bottom-card-link">
            See full tech stack <ArrowRight size={12} />
          </a>
        </div>
      </footer>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  logoRow: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  logoBox: {
    width: "36px",
    height: "36px",
    borderRadius: "10px",
    background: "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 4px 12px rgba(139, 92, 246, 0.35)",
  },
  logoLetter: {
    fontSize: "1.35rem",
    fontWeight: "800",
    color: "#fff",
    fontFamily: "var(--font-sans)",
  },
  logoText: {
    display: "flex",
    flexDirection: "column",
  },
  logoTitle: {
    fontSize: "0.95rem",
    fontWeight: "700",
    color: "#fff",
    letterSpacing: "0.5px",
  },
  logoSubtitle: {
    fontSize: "0.68rem",
    color: "#6b7280",
    letterSpacing: "0.2px",
  },
  navbar: {
    display: "flex",
    gap: "24px",
    alignItems: "center",
  },
  toggleBtn: {
    background: "none",
    border: "none",
    color: "#9ca3af",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    padding: "6px",
    borderRadius: "50%",
    transition: "color 0.2s",
  },
  heroTextContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  welcomeText: {
    fontSize: "0.75rem",
    fontWeight: "600",
    color: "#6b7280",
    letterSpacing: "1.5px",
    textTransform: "uppercase",
  },
  mainTitle: {
    fontSize: "2.35rem",
    fontWeight: "800",
    color: "#fff",
    lineHeight: "1.15",
    letterSpacing: "-0.03em",
  },
  mainDesc: {
    fontSize: "0.85rem",
    color: "#9ca3af",
    lineHeight: "1.6",
    marginTop: "8px",
  },
  btnRow: {
    display: "flex",
    gap: "12px",
    margin: "24px 0",
  },
  hoverCaption: {
    position: "absolute",
    bottom: "16px",
    left: "50%",
    transform: "translateX(-50%)",
    fontSize: "0.72rem",
    color: "#6b7280",
    display: "flex",
    alignItems: "center",
    backgroundColor: "rgba(3, 5, 12, 0.7)",
    padding: "4px 12px",
    borderRadius: "99px",
    border: "1px solid var(--border-glass)",
    pointerEvents: "none",
  },
  bottomListCol: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    flex: 1,
  },
  techGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "8px 4px",
    flex: 1,
  },
  graphLoading: {
    width: "100%",
    height: "100%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "12px",
    backgroundColor: "rgba(4, 7, 19, 0.4)",
  },
  spinner: {
    width: "28px",
    height: "28px",
    borderRadius: "50%",
    border: "2.5px solid rgba(0, 242, 255, 0.1)",
    borderTopColor: "#00f2ff",
    animation: "spin 1s linear infinite",
  },
  loadingText: {
    fontSize: "0.78rem",
    color: "#6b7280",
    letterSpacing: "0.5px",
  },
};
