---
id: "neural-map"
title: "NexusMind: 个人神经索引网"
type: "project"
status: "in-progress"
ai_involvement: 95
motivation: "在 AI 辅助开发的时代，大量的代码生成导致开发者产生‘知识漂浮感’与记忆断层，传统的树状笔记无法还原网状思维。"
purpose: "通过自动化抓取分布式 Git 库元数据，渲染高可视化的 2D 拓扑图谱，重塑个人技术资产的组织结构。"
tech_stack: ["Next.js", "React"]
concepts: ["Graph-Theory", "Information-Architecture"]
related_nodes:
  - id: "english-learning-assistant"
    type: "inspired_by"
---

# NexusMind: 个人神经索引网

本系统是我们的集中式构建与渲染中枢。它基于 Next.js（App Router）架构，在构建期间利用 Node.js 提取各分布式项目的元数据，并在前端绘制高动态、极具科幻质感的神经网图谱。

## 架构特色

- **零本地冗余**：支持直接通过 GitHub API 获取各子项目的 README frontmatter，主页只作逻辑编织与展示。
- **2D 力导向引擎**：基于 `react-force-graph-2d` 深度定制玻璃拟态节点和流光连线。
- **高维过滤器**：支持按技术标签、概念主题、AI 参与度等多个维度动态过滤网络。

## 待办事项

- [x] 系统架构与数据协议规范制定
- [/] Next.js 基础骨架搭建与 Force-graph 组件集成
- [ ] Vercel 自动化部署及 Webhook 触发器配置
