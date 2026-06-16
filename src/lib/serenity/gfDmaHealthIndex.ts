/**
 * GF-DMA Health Index - 基本面/趋势健康评分引擎
 *
 * 核心公式：HealthScore = 40%S_GrowthMatch + 25%S_Divergence + 20%S_Parallel + 15%S_Revision
 */

import type { GfDmaHealthIndex } from '@/types/serenity';

/**
 * 生成 GF-DMA 健康指数分析（Mock 实现）
 */
export function generateGfDmaHealthIndex(ticker: string, companyName: string): GfDmaHealthIndex {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _ = { ticker, companyName }; // Placeholder for future use
  return {
    version: '1.0',
    type: 'gf-dma-health-index',

    finalScore: 72,
    healthState: 'hot_but_supported',
    oneLinerJudgement: '趋势强劲但短期略过热，基本面仍有支撑，密切关注背离程度。',

    fundamentalSpeed: {
      latestQuarterRevenue: 1000000000,
      nextQuarterRevenueGuide: 1080000000,
      revenueQoq: 0.08,
      epsQoq: 0.10,
      grossProfitQoq: 0.09,
      gRevenue: 0.08,
      gGrossProfit: 0.09,
      gEps: 0.10,
      gRevision: 0.03,
      overallGF: 0.085,
    },

    dmaSpeedMatches: [
      {
        dma: '20DMA',
        quarterlySlope: 0.12,
        relativeToFundamental: 1.41,
        status: 'Hot but potentially explainable',
      },
      {
        dma: '50DMA',
        quarterlySlope: 0.10,
        relativeToFundamental: 1.18,
        status: 'Healthy match',
      },
      {
        dma: '100DMA',
        quarterlySlope: 0.09,
        relativeToFundamental: 1.06,
        status: 'Healthy match',
      },
      {
        dma: '200DMA',
        quarterlySlope: 0.07,
        relativeToFundamental: 0.82,
        status: 'Under-reflected or cheap versus trend',
      },
    ],

    priceDmaDivergences: [
      { metric: 'P / 20DMA - 1', divergence: 0.08, status: 'Strong trend, mild valuation stretch' },
      { metric: 'P / 50DMA - 1', divergence: 0.15, status: 'Hot; divergence score should fall' },
      { metric: 'P / 100DMA - 1', divergence: 0.22, status: 'Medium-term overheat' },
      { metric: 'P / 200DMA - 1', divergence: 0.35, status: 'Major repricing' },
    ],

    trendParallelism: {
      escapeRatio: 1.6,
      status: 'Short-term acceleration; acceptable',
    },

    revisionConfirmation: {
      guidanceVsConsensus: '公司指引略高于共识',
      past30DayChange: '分析师预期小幅上调',
      status: 'Mild upward revisions',
      score: 72,
    },

    scoreBreakdown: {
      growthMatchScore: 75,
      divergenceScore: 65,
      parallelScore: 78,
      revisionScore: 72,
    },
  };
}
