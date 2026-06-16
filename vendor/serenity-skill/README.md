# Serenity Skills - 原始参考

此目录保存 [haskaomni/serenity-skill](https://github.com/haskaomni/serenity-skill) 的原始 SKILL.md 文件，仅作为开发参考，不直接运行。

## 许可

MIT License - 与原始仓库一致。

## 原始仓库

https://github.com/haskaomni/serenity-skill

## 技能清单

- `serenity-alpha` - 新闻转 Alpha 假设
- `bayesian-intrinsic-growth-valuation` - 贝叶斯内在增长估值
- `gf-dma-health-index` - 基本面/趋势健康评分
- `tam-adj-peg` - TAM 调整 PEG 估值
- `buy-side-equity-research-memo` - 完整买方研究备忘录

## 集成说明

在 moki-research-card 项目中，这些技能的逻辑已被转译为 TypeScript，位于：
- `src/types/serenity.ts` - 类型定义
- `src/lib/serenity/` - 核心计算引擎
- `src/components/serenity/` - UI 组件
