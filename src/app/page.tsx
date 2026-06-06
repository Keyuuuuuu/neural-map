"use client";

import React, { useState, useEffect, useRef, useTransition, useMemo } from "react";
import dynamic from "next/dynamic";
import { forceCollide } from "d3-force";
import ControlPanel from "@/components/ControlPanel";
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
      <div style={styles.loadingContainer}>
        <div className="glass-panel" style={styles.loadingCard}>
          <div style={styles.spinner}></div>
          <span style={styles.loadingText}>初始化神经索引网络...</span>
        </div>
      </div>
    ),
  }
);

export default function Home() {
  const fgRef = useRef<any>(null);

  // States
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], links: [] });
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTypes, setSelectedTypes] = useState({
    project: true,
    tech: true,
    concept: true,
  });
  const [minAiInvolvement, setMinAiInvolvement] = useState(0);
  const [selectedNode, setSelectedNode] = useState<NodeData | null>(null);
  const [hoveredNode, setHoveredNode] = useState<NodeData | null>(null);

  const [, startTransition] = useTransition();

  // Load Graph Data
  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await fetch("/data/graph.json");
        const data: GraphData = await res.json();

        // "Big Bang" Entry Animation: Initialize all nodes at (0, 0)
        // D3 force simulation will burst them outwards in 2 seconds
        const bangData: GraphData = {
          nodes: data.nodes.map((node) => ({
            ...node,
            x: 0,
            y: 0,
          })),
          links: data.links,
        };

        setGraphData(bangData);
      } catch (err) {
        console.error("Failed to load graph data:", err);
      }
    };
    loadData();
  }, []);

  // Configure custom D3 forces once the graph ref is bound
  useEffect(() => {
    if (fgRef.current && graphData.nodes.length > 0) {
      // Add collision force to prevent overlapping
      fgRef.current.d3Force(
        "collide",
        forceCollide((node: any) => {
          let r = 8;
          if (node.type === "project") r = 10;
          if (node.type === "concept") r = 12;
          return r + 10; // radius + padding distance
        })
      );

      // Increase charge repulsion force
      fgRef.current.d3Force("charge").strength(-160);

      // Adjust link distance
      fgRef.current.d3Force("link").distance((link: any) => {
        if (link.type === "belongs_to") return 65;
        if (link.type === "implements") return 45;
        return 55;
      });
      
      // Trigger a light shake on load to start simulation
      fgRef.current.d3ReheatSimulation();
    }
  }, [graphData]);

  // Handle Dimension Toggles
  const handleToggleType = (type: "project" | "tech" | "concept") => {
    setSelectedTypes((prev) => ({
      ...prev,
      [type]: !prev[type],
    }));
  };

  // Reset Filters and Camera View
  const handleReset = () => {
    setSearchQuery("");
    setSelectedTypes({
      project: true,
      tech: true,
      concept: true,
    });
    setMinAiInvolvement(0);
    setSelectedNode(null);

    if (fgRef.current) {
      fgRef.current.zoomToFit(800, 100);
    }
  };

  // Filtered dataset for graph display
  const filteredNodes = useMemo(() => {
    return graphData.nodes.filter((node) => {
      // Type filter
      if (!selectedTypes[node.type]) return false;

      // AI Involvement filter (Projects only)
      if (node.type === "project" && node.ai_involvement < minAiInvolvement) {
        return false;
      }

      // Search keyword filter
      if (searchQuery.trim() !== "") {
        const query = searchQuery.toLowerCase();
        const titleMatch = node.title?.toLowerCase().includes(query);
        const idMatch = node.id.toLowerCase().includes(query);
        const techMatch = node.tech_stack?.some((t) => t.toLowerCase().includes(query));
        const conceptMatch = node.concepts?.some((c) => c.toLowerCase().includes(query));
        return titleMatch || idMatch || techMatch || conceptMatch;
      }

      return true;
    });
  }, [graphData.nodes, selectedTypes, minAiInvolvement, searchQuery]);

  const filteredLinks = useMemo(() => {
    const nodeIds = new Set(filteredNodes.map((n) => n.id));
    return graphData.links.filter((link) => {
      const sourceId = typeof link.source === "object" ? (link.source as NodeData).id : (link.source as string);
      const targetId = typeof link.target === "object" ? (link.target as NodeData).id : (link.target as string);
      return nodeIds.has(sourceId) && nodeIds.has(targetId);
    });
  }, [graphData.links, filteredNodes]);

  // Focus Mode highlighting logic: Calculate 1st degree connections
  const highlightedNodeIds = useMemo(() => {
    const set = new Set<string>();
    if (!selectedNode) return set; // Empty set means draw normal

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

  const highlightedLinkKeys = useMemo(() => {
    const set = new Set<string>();
    if (!selectedNode) return set;

    for (const link of graphData.links) {
      const sourceId = typeof link.source === "object" ? (link.source as NodeData).id : (link.source as string);
      const targetId = typeof link.target === "object" ? (link.target as NodeData).id : (link.target as string);

      if (sourceId === selectedNode.id || targetId === selectedNode.id) {
        const key = `${sourceId}->${targetId}->${link.type}`;
        set.add(key);
      }
    }
    return set;
  }, [selectedNode, graphData.links]);

  // Statistics for the Control Panel
  const nodeStats = useMemo(() => {
    const stats = { total: 0, project: 0, tech: 0, concept: 0 };
    for (const node of filteredNodes) {
      stats.total++;
      if (node.type === "project") stats.project++;
      else if (node.type === "tech") stats.tech++;
      else if (node.type === "concept") stats.concept++;
    }
    return stats;
  }, [filteredNodes]);

  // Jump focus to a node programmatically (e.g. clicking a link tag in the sidebar)
  const handleSelectNodeById = (nodeId: string) => {
    const node = graphData.nodes.find((n) => n.id.toLowerCase() === nodeId.toLowerCase() || n.title.toLowerCase() === nodeId.toLowerCase());
    if (node && fgRef.current) {
      setSelectedNode(node);
      
      // Center camera and zoom in smoothly
      setTimeout(() => {
        if (node.x !== undefined && node.y !== undefined) {
          fgRef.current.centerAt(node.x, node.y, 800);
          fgRef.current.zoom(3.2, 800);
        }
      }, 50);
    }
  };

  // Node Single Click Handler
  const handleNodeClick = (node: any) => {
    setSelectedNode(node);
    if (fgRef.current && node.x !== undefined && node.y !== undefined) {
      fgRef.current.centerAt(node.x, node.y, 800);
      fgRef.current.zoom(3.5, 800);
    }
  };

  // Canvas Click Handler (Clicking empty background zooms out)
  const handleBackgroundClick = () => {
    setSelectedNode(null);
    if (fgRef.current) {
      fgRef.current.zoomToFit(800, 100);
    }
  };

  // Draw custom nodes on Canvas
  const drawNode = (node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const isSelected = selectedNode && selectedNode.id === node.id;
    const isHighlighted = highlightedNodeIds.size === 0 || highlightedNodeIds.has(node.id);
    const isHovered = hoveredNode && hoveredNode.id === node.id;

    ctx.save();
    
    // Dim out non-connected nodes during focus mode
    ctx.globalAlpha = isHighlighted ? 1.0 : 0.08;

    // Node Radius
    let r = 7;
    if (node.type === "project") r = 9;
    if (node.type === "concept") r = 11;

    // Expand slightly on hover/selection
    if (isSelected || isHovered) {
      r += 2;
    }

    // Hex Color Palette
    let baseColor = "#3b82f6";
    if (node.type === "project") baseColor = "#00f2ff"; // Neon Cyan
    else if (node.type === "tech") baseColor = "#10b981";    // Neon Green
    else if (node.type === "concept") baseColor = "#a855f7"; // Neon Violet

    // 1. Draw Outer Glow (transparent circles)
    ctx.beginPath();
    ctx.arc(node.x, node.y, r * 1.7, 0, 2 * Math.PI, false);
    ctx.fillStyle = 
      node.type === "project" 
        ? "rgba(0, 242, 255, 0.12)" 
        : node.type === "tech" 
        ? "rgba(16, 185, 129, 0.12)" 
        : "rgba(168, 85, 247, 0.12)";
    ctx.fill();

    // 2. Draw Solid Glass core gradient
    const gradient = ctx.createRadialGradient(
      node.x - r / 3,
      node.y - r / 3,
      r / 12,
      node.x,
      node.y,
      r
    );
    if (node.type === "project") {
      gradient.addColorStop(0, "rgba(120, 250, 255, 0.95)");
      gradient.addColorStop(0.3, "rgba(0, 242, 255, 0.6)");
      gradient.addColorStop(1, "rgba(0, 160, 200, 0.95)");
    } else if (node.type === "tech") {
      gradient.addColorStop(0, "rgba(120, 255, 200, 0.95)");
      gradient.addColorStop(0.3, "rgba(16, 185, 129, 0.6)");
      gradient.addColorStop(1, "rgba(8, 130, 90, 0.95)");
    } else {
      gradient.addColorStop(0, "rgba(220, 160, 255, 0.95)");
      gradient.addColorStop(0.3, "rgba(168, 85, 247, 0.6)");
      gradient.addColorStop(1, "rgba(130, 40, 210, 0.95)");
    }

    ctx.beginPath();
    ctx.arc(node.x, node.y, r, 0, 2 * Math.PI, false);
    ctx.fillStyle = gradient;
    ctx.fill();

    // 3. Draw Border outline
    ctx.lineWidth = isSelected ? 2.5 : isHovered ? 1.8 : 1.0;
    ctx.strokeStyle = baseColor;

    // Use dashed borders for "Idea" status projects
    if (node.type === "project" && node.status === "idea") {
      ctx.setLineDash([2.5, 2.5]);
    } else {
      ctx.setLineDash([]);
    }
    ctx.stroke();

    // 4. Draw text labels (always if hovered/selected, or if zoomed in)
    if (globalScale > 1.3 || isSelected || isHovered) {
      const label = node.title || node.id;
      const fontSize = Math.max(9 / globalScale, 6.5);
      ctx.font = `${fontSize}px Outfit, var(--font-sans)`;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";

      // Draw solid glass pill backdrop for readability
      const textWidth = ctx.measureText(label).width;
      ctx.fillStyle = "rgba(3, 7, 18, 0.82)";
      ctx.fillRect(
        node.x - textWidth / 2 - 5,
        node.y + r + 5,
        textWidth + 10,
        fontSize + 5
      );
      
      ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
      ctx.lineWidth = 0.5;
      ctx.strokeRect(
        node.x - textWidth / 2 - 5,
        node.y + r + 5,
        textWidth + 10,
        fontSize + 5
      );

      ctx.fillStyle = isSelected ? "#fff" : "rgba(255, 255, 255, 0.85)";
      ctx.fillText(label, node.x, node.y + r + 7);
    }

    ctx.restore();
  };

  // Custom link coloring
  const getLinkColor = (link: any) => {
    const sourceId = typeof link.source === "object" ? link.source.id : link.source;
    const targetId = typeof link.target === "object" ? link.target.id : link.target;

    const isHighlighted = highlightedNodeIds.size === 0 || 
                         (highlightedNodeIds.has(sourceId) && highlightedNodeIds.has(targetId));

    if (!isHighlighted) {
      return "rgba(255, 255, 255, 0.015)"; // dim completely
    }

    switch (link.type) {
      case "implements":
        return "rgba(16, 185, 129, 0.4)"; // emerald teal
      case "belongs_to":
        return "rgba(156, 163, 175, 0.18)"; // thin grey
      case "inspired_by":
        return "rgba(168, 85, 247, 0.35)"; // purple
      case "optimize_for":
        return "rgba(245, 158, 11, 0.5)";  // glowing amber
      default:
        return "rgba(255, 255, 255, 0.1)";
    }
  };

  // Custom link width
  const getLinkWidth = (link: any) => {
    switch (link.type) {
      case "optimize_for":
        return 2.0;
      case "implements":
        return 1.2;
      case "belongs_to":
        return 0.7;
      default:
        return 1.0;
    }
  };

  // Custom link dashes
  const getLinkLineDash = (link: any) => {
    return link.type === "inspired_by" ? [3, 3] : null;
  };

  // Particle count based on connection importance
  const getLinkParticles = (link: any) => {
    const sourceId = typeof link.source === "object" ? link.source.id : link.source;
    const targetId = typeof link.target === "object" ? link.target.id : link.target;
    
    // Do not run particles on dimmed out links
    const isHighlighted = highlightedNodeIds.size === 0 || 
                         (highlightedNodeIds.has(sourceId) && highlightedNodeIds.has(targetId));
    if (!isHighlighted) return 0;

    switch (link.type) {
      case "optimize_for":
        return 4; // Dense particles
      case "implements":
        return 2;
      case "inspired_by":
        return 1;
      case "belongs_to":
        return 0; // Concept edges do not require particles (static concept links)
      default:
        return 0;
    }
  };

  // Particle speed matches the project's AI Involvement
  const getLinkParticleSpeed = (link: any) => {
    const sourceNode = typeof link.source === "object" ? link.source : null;
    let involvement = 50;
    
    if (sourceNode && sourceNode.ai_involvement !== undefined) {
      involvement = sourceNode.ai_involvement;
    }

    // Higher AI involvement = faster flow speed (0.005 base, up to 0.025 max)
    return 0.005 + (involvement / 100) * 0.02;
  };

  return (
    <div style={styles.appContainer}>
      {/* Background visual styling */}
      <div style={styles.gridOverlay}></div>

      {/* Floating Left Filter Console */}
      <div style={styles.panelWrapperLeft}>
        <ControlPanel
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedTypes={selectedTypes}
          toggleType={handleToggleType}
          minAiInvolvement={minAiInvolvement}
          setMinAiInvolvement={setMinAiInvolvement}
          onReset={handleReset}
          nodeStats={nodeStats}
        />
      </div>

      {/* Fullscreen interactive D3 network map */}
      <div style={styles.canvasContainer}>
        <ForceGraph2D
          ref={fgRef}
          graphData={{ nodes: filteredNodes, links: filteredLinks }}
          nodeCanvasObject={drawNode}
          nodePointerAreaPaint={(node: any, color, ctx) => {
            // Give pointer mouse hover bounds equal to node radius + click margin
            let r = 8;
            if (node.type === "project") r = 10;
            if (node.type === "concept") r = 12;
            const x = node.x ?? 0;
            const y = node.y ?? 0;
            ctx.beginPath();
            ctx.arc(x, y, r + 4, 0, 2 * Math.PI, false);
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
            // Match particle color with edge color
            switch (link.type) {
              case "optimize_for":
                return "#f59e0b"; // gold amber
              case "implements":
                return "#10b981"; // neon green
              case "inspired_by":
                return "#a855f7"; // purple
              default:
                return "#00f2ff";
            }
          }}
          cooldownTicks={120} // number of physics simulation ticks to run on initialization
        />
      </div>

      {/* Floating Right Detail Sidebar */}
      <DetailSidebar
        selectedNode={selectedNode}
        onClose={() => setSelectedNode(null)}
        onSelectNodeById={handleSelectNodeById}
      />
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  appContainer: {
    position: "relative",
    width: "100vw",
    height: "100vh",
    backgroundColor: "var(--bg-base)",
    overflow: "hidden",
    display: "flex",
  },
  gridOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundImage: `
      linear-gradient(to right, rgba(255, 255, 255, 0.015) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(255, 255, 255, 0.015) 1px, transparent 1px)
    `,
    backgroundSize: "45px 45px",
    pointerEvents: "none",
    zIndex: 1,
  },
  canvasContainer: {
    width: "100%",
    height: "100%",
    zIndex: 2,
  },
  panelWrapperLeft: {
    position: "absolute",
    left: "20px",
    top: "20px",
    zIndex: 10,
    pointerEvents: "none", // Allows clicking canvas elements behind empty panel regions
  },
  loadingContainer: {
    width: "100vw",
    height: "100vh",
    backgroundColor: "var(--bg-base)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 999,
  },
  loadingCard: {
    padding: "30px 40px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "16px",
    boxShadow: "0 0 40px rgba(0, 0, 0, 0.8)",
  },
  spinner: {
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    border: "3px solid rgba(0, 242, 255, 0.1)",
    borderTopColor: "var(--color-project)",
    animation: "spin 1s linear infinite",
  },
  loadingText: {
    fontSize: "0.9rem",
    fontWeight: "500",
    color: "var(--color-text-secondary)",
    letterSpacing: "0.5px",
  },
};

// Add spinner keyframes dynamically if not present in main sheet
if (typeof document !== "undefined") {
  const styleEl = document.createElement("style");
  styleEl.innerHTML = `
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    @keyframes float {
      0%, 100% { transform: translateY(0px); }
      50% { transform: translateY(-8px); }
    }
  `;
  document.head.appendChild(styleEl);
}
