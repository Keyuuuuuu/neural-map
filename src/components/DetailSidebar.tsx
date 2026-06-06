"use client";

import React, { useState } from "react";
import { 
  Briefcase, 
  Terminal, 
  Cpu, 
  ArrowRight, 
  X, 
  Compass, 
  Sparkles,
  Link2,
  BookOpen,
  Layers
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
  const [activeTab, setActiveTab] = useState<"info" | "tech" | "links">("info");

  const getStatusText = (status: string) => {
    switch (status) {
      case "completed": return "已完成";
      case "in-progress": return "开发中";
      case "idea": return "规划中";
      default: return status;
    }
  };

  const getCategoryText = (type: string) => {
    switch (type) {
      case "project": return "项目";
      case "tech": return "技术栈";
      case "concept": return "理论概念";
      default: return type;
    }
  };

  const getRelationTypeText = (type: string) => {
    switch (type) {
      case "implements": return "实现";
      case "belongs_to": return "归属";
      case "inspired_by": return "启发";
      case "optimize_for": return "优化";
      default: return type;
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

  return (
    <div className="detail-sidebar">
      {selectedNode ? (
        <div className="detail-card">
          {/* Header row */}
          <div className="detail-header">
            <span className="detail-header-tag">
              {getCategoryText(selectedNode.type)}
            </span>
            <button onClick={onClose} className="btn-close-detail" title="关闭面板">
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
              <h3 className="detail-node-name">{selectedNode.title}</h3>
              {selectedNode.type === "project" && (
                <span className="detail-node-desc">
                  状态: {getStatusText(selectedNode.status)}
                </span>
              )}
              {selectedNode.type === "concept" && (
                <span className="detail-node-desc">核心理论领域</span>
              )}
              {selectedNode.type === "tech" && (
                <span className="detail-node-desc">底层开发技术栈</span>
              )}
            </div>
          </div>

          {/* Sidebar Navigation Tabs (Fusion Option 2) */}
          <div className="detail-tabs">
            <button 
              onClick={() => setActiveTab("info")} 
              className={`detail-tab-btn ${activeTab === "info" ? "active" : ""}`}
            >
              概览
            </button>
            <button 
              onClick={() => setActiveTab("tech")} 
              className={`detail-tab-btn ${activeTab === "tech" ? "active" : ""}`}
            >
              技术与概念
            </button>
            <button 
              onClick={() => setActiveTab("links")} 
              className={`detail-tab-btn ${activeTab === "links" ? "active" : ""}`}
            >
              拓扑连接
            </button>
          </div>

          {/* Tab Content Panes */}
          {activeTab === "info" && (
            <div className="detail-tab-pane">
              {/* Motivation */}
              {selectedNode.motivation && (
                <div className="detail-section">
                  <span className="detail-section-title">设计动机 / Motivation</span>
                  <div className="detail-motivation-box">
                    “ {selectedNode.motivation} ”
                  </div>
                </div>
              )}

              {/* Purpose */}
              {selectedNode.purpose && (
                <div className="detail-section">
                  <span className="detail-section-title">核心目的 / Purpose</span>
                  <p className="detail-purpose-text">
                    {selectedNode.purpose}
                  </p>
                </div>
              )}

              {/* AI Involvement */}
              {selectedNode.type === "project" && (
                <div className="detail-section">
                  <div className="ai-progress-row">
                    <span className="detail-section-title">AI 参与度 / AI Involvement</span>
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
                  <span className="detail-section-title">详细描述 / Description</span>
                  <p className="detail-purpose-text" style={{ whiteSpace: "pre-line", fontSize: "0.82rem", color: "var(--text-secondary)" }}>
                    {selectedNode.content.replace(/^# .*\n+/g, '')}
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
                  <span className="detail-section-title">关联技术栈 / Tech Stack</span>
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
                  <span className="detail-section-title">关联技术栈 / Tech Stack</span>
                  <p className="detail-purpose-text" style={{ fontSize: "0.82rem" }}>此节点本身属于技术栈或无关联的技术栈组件。</p>
                </div>
              )}

              {/* Associated Concepts */}
              {selectedNode.concepts && selectedNode.concepts.length > 0 && (
                <div className="detail-section">
                  <span className="detail-section-title">涉及理论概念 / Concepts</span>
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
                  <span className="detail-section-title">拓扑关联节点 / Related Nodes</span>
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
                  <span className="detail-section-title">拓扑关联节点 / Related Nodes</span>
                  <p className="detail-purpose-text" style={{ fontSize: "0.82rem" }}>此节点目前无特定方向的向外拓扑关系。</p>
                </div>
              )}
            </div>
          )}

          {/* Action button */}
          <button 
            onClick={() => onSelectNodeById(selectedNode.id)}
            className="btn-primary-detail"
          >
            <span>聚焦探索节点</span>
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
              在星图网络中点击任意项目、技术栈或理论节点，即可在此处查看其设计动机、AI参与度以及多跳关联 spec。
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
