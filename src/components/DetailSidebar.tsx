"use client";

import React, { useTransition } from "react";

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

// Simple regex-based markdown to HTML parser to avoid CommonJS/ESM module import issues
function renderMarkdown(md: string): string {
  if (!md) return "";

  let html = md;

  // Escape HTML entities to prevent XSS
  html = html
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Code blocks: ```lang ... ```
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
    return `<pre><code class="language-${lang}">${code.trim()}</code></pre>`;
  });

  // Inline code: `code`
  html = html.replace(/`([^`]+)`/g, "<code>$1</code>");

  // Blockquotes: > Text
  html = html.replace(/^&gt;\s+(.+)$/gm, "<blockquote><p>$1</p></blockquote>");
  // Clean up nested consecutive blockquotes
  html = html.replace(/<\/blockquote>\s*<blockquote>/g, "");

  // Headers: # Title
  html = html.replace(/^#\s+(.+)$/gm, "<h1>$1</h1>");
  html = html.replace(/^##\s+(.+)$/gm, "<h2>$1</h2>");
  html = html.replace(/^###\s+(.+)$/gm, "<h3>$1</h3>");

  // Unordered lists: - Item or * Item
  html = html.replace(/^\s*[-*]\s+(.+)$/gm, "<li>$1</li>");
  // Wrap li in ul
  html = html.replace(/(<li>[\s\S]*<\/li>)/, "<ul>$1</ul>");
  // Fix consecutive list groups
  html = html.replace(/<\/ul>\s*<ul>/g, "");

  // File links: [text](file:///path) or [text](url)
  // Convert them to open-in-new-tab links or simple span if local
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, text, url) => {
    if (url.startsWith("file://") || url.startsWith("/")) {
      return `<a href="#" data-node-link="${text}">${text}</a>`;
    }
    return `<a href="${url}" target="_blank" rel="noopener noreferrer">${text} ↗</a>`;
  });

  // Paragraphs (double newlines)
  // Split by double newlines, wrap in <p> if not already inside block block elements
  const blocks = html.split(/\n\n+/);
  html = blocks
    .map((block) => {
      block = block.trim();
      if (!block) return "";
      if (
        block.startsWith("<h") ||
        block.startsWith("<pre") ||
        block.startsWith("<ul") ||
        block.startsWith("<ol") ||
        block.startsWith("<blockquote")
      ) {
        return block;
      }
      // Replace single newlines with breaks
      return `<p>${block.replace(/\n/g, "<br />")}</p>`;
    })
    .join("\n");

  return html;
}

export default function DetailSidebar({
  selectedNode,
  onClose,
  onSelectNodeById,
}: DetailSidebarProps) {
  const isOpen = !!selectedNode;
  const [, startTransition] = useTransition();

  const handleNodeLinkClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.tagName === "A" && target.getAttribute("data-node-link")) {
      e.preventDefault();
      const nodeName = target.getAttribute("data-node-link");
      if (nodeName) {
        // Find if this node exists by matching title or ID
        startTransition(() => {
          onSelectNodeById(nodeName);
        });
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "var(--color-completed)";
      case "in-progress":
        return "var(--color-inprogress)";
      case "idea":
        return "var(--color-idea)";
      case "long-term":
        return "var(--color-longterm)";
      default:
        return "var(--color-text-muted)";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "completed":
        return "已完成";
      case "in-progress":
        return "开发中";
      case "idea":
        return "构想中";
      case "long-term":
        return "长期维护";
      default:
        return "未知";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "project":
        return "var(--color-project)";
      case "tech":
        return "var(--color-tech)";
      case "concept":
        return "var(--color-concept)";
      default:
        return "#fff";
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case "project":
        return "项目";
      case "tech":
        return "技术";
      case "concept":
        return "理论概念";
      default:
        return "未知";
    }
  };

  return (
    <div
      className="glass-panel"
      style={{
        ...styles.sidebar,
        transform: isOpen ? "translateX(0)" : "translateX(calc(100% + 40px))",
      }}
    >
      {selectedNode ? (
        <div style={styles.scrollContainer}>
          {/* Header */}
          <div style={styles.header}>
            <div style={styles.typeRow}>
              <span
                style={{
                  ...styles.typeBadge,
                  color: getTypeColor(selectedNode.type),
                  borderColor: getTypeColor(selectedNode.type),
                }}
              >
                {getTypeText(selectedNode.type)}
              </span>
              <span style={styles.idLabel}>{selectedNode.id}</span>
              <button onClick={onClose} style={styles.closeBtn}>
                ✕
              </button>
            </div>
            <h2 style={styles.nodeTitle}>{selectedNode.title}</h2>
          </div>

          <hr style={styles.divider} />

          {/* Quick Indicators (Status & AI Involvement) */}
          <div style={styles.indicatorRow}>
            {selectedNode.type === "project" && (
              <div style={styles.indicatorItem}>
                <span style={styles.indicatorLabel}>研发状态</span>
                <span
                  style={{
                    ...styles.statusBadge,
                    backgroundColor: `${getStatusColor(selectedNode.status)}15`,
                    color: getStatusColor(selectedNode.status),
                    borderColor: `${getStatusColor(selectedNode.status)}30`,
                  }}
                >
                  <span
                    style={{
                      ...styles.statusDot,
                      backgroundColor: getStatusColor(selectedNode.status),
                      boxShadow: `0 0 8px ${getStatusColor(selectedNode.status)}`,
                    }}
                  />
                  {getStatusText(selectedNode.status)}
                </span>
              </div>
            )}

            <div style={styles.indicatorItem}>
              <span style={styles.indicatorLabel}>AI 协作比例</span>
              <div style={styles.progressContainer}>
                <span style={{ ...styles.progressText, color: getTypeColor(selectedNode.type) }}>
                  {selectedNode.ai_involvement}%
                </span>
                <div style={styles.progressBarBg}>
                  <div
                    style={{
                      ...styles.progressBarFill,
                      width: `${selectedNode.ai_involvement}%`,
                      backgroundColor: getTypeColor(selectedNode.type),
                      boxShadow: `0 0 10px ${getTypeColor(selectedNode.type)}`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Motivation & Purpose */}
          {selectedNode.motivation && (
            <div style={styles.blockSection}>
              <h3 style={styles.sectionTitle}>设计初衷 / Motivation</h3>
              <blockquote
                style={{
                  ...styles.motivationBlock,
                  borderLeftColor: getTypeColor(selectedNode.type),
                }}
              >
                <p>“ {selectedNode.motivation} ”</p>
              </blockquote>
            </div>
          )}

          {selectedNode.purpose && (
            <div style={styles.blockSection}>
              <h3 style={styles.sectionTitle}>核心目的 / Purpose</h3>
              <div style={styles.purposeBlock}>{selectedNode.purpose}</div>
            </div>
          )}

          {/* Tech Stack & Concepts */}
          {selectedNode.tech_stack && selectedNode.tech_stack.length > 0 && (
            <div style={styles.tagSection}>
              <h3 style={styles.sectionTitle}>使用技术栈</h3>
              <div style={styles.tagContainer}>
                {selectedNode.tech_stack.map((tech) => (
                  <button
                    key={tech}
                    onClick={() => onSelectNodeById(tech)}
                    style={{ ...styles.tag, color: "var(--color-tech)", borderColor: "rgba(16, 185, 129, 0.2)" }}
                  >
                    #{tech}
                  </button>
                ))}
              </div>
            </div>
          )}

          {selectedNode.concepts && selectedNode.concepts.length > 0 && (
            <div style={styles.tagSection}>
              <h3 style={styles.sectionTitle}>涉及概念领域</h3>
              <div style={styles.tagContainer}>
                {selectedNode.concepts.map((concept) => (
                  <button
                    key={concept}
                    onClick={() => onSelectNodeById(concept)}
                    style={{ ...styles.tag, color: "var(--color-concept)", borderColor: "rgba(168, 85, 247, 0.2)" }}
                  >
                    @{concept}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Related Nodes */}
          {selectedNode.related_nodes && selectedNode.related_nodes.length > 0 && (
            <div style={styles.tagSection}>
              <h3 style={styles.sectionTitle}>关联神经索引</h3>
              <div style={styles.relationContainer}>
                {selectedNode.related_nodes.map((rel) => (
                  <div
                    key={rel.id}
                    onClick={() => onSelectNodeById(rel.id)}
                    style={styles.relationCard}
                  >
                    <span style={styles.relationName}>{rel.id}</span>
                    <span style={styles.relationType}>
                      {rel.type === "inspired_by"
                        ? "启发"
                        : rel.type === "optimize_for"
                        ? "衍生优化"
                        : rel.type}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <hr style={styles.divider} />

          {/* Markdown Content */}
          {selectedNode.content && (
            <div style={styles.contentSection}>
              <h3 style={styles.sectionTitle}>开发日志 / 详情文档</h3>
              <div
                className="markdown-content"
                onClick={handleNodeLinkClick}
                dangerouslySetInnerHTML={{
                  __html: renderMarkdown(selectedNode.content),
                }}
              />
            </div>
          )}
        </div>
      ) : (
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>🧠</div>
          <h3>技术神经网络中枢</h3>
          <p>请点击左侧图谱中的任意节点，查看该技术资产的设计初衷、协作配比以及在整个系统中的拓扑脉络。</p>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  sidebar: {
    position: "absolute",
    right: "20px",
    top: "20px",
    bottom: "20px",
    width: "420px",
    zIndex: 10,
    overflow: "hidden",
    pointerEvents: "auto",
  },
  scrollContainer: {
    width: "100%",
    height: "100%",
    padding: "24px",
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  header: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  typeRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    position: "relative",
  },
  typeBadge: {
    fontSize: "0.7rem",
    fontWeight: "700",
    textTransform: "uppercase",
    padding: "2px 6px",
    borderRadius: "4px",
    border: "1px solid currentColor",
    letterSpacing: "1px",
  },
  idLabel: {
    fontFamily: "var(--font-mono)",
    fontSize: "0.75rem",
    color: "var(--color-text-muted)",
  },
  closeBtn: {
    position: "absolute",
    right: "0",
    top: "-5px",
    background: "none",
    border: "none",
    color: "var(--color-text-secondary)",
    cursor: "pointer",
    fontSize: "1.2rem",
    padding: "4px",
    transition: "color 0.2s",
  },
  nodeTitle: {
    fontSize: "1.6rem",
    fontWeight: "700",
    color: "#fff",
    marginTop: "4px",
    lineHeight: "1.2",
  },
  divider: {
    border: "none",
    height: "1px",
    backgroundColor: "var(--border-glass)",
  },
  indicatorRow: {
    display: "flex",
    gap: "16px",
    justifyContent: "space-between",
  },
  indicatorItem: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  indicatorLabel: {
    fontSize: "0.75rem",
    color: "var(--color-text-muted)",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  statusBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "0.8rem",
    fontWeight: "600",
    padding: "4px 10px",
    borderRadius: "20px",
    border: "1px solid transparent",
    width: "fit-content",
  },
  statusDot: {
    width: "6px",
    height: "6px",
    borderRadius: "50%",
  },
  progressContainer: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  progressText: {
    fontFamily: "var(--font-mono)",
    fontSize: "0.85rem",
    fontWeight: "700",
  },
  progressBarBg: {
    flex: 1,
    height: "6px",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: "3px",
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: "3px",
    transition: "width 0.5s ease-out",
  },
  blockSection: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  sectionTitle: {
    fontSize: "0.8rem",
    fontWeight: "700",
    color: "var(--color-text-primary)",
    textTransform: "uppercase",
    letterSpacing: "1px",
  },
  motivationBlock: {
    padding: "12px 16px",
    background: "rgba(255, 255, 255, 0.02)",
    borderRadius: "0 12px 12px 0",
    fontStyle: "italic",
    color: "var(--color-text-secondary)",
    fontSize: "0.9rem",
    lineHeight: "1.5",
    borderLeftWidth: "4px",
    borderLeftStyle: "solid",
  },
  purposeBlock: {
    padding: "14px",
    background: "rgba(255, 255, 255, 0.03)",
    borderRadius: "8px",
    border: "1px solid var(--border-glass)",
    fontSize: "0.9rem",
    color: "var(--color-text-secondary)",
    lineHeight: "1.5",
  },
  tagSection: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  tagContainer: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
  },
  tag: {
    background: "rgba(255, 255, 255, 0.02)",
    border: "1px solid transparent",
    borderRadius: "6px",
    padding: "6px 12px",
    fontSize: "0.8rem",
    cursor: "pointer",
    transition: "all 0.2s",
    fontFamily: "var(--font-mono)",
  },
  relationContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  relationCard: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "10px 14px",
    borderRadius: "8px",
    border: "1px solid var(--border-glass)",
    background: "rgba(255, 255, 255, 0.01)",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  relationName: {
    fontSize: "0.85rem",
    color: "var(--color-text-primary)",
    fontWeight: "600",
  },
  relationType: {
    fontSize: "0.75rem",
    color: "var(--color-text-muted)",
    background: "rgba(255, 255, 255, 0.05)",
    padding: "2px 6px",
    borderRadius: "4px",
  },
  contentSection: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  emptyState: {
    height: "100%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "40px",
    textAlign: "center",
    color: "var(--color-text-secondary)",
    gap: "12px",
  },
  emptyIcon: {
    fontSize: "3rem",
    filter: "drop-shadow(0 0 15px rgba(255, 255, 255, 0.1))",
    animation: "float 4s ease-in-out infinite",
  },
};
