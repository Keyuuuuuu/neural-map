---
id: "diffgraph"
title: "DiffGraph"
title_en: "DiffGraph"
title_zh: "DiffGraph"
type: "project"
status: "idea"
ai_involvement: 65
motivation: "大型图谱在节点频繁增删时计算成本高昂，传统的静态重构方法缺乏实时局部演化更新的能力。"
motivation_en: "Large-scale graphs incur heavy computational costs during frequent node updates; traditional static reconstruction lack the capability for real-time local updates."
motivation_zh: "大型图谱在节点频繁增删时计算成本高昂，传统的静态重构方法缺乏实时局部演化更新的能力。"
purpose: "探索在知识图谱的差分变化中，通过 GNN 动态更新图特征与表示。"
purpose_en: "Explore dynamic update of graph features and representations via GNNs in response to differential changes in the knowledge graph."
purpose_zh: "探索在知识图谱的差分变化中，通过 GNN 动态更新图特征与表示。"
tech_stack: ["PyTorch", "Python"]
concepts: ["知识图谱", "NLP"]
related_nodes:
  - id: "graphmind"
    type: "belongs_to"
---

# DiffGraph

图神经网络实验项目，专注于增量图结构的表示学习研究。

## 特性

- **增量式 GNN 更新**：避免重新计算整个图谱的 Embeddings，仅对增量/变更部分实施消息传递。
- **时间演化分析**：捕获图谱随时间推移发生的连接强度变化。
