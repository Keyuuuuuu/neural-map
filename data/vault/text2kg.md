---
id: "text2kg"
title: "Text2KG"
title_en: "Text2KG"
title_zh: "Text2KG"
type: "project"
status: "completed"
ai_involvement: 85
motivation: "非结构化文本占到所有数据源的80%以上，对其进行人工关系建模耗时且无法扩展。"
motivation_en: "Unstructured text accounts for over 80% of all data sources, making manual relationship modeling time-consuming and non-scalable."
motivation_zh: "非结构化文本占到所有数据源的80%以上，对其进行人工关系建模耗时且无法扩展。"
purpose: "端到端地从无结构非格式化文本中提取实体、属性及语义三元组。"
purpose_en: "Extract entities, properties, and semantic triples from unstructured, unformatted text in an end-to-end manner."
purpose_zh: "端到端地从无结构非格式化文本中提取实体、属性及语义三元组。"
tech_stack: ["Python", "PyTorch", "NLP"]
concepts: ["知识图谱", "NLP"]
related_nodes:
  - id: "graphmind"
    type: "belongs_to"
---

# Text2KG

实体抽取项目，作为知识图谱构建的底层基础管道，负责从非结构化文本中全自动抽取高精度实体与语义三元组。

## 特性

- **多模式实体识别**：基于微调的深度学习模型提取人名、机构、地名及自定义专业术语。
- **关系分类器**：自动判断实体对之间的依赖、继承或关联强度。
