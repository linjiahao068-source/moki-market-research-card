/**
 * Serenity Skills - 核心计算引擎入口
 *
 * 基于 haskaomni/serenity-skill 的研究框架
 * 真实数据驱动版本
 */

import type { SerenityAnalysisBundle } from '@/types/serenity';
import type { BasicCompanyData } from '@/types/basic-data';
import type { EarningsSnapshotData } from '@/types/earnings';
import type { SecurityRecord } from '@/types/security';

// 导入真实数据版本（用于内部使用）
import { generateSerenityAlphaWithData } from './serenityAlphaRealData';
import { generateBayesianValuationWithData } from './bayesianValuationRealData';
import { generateGfDmaHealthIndexWithData } from './gfDmaHealthIndexRealData';
import { generateTamAdjPegWithData } from './tamAdjPegRealData';
import { generateBuySideMemoWithData } from './buySideMemoRealData';

// 导出原有的函数（向后兼容）
export { generateSerenityAlpha } from './serenityAlpha';
export { generateBayesianValuation } from './bayesianValuation';
export { generateGfDmaHealthIndex } from './gfDmaHealthIndex';
export { generateTamAdjPeg } from './tamAdjPeg';
export { generateBuySideMemo } from './buySideMemo';
export { generateSerenityBundle } from './mockData';
export { SERENITY_DATA_NOTICE } from './mockData';

// 导出真实数据版本（新增）
export { generateSerenityAlphaWithData };
export { generateBayesianValuationWithData };
export { generateGfDmaHealthIndexWithData };
export { generateTamAdjPegWithData };
export { generateBuySideMemoWithData };

export interface SerenityDataInput {
  ticker: string;
  companyName: string;
  market?: 'US' | 'HK' | 'CN';
  security?: SecurityRecord;
  basicData?: BasicCompanyData;
  earningsSnapshot?: EarningsSnapshotData;
}

/**
 * 计算数据可用性评分
 */
function calculateDataAvailability(input: SerenityDataInput): {
  hasBasicData: boolean;
  hasEarningsData: boolean;
  hasValuationData: boolean;
  hasGrowthData: boolean;
  hasSufficientData: boolean;
  overallScore: number;
} {
  const hasBasicData = !!input.basicData &&
    input.basicData.provider !== 'mock' &&
    input.basicData.coverageStatus !== 'empty' &&
    input.basicData.coverageStatus !== 'failed';
  const hasEarningsData = !!input.earningsSnapshot &&
    input.earningsSnapshot.provider !== 'mock';
  const hasValuationData = hasEarningsData && (
    input.earningsSnapshot?.currentPrice !== undefined ||
    input.earningsSnapshot?.forwardPE !== undefined ||
    input.earningsSnapshot?.trailingPE !== undefined
  );
  const hasGrowthData = hasEarningsData && !!input.earningsSnapshot?.metrics && input.earningsSnapshot.metrics.some((metric) =>
    metric.quality !== 'missing' &&
    (metric.actual !== undefined || metric.estimate !== undefined || metric.yoyPct !== undefined)
  );
  const hasSufficientData = hasBasicData && hasEarningsData && hasValuationData;

  const overallScore = [
    hasBasicData ? 1 : 0,
    hasEarningsData ? 1 : 0,
    hasValuationData ? 1 : 0,
    hasGrowthData ? 1 : 0
  ].filter(Boolean).length / 4;

  return {
    hasBasicData,
    hasEarningsData,
    hasValuationData,
    hasGrowthData,
    hasSufficientData,
    overallScore
  };
}

/**
 * 构建数据状态说明
 */
function buildDataNotice(
  input: SerenityDataInput,
  availability: ReturnType<typeof calculateDataAvailability>
): string {
  const sources: string[] = [];

  if (input.basicData?.provider) {
    sources.push(input.basicData.provider);
  }
  if (input.earningsSnapshot?.provider) {
    sources.push(input.earningsSnapshot.provider);
  }

  const uniqueSources = [...new Set(sources)];

  if (availability.hasSufficientData) {
    return `Serenity Analysis 基于真实数据生成 · 数据来源: ${uniqueSources.join(' + ')} · 数据覆盖率 ${(availability.overallScore * 100).toFixed(0)}%`;
  } else if (availability.overallScore > 0) {
    return `Serenity Analysis 基于部分真实数据生成 · 数据来源: ${uniqueSources.join(' + ') || '待补充'} · 部分模块因数据不足暂未启用`;
  } else {
    return `Serenity Analysis 当前为演示或占位数据 · 真实数据接入中 · 数据仅供研究参考，不构成投资建议`;
  }
}

/**
 * 生成完整的 Serenity 分析包 - 完全基于真实数据
 */
export function generateSerenityBundleFromRealData(
  input: SerenityDataInput
): SerenityAnalysisBundle {
  const { ticker, companyName } = input;

  // 计算数据可用性
  const availability = calculateDataAvailability(input);

  // 基于数据可用性决定生成哪些模块
  return {
    ticker,
    companyName,
    generatedAt: new Date().toISOString(),

    alphaAnalysis: availability.hasBasicData
      ? generateSerenityAlphaWithData(input)
      : undefined,

    bayesianValuation: availability.hasValuationData
      ? generateBayesianValuationWithData(input)
      : undefined,

    gfDmaHealthIndex: availability.hasEarningsData
      ? generateGfDmaHealthIndexWithData(input)
      : undefined,

    tamAdjPeg: availability.hasGrowthData
      ? generateTamAdjPegWithData(input)
      : undefined,

    buySideMemo: availability.hasSufficientData
      ? generateBuySideMemoWithData(input)
      : undefined,

    // 数据状态说明
    dataNotice: buildDataNotice(input, availability)
  };
}
