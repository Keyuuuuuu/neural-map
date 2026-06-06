---
id: "graphrag"
title: "GraphRAG"
title_en: "GraphRAG"
title_zh: "GraphRAG"
type: "project"
status: "in-progress"
ai_involvement: 90
motivation: "大语言模型面对长文本推理和复杂关系多跳查询时存在幻觉，且对特定私有知识的感知十分微弱。"
motivation_en: "Large language models suffer from hallucinations in long-context reasoning and complex multi-hop relation queries, with weak awareness of specific private knowledge."
motivation_zh: "大语言模型面对长文本推理和复杂关系多跳查询时存在幻觉，且对特定私有知识的感知十分微弱。"
purpose: "利用图谱拓扑结构进行检索增强，生成更具结构化与事实性支撑的回答。"
purpose_en: "Leverage knowledge graph topology structures for retrieval-augmented generation to produce highly structured and fact-supported answers."
purpose_zh: "利用图谱拓扑结构进行检索增强，生成更具结构化与事实性支撑的回答。"
tech_stack: ["Python", "Neo4j", "PyTorch"]
concepts: ["知识图谱", "NLP"]
related_nodes:
  - id: "graphmind"
    type: "belongs_to"
---

# GraphRAG

基于知识图谱的检索增强生成项目，将 LLM 与结构化图形的全局/局部关系融合。

## 功能

- **全局社区提取**：通过 Graphmind 提取出的社区摘要进行高层次事实生成。
- **实体感知召回**：基于密集检索 and 稀疏图游走，精准捕获多跳关联的上下文。
