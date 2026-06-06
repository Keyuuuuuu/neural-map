"use client";

import React from "react";
import { 
  Briefcase, 
  Terminal, 
  Cpu, 
  ArrowRight, 
  X, 
  Code2, 
  Compass 
} from "lucide-react";

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
}

interface DetailSidebarProps {
  selectedNode: NodeData | null;
  onClose: () => void;
  onSelectNodeById: (id: string) => void;
}

export default function DetailSidebar({
  selectedNode,
  onClose,
  onSelectNodeById,
}: DetailSidebarProps) {
  const getStatusText = (status: string) => {
    switch (status) {
      case "completed": return "Completed";
      case "in-progress": return "In Progress";
      case "idea": return "Conceptual";
      default: return status;
    }
  };

  const getScopeText = (node: NodeData) => {
    if (node.type === "project") {
      // Custom mapping based on project ID for perfect image reproduction
      if (node.id === "knowledge-graph-toolkit") {
        return "Data Ingestion • Graph Construction • Retrieval • Visualization";
      }
      if (node.id === "ai-research-assistant") {
        return "Literature Mining • Semantic Indexing • Agent Search";
      }
      if (node.id === "doc2kg-pipeline") {
        return "PDF Parsing • Layout Segmentation • Schema Mapping";
      }
      if (node.id === "markdown-parser") {
        return "Obsidian Indexing • AST Parsing • High-Speed IO";
      }
      return "Development • Integration • Verification";
    }
    if (node.type === "tech") {
      return "Core Technology Stack • Implementation Library";
    }
    return "Theoretical Domain • Knowledge Domain";
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span style={styles.headerTitle}>SELECTED PROJECT</span>
        {selectedNode && (
          <button onClick={onClose} style={styles.closeBtn}>
            <X size={16} />
          </button>
        )}
      </div>

      {selectedNode ? (
        <div className="glass-card" style={styles.card}>
          {/* Card Title Row */}
          <div style={styles.titleRow}>
            <div style={styles.iconBox}>
              {selectedNode.type === "project" ? (
                <Briefcase size={18} />
              ) : selectedNode.type === "tech" ? (
                <Terminal size={18} />
              ) : (
                <Cpu size={18} />
              )}
            </div>
            <div style={styles.titleTextContainer}>
              <h3 style={styles.nodeTitle}>{selectedNode.title}</h3>
              {selectedNode.type === "project" && (
                <span style={styles.statusBadge}>
                  {getStatusText(selectedNode.status)}
                </span>
              )}
            </div>
          </div>

          {/* Description */}
          <p style={styles.description}>
            {selectedNode.motivation || selectedNode.purpose || "No description provided."}
          </p>

          {/* Technologies Section */}
          {selectedNode.tech_stack && selectedNode.tech_stack.length > 0 && (
            <div style={styles.section}>
              <span style={styles.sectionLabel}>TECHNOLOGIES</span>
              <div style={styles.tagContainer}>
                {selectedNode.tech_stack.map((tech) => (
                  <button
                    key={tech}
                    onClick={() => onSelectNodeById(tech)}
                    style={styles.techPill}
                  >
                    {tech}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* AI Involvement Section */}
          <div style={styles.section}>
            <div style={styles.progressHeader}>
              <span style={styles.sectionLabel}>AI INVOLVEMENT</span>
              <span style={styles.progressPercent}>{selectedNode.ai_involvement}%</span>
            </div>
            <div style={styles.progressBarBg}>
              <div
                style={{
                  ...styles.progressBarFill,
                  width: `${selectedNode.ai_involvement}%`,
                }}
              />
            </div>
          </div>

          {/* Scope Section */}
          <div style={styles.section}>
            <span style={styles.sectionLabel}>SCOPE</span>
            <span style={styles.scopeText}>{getScopeText(selectedNode)}</span>
          </div>

          {/* Action Link */}
          {selectedNode.type === "project" && (
            <a href="#" onClick={(e) => { e.preventDefault(); }} style={styles.actionLink}>
              View Project <ArrowRight size={14} style={{ marginLeft: "4px" }} />
            </a>
          )}
        </div>
      ) : (
        <div style={styles.emptyState}>
          <div style={styles.emptyIconWrapper}>
            <Compass size={24} style={{ animation: "spin 12s linear infinite" }} />
          </div>
          <p style={styles.emptyText}>
            Select a project or technology node from the atlas to view its detailed specifications and scope.
          </p>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    height: "100%",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    paddingRight: "8px",
  },
  headerTitle: {
    fontSize: "0.75rem",
    fontWeight: "600",
    color: "#3b82f6",
    letterSpacing: "1px",
    textTransform: "uppercase",
  },
  closeBtn: {
    background: "none",
    border: "none",
    color: "#9ca3af",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    transition: "color 0.2s",
  },
  card: {
    padding: "24px",
    borderColor: "rgba(59, 130, 246, 0.25)",
    boxShadow: "0 0 25px rgba(59, 130, 246, 0.08)",
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  titleRow: {
    display: "flex",
    gap: "14px",
    alignItems: "flex-start",
  },
  iconBox: {
    width: "36px",
    height: "36px",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(59, 130, 246, 0.12)",
    color: "#3b82f6",
    border: "1px solid rgba(59, 130, 246, 0.25)",
    flexShrink: 0,
    boxShadow: "0 0 10px rgba(59, 130, 246, 0.15)",
  },
  titleTextContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  nodeTitle: {
    fontSize: "1.05rem",
    fontWeight: "700",
    color: "#fff",
    lineHeight: "1.3",
  },
  statusBadge: {
    fontSize: "0.65rem",
    color: "#9ca3af",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  description: {
    fontSize: "0.85rem",
    color: "#9ca3af",
    lineHeight: "1.5",
  },
  section: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  sectionLabel: {
    fontSize: "0.7rem",
    fontWeight: "600",
    color: "#6b7280",
    letterSpacing: "0.5px",
    textTransform: "uppercase",
  },
  tagContainer: {
    display: "flex",
    flexWrap: "wrap",
    gap: "6px",
  },
  techPill: {
    background: "rgba(255, 255, 255, 0.025)",
    border: "1px solid rgba(255, 255, 255, 0.05)",
    borderRadius: "6px",
    padding: "4px 8px",
    fontSize: "0.75rem",
    color: "#d1d5db",
    cursor: "pointer",
    transition: "all 0.2s",
    fontFamily: "var(--font-sans)",
  },
  progressHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  progressPercent: {
    fontSize: "0.8rem",
    color: "#3b82f6",
    fontWeight: "700",
    fontFamily: "var(--font-mono)",
  },
  progressBarBg: {
    width: "100%",
    height: "4px",
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderRadius: "2px",
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#3b82f6",
    boxShadow: "0 0 8px #3b82f6",
    borderRadius: "2px",
    transition: "width 0.4s ease-out",
  },
  scopeText: {
    fontSize: "0.78rem",
    color: "#9ca3af",
    lineHeight: "1.4",
  },
  actionLink: {
    fontSize: "0.82rem",
    color: "#3b82f6",
    textDecoration: "none",
    fontWeight: "600",
    display: "inline-flex",
    alignItems: "center",
    transition: "color 0.2s",
    marginTop: "4px",
    alignSelf: "flex-start",
  },
  emptyState: {
    border: "1px dashed var(--border-glass)",
    borderRadius: "16px",
    height: "100%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "30px",
    textAlign: "center",
    gap: "12px",
  },
  emptyIconWrapper: {
    width: "48px",
    height: "48px",
    borderRadius: "50%",
    background: "rgba(255, 255, 255, 0.02)",
    border: "1px solid var(--border-glass)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#6b7280",
  },
  emptyText: {
    fontSize: "0.8rem",
    color: "#6b7280",
    lineHeight: "1.5",
  },
};
