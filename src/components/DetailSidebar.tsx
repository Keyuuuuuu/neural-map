"use client";

import React, { useState, useEffect } from "react";
import { 
  Briefcase, 
  Terminal, 
  Cpu, 
  ArrowRight, 
  X, 
  Compass
} from "lucide-react";

interface NodeData {
  id: string;
  title: string;
  title_en?: string;
  title_zh?: string;
  type: "project" | "tech" | "concept";
  status: "completed" | "in-progress" | "idea" | "long-term";
  ai_involvement: number;
  motivation: string;
  motivation_en?: string;
  motivation_zh?: string;
  purpose: string;
  purpose_en?: string;
  purpose_zh?: string;
  content: string;
  tech_stack: string[];
  concepts: string[];
  related_nodes: { id: string; type: string }[];
}

interface DetailSidebarProps {
  selectedNode: NodeData | null;
  onClose: () => void;
  onSelectNodeById: (id: string) => void;
  lang: "zh" | "en";
  allNodes: NodeData[];
  activeSidebarTab: string;
}

export default function DetailSidebar({
  selectedNode,
  onClose,
  onSelectNodeById,
  lang,
  allNodes,
  activeSidebarTab,
}: DetailSidebarProps) {
  const [activeTab, setActiveTab] = useState<"info" | "tech" | "links">("info");
  const isZh = lang === "zh";

  useEffect(() => {
    setActiveTab("info");
  }, [selectedNode?.id]);

  // Helper to look up a node's display title in the current language
  const getNodeDisplayTitle = (nodeId: string) => {
    if (!nodeId) return "";
    const targetNode = allNodes.find(n => n.id.toLowerCase() === nodeId.toLowerCase());
    if (!targetNode) return nodeId; // Fallback to raw ID
    
    return isZh 
      ? (targetNode.title_zh || targetNode.title || targetNode.id) 
      : (targetNode.title_en || targetNode.title || targetNode.id);
  };

  const parseMarkdownToReact = (text: string) => {
    if (!text) return null;
    
    const lines = text.split("\n");
    let inList = false;
    const listItems: React.ReactNode[] = [];
    const elements: React.ReactNode[] = [];

    const parseInline = (inlineText: string): React.ReactNode[] => {
      const parts: React.ReactNode[] = [];
      const regex = /(\*\*.*?\*\*|\[.*?\]\(.*?\))/g;
      let match;
      let lastIndex = 0;
      
      while ((match = regex.exec(inlineText)) !== null) {
        const matchIndex = match.index;
        if (matchIndex > lastIndex) {
          parts.push(inlineText.substring(lastIndex, matchIndex));
        }
        
        const token = match[0];
        if (token.startsWith("**") && token.endsWith("**")) {
          parts.push(
            <strong key={matchIndex} style={{ color: "var(--text-primary)", fontWeight: 700 }}>
              {token.slice(2, -2)}
            </strong>
          );
        } else if (token.startsWith("[") && token.includes("](")) {
          const closeBracket = token.indexOf("]");
          const label = token.slice(1, closeBracket);
          const url = token.slice(closeBracket + 2, -1);
          parts.push(
            <a 
              key={matchIndex} 
              href={url} 
              target="_blank" 
              rel="noopener noreferrer" 
              style={{ color: "var(--color-primary)", textDecoration: "underline" }}
            >
              {label}
            </a>
          );
        }
        lastIndex = regex.lastIndex;
      }
      
      if (lastIndex < inlineText.length) {
        parts.push(inlineText.substring(lastIndex));
      }
      
      return parts.length > 0 ? parts : [inlineText];
    };

    lines.forEach((line, index) => {
      const trimmed = line.trim();
      
      if (trimmed.startsWith("###")) {
        if (inList) {
          elements.push(<ul key={`ul-${index}`} style={{ margin: "6px 0", paddingLeft: "20px" }}>{[...listItems]}</ul>);
          listItems.length = 0;
          inList = false;
        }
        elements.push(
          <h4 key={index} style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--text-primary)", marginTop: "12px", marginBottom: "6px" }}>
            {parseInline(trimmed.substring(3).trim())}
          </h4>
        );
      } else if (trimmed.startsWith("##")) {
        if (inList) {
          elements.push(<ul key={`ul-${index}`} style={{ margin: "6px 0", paddingLeft: "20px" }}>{[...listItems]}</ul>);
          listItems.length = 0;
          inList = false;
        }
        elements.push(
          <h3 key={index} style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--text-primary)", marginTop: "16px", marginBottom: "8px" }}>
            {parseInline(trimmed.substring(2).trim())}
          </h3>
        );
      } else if (trimmed.startsWith("-") || trimmed.startsWith("*")) {
        inList = true;
        listItems.push(
          <li key={`li-${index}`} style={{ margin: "4px 0", color: "var(--text-secondary)", listStyleType: "disc" }}>
            {parseInline(trimmed.substring(1).trim())}
          </li>
        );
      } else {
        if (inList) {
          elements.push(<ul key={`ul-${index}`} style={{ margin: "6px 0", paddingLeft: "20px" }}>{[...listItems]}</ul>);
          listItems.length = 0;
          inList = false;
        }
        
        if (trimmed === "") {
          elements.push(<div key={`spacer-${index}`} style={{ height: "8px" }} />);
        } else {
          elements.push(
            <p key={index} style={{ margin: "4px 0", lineHeight: "1.5" }}>
              {parseInline(trimmed)}
            </p>
          );
        }
      }
    });

    if (inList && listItems.length > 0) {
      elements.push(<ul key="ul-end" style={{ margin: "6px 0", paddingLeft: "20px" }}>{[...listItems]}</ul>);
    }

    return <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>{elements}</div>;
  };

  const getStatusText = (status: string) => {
    if (isZh) {
      switch (status) {
        case "completed": return "已完成";
        case "in-progress": return "开发中";
        case "idea": return "规划中";
        default: return status;
      }
    } else {
      switch (status) {
        case "completed": return "Completed";
        case "in-progress": return "In Progress";
        case "idea": return "Planning";
        default: return status;
      }
    }
  };

  const getCategoryText = (type: string) => {
    if (isZh) {
      switch (type) {
        case "project": return "项目";
        case "tech": return "技术栈";
        case "concept": return "理论概念";
        default: return type;
      }
    } else {
      switch (type) {
        case "project": return "Project";
        case "tech": return "Tech Stack";
        case "concept": return "Concept";
        default: return type;
      }
    }
  };

  const getRelationTypeText = (type: string) => {
    if (isZh) {
      switch (type) {
        case "implements": return "实现";
        case "belongs_to": return "归属";
        case "inspired_by": return "启发";
        case "optimize_for": return "优化";
        default: return type;
      }
    } else {
      switch (type) {
        case "implements": return "implements";
        case "belongs_to": return "belongs to";
        case "inspired_by": return "inspired by";
        case "optimize_for": return "optimizes";
        default: return type;
      }
    }
  };

  const getRelationClass = (type: string) => {
    switch (type) {
      case "implements": return "type-implements";
      case "belongs_to": return "type-belongs_to";
      case "inspired_by": return "type-inspired_by";
      case "optimize_for": return "type-optimize_for";
      default: return "";
    }
  };

  // Translations Dictionary for DetailSidebar Static Labels
  const labels = {
    selectedNode: isZh ? "当前聚焦节点" : "SELECTED NODE",
    status: isZh ? "状态" : "Status",
    coreConcept: isZh ? "核心理论领域" : "Core Theoretical Domain",
    techStackDesc: isZh ? "底层开发技术栈" : "Underlying Development Stack",
    tabInfo: isZh ? "概览" : "Overview",
    tabTech: isZh ? "技术与概念" : "Tech & Concepts",
    tabLinks: isZh ? "拓扑连接" : "Topology Links",
    motivationTitle: isZh ? "设计动机 / Motivation" : "Motivation",
    purposeTitle: isZh ? "核心目的 / Purpose" : "Core Purpose",
    aiTitle: isZh ? "AI 参与度 / AI Involvement" : "AI Involvement",
    descTitle: isZh ? "详细描述 / Description" : "Detailed Specifications",
    associatedTech: isZh ? "关联技术栈 / Tech Stack" : "Associated Tech Stack",
    associatedConcepts: isZh ? "涉及理论概念 / Concepts" : "Associated Concepts",
    relatedNodesTitle: isZh ? "拓扑关联节点 / Related Nodes" : "Topology Related Nodes",
    noTech: isZh ? "此节点本身属于技术栈或无关联的技术栈组件。" : "This node itself is a technology component or has no associated stack.",
    noLinks: isZh ? "此节点目前无特定方向 of 向外拓扑关系。" : "This node currently has no outward topological relationships.",
    focusBtn: isZh ? "聚焦探索节点" : "Focus Explore Node",
    emptyStateText: isZh 
      ? "在星图网络中点击任意项目、技术栈或理论节点，即可在此处查看其设计动机、AI参与度以及多跳关联 spec。"
      : "Click any project, technology, or concept node in the network to view its motivation, AI involvement, and multi-hop specifications here.",
    listProjects: isZh ? "项目列表" : "Projects List",
    listTech: isZh ? "技术栈列表" : "Technologies List",
    listConcepts: isZh ? "知识概念列表" : "Concepts List"
  };

  // Resolve bilingual content values
  const titleVal = isZh 
    ? (selectedNode?.title_zh || selectedNode?.title || selectedNode?.id || "") 
    : (selectedNode?.title_en || selectedNode?.title || selectedNode?.id || "");

  const motivationVal = isZh 
    ? (selectedNode?.motivation_zh || selectedNode?.motivation || "") 
    : (selectedNode?.motivation_en || selectedNode?.motivation || "");

  const purposeVal = isZh 
    ? (selectedNode?.purpose_zh || selectedNode?.purpose || "") 
    : (selectedNode?.purpose_en || selectedNode?.purpose || "");

  // Render markdown description text based on active language
  const renderDescription = () => {
    if (!selectedNode?.content) return "";
    let cleanContent = selectedNode.content.replace(/^# .*\n+/g, '');
    
    // In Chinese mode, keep default body. In English mode, if a translation is needed,
    // we can translate specific default phrases or let it display the content.
    // For PyTorch, NetworkX, Neo4j, NLP, Knowledge Graph - we can translate the content dynamically:
    if (!isZh) {
      const normId = (selectedNode?.id || "").toLowerCase();
      if (normId === "graphmind") {
        return "The core brain of the entire personal digital garden, responsible for building and exploring knowledge graphs.\n\n### Core Features\n- **Dynamic Ingestion**: Parse Markdown files, codebases, research papers, and web links.\n- **Relation Extraction**: Extract entity triples automatically using NLP and deep learning NER.\n- **Interactive Topology**: Explore thoughts in a 2D/3D force-directed canvas.";
      }
      if (normId === "text2kg") {
        return "An entity extraction pipeline that serves as the foundation for knowledge graph construction, extracting triples from unstructured text.\n\n### Features\n- **Multi-modal NER**: Extract custom entities and standard terms using fine-tuned models.\n- **Relation Classifier**: Detect dependencies and semantic links between entity pairs.";
      }
      if (normId === "mindflow") {
        return "A visual thinking tool focused on mapping scattered thoughts and notes into visual brain maps.\n\n### Features\n- **Real-time Mapping**: Highlight related keywords dynamically during writing.\n- **Force Layout Canvas**: Layout thoughts organically using physical engines.";
      }
      if (normId === "diffgraph") {
        return "A graph neural network research project exploring time-evolving representation learning on incremental graph topologies.\n\n### Features\n- **Incremental GNN**: Update node embeddings efficiently without recalculating the entire network.\n- **Temporal Analysis**: Track changes in network connection strengths over time.";
      }
      if (normId === "graphrag") {
        return "A retrieval-augmented generation framework merging LLMs with global/local knowledge graph topologies.\n\n### Features\n- **Community Summary**: Run high-level fact synthesis using global graph structures.\n- **Entity-Aware Recall**: Retrieve context accurately using vector search and sparse walks.";
      }
      if (normId === "pytorch") {
        return "An open-source deep learning framework providing efficient tensor computation for text embeddings and relation extraction.";
      }
      if (normId === "networkx") {
        return "A Python library for studying complex networks, used to analyze degree distribution and community centrality.";
      }
      if (normId === "neo4j") {
        return "An enterprise-grade native graph database providing sub-second query traversal via Cypher.";
      }
      if (normId === "nlp") {
        return "A core AI domain providing natural language representation, entity recognition, and triple extraction.";
      }
      if (normId === "知识图谱" || normId === "knowledge-graph") {
        return "A structured semantic network representing interconnected human knowledge mapped for machine indexing.";
      }
    }
    return cleanContent;
  };

  return (
    <div className="detail-sidebar">
      {selectedNode ? (
        <div className="detail-card">
          {/* Header row */}
          <div className="detail-header">
            <span className="detail-header-tag">
              {getCategoryText(selectedNode.type)}
            </span>
            <button onClick={onClose} className="btn-close-detail" title={isZh ? "关闭面板" : "Close Panel"}>
              <X size={16} />
            </button>
          </div>

          {/* Title block */}
          <div className="detail-title-section">
            <div className="detail-icon-circle">
              {selectedNode.type === "project" ? (
                <Briefcase size={20} style={{ color: "var(--color-primary)" }} />
              ) : selectedNode.type === "tech" ? (
                <Terminal size={20} style={{ color: "var(--color-green)" }} />
              ) : (
                <Cpu size={20} style={{ color: "var(--color-purple)" }} />
              )}
            </div>
            <div className="detail-title-col">
              <h3 className="detail-node-name">{titleVal}</h3>
              {selectedNode.type === "project" && (
                <span className="detail-node-desc">
                  {labels.status}: {getStatusText(selectedNode.status)}
                </span>
              )}
              {selectedNode.type === "concept" && (
                <span className="detail-node-desc">{labels.coreConcept}</span>
              )}
              {selectedNode.type === "tech" && (
                <span className="detail-node-desc">{labels.techStackDesc}</span>
              )}
            </div>
          </div>

          {/* Sidebar Navigation Tabs */}
          <div className="detail-tabs">
            <button 
              onClick={() => setActiveTab("info")} 
              className={`detail-tab-btn ${activeTab === "info" ? "active" : ""}`}
            >
              {labels.tabInfo}
            </button>
            <button 
              onClick={() => setActiveTab("tech")} 
              className={`detail-tab-btn ${activeTab === "tech" ? "active" : ""}`}
            >
              {labels.tabTech}
            </button>
            <button 
              onClick={() => setActiveTab("links")} 
              className={`detail-tab-btn ${activeTab === "links" ? "active" : ""}`}
            >
              {labels.tabLinks}
            </button>
          </div>

          {/* Tab Content Panes */}
          {activeTab === "info" && (
            <div className="detail-tab-pane">
              {/* Motivation */}
              {motivationVal && (
                <div className="detail-section">
                  <span className="detail-section-title">{labels.motivationTitle}</span>
                  <div className="detail-motivation-box">
                    “ {motivationVal} ”
                  </div>
                </div>
              )}

              {/* Purpose */}
              {purposeVal && (
                <div className="detail-section">
                  <span className="detail-section-title">{labels.purposeTitle}</span>
                  <p className="detail-purpose-text">
                    {purposeVal}
                  </p>
                </div>
              )}

              {/* AI Involvement */}
              {selectedNode.type === "project" && (
                <div className="detail-section">
                  <div className="ai-progress-row">
                    <span className="detail-section-title">{labels.aiTitle}</span>
                    <span className="ai-progress-pct">{selectedNode.ai_involvement}%</span>
                  </div>
                  <div className="ai-progress-bar-bg">
                    <div 
                      className="ai-progress-bar-fill"
                      style={{ width: `${selectedNode.ai_involvement}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Description Body */}
              {selectedNode.content && (
                <div className="detail-section">
                  <span className="detail-section-title">{labels.descTitle}</span>
                  <div className="detail-purpose-text" style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>
                    {parseMarkdownToReact(renderDescription())}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "tech" && (
            <div className="detail-tab-pane">
              {/* Associated Tech Stack */}
              {selectedNode.tech_stack && selectedNode.tech_stack.length > 0 ? (
                <div className="detail-section">
                  <span className="detail-section-title">{labels.associatedTech}</span>
                  <div className="tech-badges-grid">
                    {selectedNode.tech_stack.map((tech) => (
                      <div 
                        key={tech} 
                        onClick={() => onSelectNodeById(tech)}
                        className="tech-badge-card"
                      >
                        <div className="tech-badge-icon">
                          <Terminal size={14} style={{ color: "var(--color-green)" }} />
                        </div>
                        <span className="tech-badge-label">{getNodeDisplayTitle(tech)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="detail-section">
                  <span className="detail-section-title">{labels.associatedTech}</span>
                  <p className="detail-purpose-text" style={{ fontSize: "0.82rem" }}>{labels.noTech}</p>
                </div>
              )}

              {/* Associated Concepts */}
              {selectedNode.concepts && selectedNode.concepts.length > 0 && (
                <div className="detail-section">
                  <span className="detail-section-title">{labels.associatedConcepts}</span>
                  <div className="tech-badges-grid">
                    {selectedNode.concepts.map((concept) => (
                      <div 
                        key={concept} 
                        onClick={() => onSelectNodeById(concept)}
                        className="tech-badge-card"
                        style={{ borderColor: "var(--color-purple-border)" }}
                      >
                        <div className="tech-badge-icon">
                          <Cpu size={14} style={{ color: "var(--color-purple)" }} />
                        </div>
                        <span className="tech-badge-label" style={{ color: "var(--text-primary)" }}>{getNodeDisplayTitle(concept)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "links" && (
            <div className="detail-tab-pane">
              {/* Topology Relationships */}
              {selectedNode.related_nodes && selectedNode.related_nodes.length > 0 ? (
                <div className="detail-section">
                  <span className="detail-section-title">{labels.relatedNodesTitle}</span>
                  <div className="related-links-list">
                    {selectedNode.related_nodes.map((rel) => (
                      <div 
                        key={rel.id} 
                        onClick={() => onSelectNodeById(rel.id)}
                        className="related-link-item"
                      >
                        <div className="related-link-left">
                          <span className="related-link-name">{getNodeDisplayTitle(rel.id)}</span>
                          <span className={`related-link-type-badge ${getRelationClass(rel.type)}`}>
                            {getRelationTypeText(rel.type)}
                          </span>
                        </div>
                        <ArrowRight className="related-link-arrow" size={14} />
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="detail-section">
                  <span className="detail-section-title">{labels.relatedNodesTitle}</span>
                  <p className="detail-purpose-text" style={{ fontSize: "0.82rem" }}>{labels.noLinks}</p>
                </div>
              )}
            </div>
          )}

          {/* Action button */}
          <button 
            onClick={() => onSelectNodeById(selectedNode.id)}
            className="btn-primary-detail"
          >
            <span>{labels.focusBtn}</span>
            <ArrowRight size={16} />
          </button>
        </div>
      ) : (
        <div className="detail-card" style={{ padding: activeSidebarTab === "network" ? 0 : "24px 16px" }}>
          {activeSidebarTab === "network" ? (
            <div className="empty-detail-state">
              <div className="empty-detail-icon-box">
                <Compass size={24} style={{ animation: "spin 12s linear infinite" }} />
              </div>
              <p className="empty-detail-text">
                {labels.emptyStateText}
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px", height: "100%", overflow: "hidden" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", borderBottom: "1px solid var(--border-card)", paddingBottom: "12px" }}>
                {activeSidebarTab === "projects" ? (
                  <>
                    <Briefcase size={18} style={{ color: "var(--color-primary)" }} />
                    <span style={{ fontSize: "1rem", fontWeight: 700 }}>{labels.listProjects}</span>
                  </>
                ) : activeSidebarTab === "technologies" ? (
                  <>
                    <Terminal size={18} style={{ color: "var(--color-green)" }} />
                    <span style={{ fontSize: "1rem", fontWeight: 700 }}>{labels.listTech}</span>
                  </>
                ) : (
                  <>
                    <Cpu size={18} style={{ color: "var(--color-purple)" }} />
                    <span style={{ fontSize: "1rem", fontWeight: 700 }}>{labels.listConcepts}</span>
                  </>
                )}
              </div>
              
              <div className="sidebar-list-scroll" style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "10px", paddingRight: "4px" }}>
                {allNodes
                  .filter(node => {
                    if (activeSidebarTab === "projects") return node.type === "project";
                    if (activeSidebarTab === "technologies") return node.type === "tech";
                    if (activeSidebarTab === "concepts") return node.type === "concept";
                    return false;
                  })
                  .map(node => {
                    const nodeTitle = isZh
                      ? (node.title_zh || node.title || node.id)
                      : (node.title_en || node.title || node.id);
                    const nodeMotivation = isZh
                      ? (node.motivation_zh || node.motivation || "")
                      : (node.motivation_en || node.motivation || "");
                    
                    return (
                      <div 
                        key={node.id}
                        onClick={() => onSelectNodeById(node.id)}
                        className="sidebar-list-item-card"
                        style={{
                          padding: "12px",
                          borderRadius: "10px",
                          border: "1px solid var(--border-card)",
                          background: "var(--bg-card)",
                          cursor: "pointer",
                          transition: "all 0.2s",
                          display: "flex",
                          flexDirection: "column",
                          gap: "6px"
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontWeight: 600, fontSize: "0.9rem", color: "var(--text-primary)" }}>{nodeTitle}</span>
                          {node.type === "project" && (
                            <span style={{ fontSize: "0.72rem", color: "var(--color-primary)", fontWeight: 500 }}>
                              {node.ai_involvement}% AI
                            </span>
                          )}
                        </div>
                        {nodeMotivation && (
                          <span style={{ fontSize: "0.78rem", color: "var(--text-secondary)", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {nodeMotivation}
                          </span>
                        )}
                      </div>
                    );
                  })
                }
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
