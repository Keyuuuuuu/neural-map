---
id: "speech-emotion-recognition"
title: "语音情感识别研究 (SER)"
type: "project"
status: "completed"
ai_involvement: 80
motivation: "现有 SER 模型在跨语料库评估时泛化能力极差，且缺乏在消费级显卡（RTX 4090）上的轻量化训练基准。"
purpose: "探索低时延音频特征提取方案，构建一个高准确率且可用于实时语音交互的轻量化情感分类引擎。"
tech_stack: ["Python", "PyTorch", "Librosa"]
concepts: ["Signal-Processing", "Deep-Learning"]
related_nodes:
  - id: "english-learning-assistant"
    type: "optimize_for"
---

# 语音情感识别研究 (SER)

语音情感识别（Speech Emotion Recognition, SER）是人机交互（HCI）领域中至关重要的一环。本项目旨在通过声学特征工程与轻量级深度学习模型的结合，在低延迟下实现高准确率的实时语音情感分类。

## 核心技术实现

1. **音频特征提取**：利用 `Librosa` 提取梅尔频率倒谱系数（MFCCs）、声谱质心（Spectral Centroid）以及色度特征（Chromagram）。
2. **轻量化神经网络**：在 `PyTorch` 中构建了一套 CNN-BiLSTM 融合架构，仅需约 1.2M 参数，极大提升了推理速度。
3. **优化基准**：专门针对单张 RTX 4090 显卡进行轻量化训练和推理优化，使得单次推断延迟降低至 12ms 以内。

## 项目里程碑

- [x] 跨语料库（RAVDESS & IEMOCAP）特征归一化管道搭建
- [x] 轻量级 CNN-BiLSTM 架构设计与消融实验
- [x] 实时麦克风输入情感分类 Demo 实现
