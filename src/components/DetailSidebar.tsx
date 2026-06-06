"use client";

import React, { useState } from "react";
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
}

export default function DetailSidebar({
  selectedNode,
  onClose,
  onSelectNodeById,
  lang,
}: DetailSidebarProps) {
  const [activeTab, setActiveTab] = useState<"info" | "tech" | "links">("info");
  const isZh = lang === "zh";

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
    noLinks: isZh ? "此节点目前无特定方向的向外拓扑关系。" : "This node currently has no outward topological relationships.",
    focusBtn: isZh ? "聚焦探索节点" : "Focus Explore Node",
    emptyStateText: isZh 
      ? "在星图网络中点击任意项目、技术栈或理论节点，即可在此处查看其设计动机、AI参与度以及多跳关联 spec。"
      : "Click any project, technology, or concept node in the network to view its motivation, AI involvement, and multi-hop specifications here."
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
      const normId = selectedNode.id.toLowerCase();
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
                  <p className="detail-purpose-text" style={{ whiteSpace: "pre-line", fontSize: "0.82rem", color: "var(--text-secondary)" }}>
                    {renderDescription()}
                  </p>
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
                        <span className="tech-badge-label">{tech}</span>
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
                        <span className="tech-badge-label" style={{ color: "var(--text-primary)" }}>{concept}</span>
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
                          <span className="related-link-name">{rel.id}</span>
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
        <div className="detail-card" style={{ padding: 0 }}>
          <div className="empty-detail-state">
            <div className="empty-detail-icon-box">
              <Compass size={24} style={{ animation: "spin 12s linear infinite" }} />
            </div>
            <p className="empty-detail-text">
              {labels.emptyStateText}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
