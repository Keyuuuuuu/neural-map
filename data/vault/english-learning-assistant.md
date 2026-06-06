---
id: "english-learning-assistant"
title: "AI 英语口语学习助手"
type: "project"
status: "in-progress"
ai_involvement: 90
motivation: "传统口语软件缺乏即时且富有情感的互动反馈，导致学习者难以坚持且发音纠错不精准。"
purpose: "结合实时语音情感识别（SER）与生成式大模型，构建一个沉浸式、具备高同理心反馈的智能口语私教。"
tech_stack: ["Python", "PyTorch", "Next.js"]
concepts: ["NLP", "Deep-Learning"]
related_nodes:
  - id: "speech-emotion-recognition"
    type: "inspired_by"
  - id: "neural-map"
    type: "optimize_for"
---

# AI 英语口语学习助手

这是一款由大语言模型与实时语音分析技术驱动的英语口语陪练助手。通过流式语音传输与即时发音评估算法，为英语学习者提供像真人外教一样的对话体验。

## 关键功能

- **同理心对话**：借助底层情感识别模块（由 [Speech Emotion Recognition](file:///data/vault/speech-emotion-recognition.md) 驱动），实时感知用户的焦虑、自信或挫败感，动态调整 AI 助手的语气和鼓励策略。
- **发音精确纠错**：利用音素级对齐算法（G2P），对用户的发音进行精细化评估，指出元音饱满度、重音及连读问题。
- **极客全栈架构**：前端采用 `Next.js` 提供高响应度的音频录制与实时波形动画，后端采用 Python 高速中转。

## 研发进度

- [x] 流式 WebRTC 音频收发链路
- [/] 基于音素比对的口语纠错算法微调
- [ ] 情感反馈对话链路闭环
