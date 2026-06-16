/**
 * TAM-Adj-PEG - TAM 调整 PEG 估值引擎
 *
 * 核心公式：TAM-Adj-PEG = Forward PE / (EPS CAGR x TAM Runway Factor x Quality Factor)
 */

import type { TamAdjPegValuation } from '@/types/serenity';

/**
 * 生成 TAM-Adj-PEG 估值分析（Mock 实现）
 */
export function generateTamAdjPeg(ticker: string, companyName: string): TamAdjPegValuation {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _ = { ticker, companyName }; // Placeholder for future use
  const forwardPe = 35;
  const epsCagr2To3Yr = 0.25;
  const tamRunwayFactor = 1.25;
  const qualityFactor = 1.0;
  const adjustedGrowth = epsCagr2To3Yr * tamRunwayFactor * qualityFactor;
  const tamAdjPeg = forwardPe / (adjustedGrowth * 100);

  return {
    version: '1.0',
    type: 'tam-adj-peg',

    companyName,
    ticker,

    currentValuation: {
      currentPe: 40,
      forwardPe,
      traditionalPeg: forwardPe / (epsCagr2To3Yr * 100),
    },

    growthBreakdown: {
      epsCagr2To3Yr,
      revenueCagr: 0.20,
      tamCagr: 0.15,
      currentRevenueVsTam: 0.08,
      highGrowthDurationYears: 8,
    },

    tamRunwayFactor: {
      estimate: tamRunwayFactor,
      reasoning: 'TAM 空间大，当前渗透率低，预计高速增长可持续 8 年左右',
    },

    qualityFactor: {
      estimate: qualityFactor,
      positives: [
        '行业地位领先',
        '客户粘性良好',
        '财务健康',
      ],
      negatives: [
        '竞争加剧风险',
        '技术迭代风险',
      ],
    },

    calculation: {
      adjustedGrowth,
      tamAdjPeg,
    },

    conclusion: {
      valuationTier:
        tamAdjPeg < 0.5
          ? 'very_cheap'
          : tamAdjPeg < 0.8
            ? 'clearly_attractive'
            : tamAdjPeg < 1.2
              ? 'reasonable_to_slightly_cheap'
              : tamAdjPeg < 1.8
                ? 'reasonable_to_slightly_expensive'
                : tamAdjPeg < 2.5
                  ? 'expensive_unless_super_long_runway'
                  : 'very_expensive_or_inputs_distorted',
      upsideDrivers: [
        'TAM 持续扩张',
        '市场份额提升',
        '利润率改善',
      ],
      downsideRisks: [
        '竞争侵蚀份额',
        '增速不及预期',
        '估值回调',
      ],
      suitablePositionType: 'core_growth',
    },
  };
}
