---
id: "doc2kg-pipeline"
title: "Doc2KG Pipeline"
type: "project"
status: "completed"
ai_involvement: 75
motivation: "Static text documents represent an unstructured format where structural connections remain hidden."
purpose: "A pipeline to parse files, extract tabular and text metadata, and construct standard graphs."
tech_stack: ["NLP", "Python", "YAML", "Markdown-Parser"]
concepts: ["Information-Retrieval", "Semantic-Retrieval"]
related_nodes:
  - id: "knowledge-graph-toolkit"
    type: "optimize_for"
---

# Doc2KG Pipeline

A modular document parsing pipeline designed to ingest complex multi-page PDFs, docx, and HTML pages, normalize their structural layouts, and feed them into entity extraction engines.

## Features

- **Structural Layout Parsing**: Separates headers, tables, images, and text bodies.
- **YAML Schema Definitions**: Standardizes intermediate parsing formats.
- **Markdown Conversion**: Integrates with markdown parsers to construct clean markdown trees.
