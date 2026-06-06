"use client";

import React from "react";

interface ControlPanelProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedTypes: {
    project: boolean;
    tech: boolean;
    concept: boolean;
  };
  toggleType: (type: "project" | "tech" | "concept") => void;
  minAiInvolvement: number;
  setMinAiInvolvement: (val: number) => void;
  onReset: () => void;
  nodeStats: {
    total: number;
    project: number;
    tech: number;
    concept: number;
  };
}

export default function ControlPanel({
  searchQuery,
  setSearchQuery,
  selectedTypes,
  toggleType,
  minAiInvolvement,
  setMinAiInvolvement,
  onReset,
  nodeStats,
}: ControlPanelProps) {
  return (
    <div className="glass-panel" style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>NexusMind</h2>
        <span style={styles.subtitle}>智能个人技术脑图索引</span>
      </div>

      <hr style={styles.divider} />

      {/* Search Bar */}
      <div style={styles.section}>
        <label style={styles.label}>检索节点</label>
        <div style={styles.searchContainer}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="输入技术、项目或概念..."
            style={styles.searchInput}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} style={styles.clearSearchBtn}>
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Dimension Filters */}
      <div style={styles.section}>
        <label style={styles.label}>筛选维度</label>
        <div style={styles.checkboxGroup}>
          <label style={{ ...styles.checkboxLabel, borderColor: selectedTypes.project ? 'var(--color-project)' : 'var(--border-glass)' }}>
            <input
              type="checkbox"
              checked={selectedTypes.project}
              onChange={() => toggleType("project")}
              style={{ ...styles.checkbox, accentColor: 'var(--color-project)' }}
            />
            <span style={{ color: selectedTypes.project ? 'var(--color-project)' : 'var(--color-text-secondary)' }}>
              项目 ({nodeStats.project})
            </span>
            <span style={{ ...styles.dot, backgroundColor: 'var(--color-project)' }} />
          </label>

          <label style={{ ...styles.checkboxLabel, borderColor: selectedTypes.tech ? 'var(--color-tech)' : 'var(--border-glass)' }}>
            <input
              type="checkbox"
              checked={selectedTypes.tech}
              onChange={() => toggleType("tech")}
              style={{ ...styles.checkbox, accentColor: 'var(--color-tech)' }}
            />
            <span style={{ color: selectedTypes.tech ? 'var(--color-tech)' : 'var(--color-text-secondary)' }}>
              技术 ({nodeStats.tech})
            </span>
            <span style={{ ...styles.dot, backgroundColor: 'var(--color-tech)' }} />
          </label>

          <label style={{ ...styles.checkboxLabel, borderColor: selectedTypes.concept ? 'var(--color-concept)' : 'var(--border-glass)' }}>
            <input
              type="checkbox"
              checked={selectedTypes.concept}
              onChange={() => toggleType("concept")}
              style={{ ...styles.checkbox, accentColor: 'var(--color-concept)' }}
            />
            <span style={{ color: selectedTypes.concept ? 'var(--color-concept)' : 'var(--color-text-secondary)' }}>
              概念 ({nodeStats.concept})
            </span>
            <span style={{ ...styles.dot, backgroundColor: 'var(--color-concept)' }} />
          </label>
        </div>
      </div>

      {/* AI Involvement Slider */}
      <div style={styles.section}>
        <div style={styles.sliderHeader}>
          <label style={styles.label}>AI 参与度下限</label>
          <span style={styles.sliderValue}>{minAiInvolvement}%</span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          step="5"
          value={minAiInvolvement}
          onChange={(e) => setMinAiInvolvement(Number(e.target.value))}
          style={styles.slider}
        />
        <div style={styles.sliderLabels}>
          <span>0%</span>
          <span>50%</span>
          <span>100%</span>
        </div>
      </div>

      <hr style={styles.divider} />

      {/* Graph Statistics */}
      <div style={styles.statsContainer}>
        <div style={styles.statItem}>
          <span style={styles.statValue}>{nodeStats.total}</span>
          <span style={styles.statLabel}>已激活节点</span>
        </div>
        <button onClick={onReset} style={styles.resetButton}>
          重置视图
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: "20px",
    width: "280px",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    zIndex: 10,
    pointerEvents: "auto",
  },
  header: {
    display: "flex",
    flexDirection: "column",
  },
  title: {
    fontSize: "1.4rem",
    fontWeight: "700",
    color: "#fff",
    letterSpacing: "1px",
    textShadow: "0 0 10px rgba(255, 255, 255, 0.1)",
  },
  subtitle: {
    fontSize: "0.75rem",
    color: "var(--color-text-secondary)",
    letterSpacing: "0.5px",
    marginTop: "2px",
  },
  divider: {
    border: "none",
    height: "1px",
    backgroundColor: "var(--border-glass)",
  },
  section: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  label: {
    fontSize: "0.8rem",
    fontWeight: "600",
    color: "var(--color-text-primary)",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  searchContainer: {
    position: "relative",
    display: "flex",
    alignItems: "center",
  },
  searchInput: {
    width: "100%",
    padding: "10px 12px",
    paddingRight: "30px",
    borderRadius: "8px",
    border: "1px solid var(--border-glass)",
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    color: "#fff",
    fontFamily: "var(--font-sans)",
    fontSize: "0.85rem",
    outline: "none",
    transition: "border-color 0.2s",
  },
  clearSearchBtn: {
    position: "absolute",
    right: "10px",
    background: "none",
    border: "none",
    color: "var(--color-text-secondary)",
    cursor: "pointer",
    fontSize: "0.75rem",
  },
  checkboxGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  checkboxLabel: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "8px 12px",
    borderRadius: "8px",
    border: "1px solid var(--border-glass)",
    cursor: "pointer",
    fontSize: "0.85rem",
    transition: "all 0.2s ease",
    userSelect: "none",
    backgroundColor: "rgba(0, 0, 0, 0.1)",
  },
  checkbox: {
    marginRight: "10px",
    cursor: "pointer",
  },
  dot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    boxShadow: "0 0 6px currentColor",
  },
  sliderHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sliderValue: {
    fontSize: "0.85rem",
    color: "var(--color-project)",
    fontWeight: "600",
    fontFamily: "var(--font-mono)",
  },
  slider: {
    width: "100%",
    height: "4px",
    borderRadius: "2px",
    backgroundColor: "var(--border-glass)",
    outline: "none",
    cursor: "pointer",
    margin: "8px 0 4px 0",
  },
  sliderLabels: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "0.7rem",
    color: "var(--color-text-muted)",
    fontFamily: "var(--font-mono)",
  },
  statsContainer: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: "4px",
  },
  statItem: {
    display: "flex",
    flexDirection: "column",
  },
  statValue: {
    fontSize: "1.1rem",
    fontWeight: "700",
    color: "#fff",
    fontFamily: "var(--font-mono)",
  },
  statLabel: {
    fontSize: "0.7rem",
    color: "var(--color-text-muted)",
  },
  resetButton: {
    padding: "6px 12px",
    borderRadius: "8px",
    border: "1px solid var(--border-glass)",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    color: "var(--color-text-primary)",
    fontSize: "0.75rem",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s",
    outline: "none",
  },
};
