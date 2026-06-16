/**
 * TAM-Adj-PEG - 真实数据版本
 *
 * 核心公式: TAM-Adj-PEG = Forward PE / (EPS CAGR x TAM Runway Factor x Quality Factor)
 */

import type { TamAdjPegValuation } from '@/types/serenity';
import type { SerenityDataInput } from './index';
import { generateTamAdjPeg } from './tamAdjPeg';

/**
 * 从真实数据提取增长分解
 */
function extractGrowthBreakdown(
  earningsSnapshot?: SerenityDataInput['earningsSnapshot'],
  basicData?: SerenityDataInput['basicData']
) {
  const epsMetric = earningsSnapshot?.metrics.find(m => m.metricKey === 'eps');
  const revenueMetric = earningsSnapshot?.metrics.find(m => m.metricKey === 'revenue');

  // 从分析师预期或历史数据估算
  let epsCagr2To3Yr = 0.25; // 25% 基准
  if (epsMetric?.yoyPct !== undefined) {
    epsCagr2To3Yr = Math.min(Math.max(epsMetric.yoyPct / 100, 0.05), 0.5); // 限制在5%-50%
  } else if (earningsSnapshot?.forwardEps && earningsSnapshot?.trailingEps) {
    // 从 trailing 和 forward 估算
    epsCagr2To3Yr = earningsSnapshot.forwardEps / earningsSnapshot.trailingEps - 1;
  }

  let revenueCagr = 0.2; // 20% 基准
  if (revenueMetric?.yoyPct !== undefined) {
    revenueCagr = Math.min(Math.max(revenueMetric.yoyPct / 100, 0.03), 0.4); // 限制在3%-40%
  }

  return {
    epsCagr2To3Yr,
    revenueCagr,
    tamCagr: 0.15, // 行业 TAM 增速（暂时固定）
    currentRevenueVsTam: 0.08, // 当前渗透率（暂时固定）
    highGrowthDurationYears: 5 // 高速增长持续期（暂时固定）
  };
}

/**
 * 计算 TAM 跑道因子
 */
function calculateTamRunwayFactor(growthBreakdown: ReturnType<typeof extractGrowthBreakdown>) {
  // 简化逻辑：增长越高，跑道越长
  let runwayFactor = 1.0;

  if (growthBreakdown.epsCagr2To3Yr > 0.3) {
    runwayFactor = 1.3;
  } else if (growthBreakdown.epsCagr2To3Yr > 0.2) {
    runwayFactor = 1.2;
  } else if (growthBreakdown.epsCagr2To3Yr > 0.1) {
    runwayFactor = 1.1;
  } else {
    runwayFactor = 0.9;
  }

  return {
    estimate: runwayFactor,
    reasoning: `预期增长 ${(growthBreakdown.epsCagr2To3Yr * 100).toFixed(0)}%，跑道因子 ${runwayFactor.toFixed(2)}x`
  };
}

/**
 * 计算质量因子
 */
function calculateQualityFactor(
  earningsSnapshot?: SerenityDataInput['earningsSnapshot'],
  basicData?: SerenityDataInput['basicData']
) {
  const positives: string[] = [];
  const negatives: string[] = [];
  let qualityFactor = 1.0;

  // 检查 PE 估值
  const forwardPE = earningsSnapshot?.forwardPE;
  const trailingPE = earningsSnapshot?.trailingPE;

  if (forwardPE !== undefined && forwardPE < 25) {
    positives.push('估值合理');
    qualityFactor += 0.1;
  } else if (forwardPE !== undefined && forwardPE > 40) {
    negatives.push('估值较高');
    qualityFactor -= 0.1;
  }

  // 添加通用质量指标
  if (positives.length === 0) {
    positives.push('行业地位领先');
    positives.push('客户粘性良好');
    positives.push('财务健康');
  }

  if (negatives.length === 0) {
    negatives.push('竞争加剧风险');
    negatives.push('技术迭代风险');
  }

  return {
    estimate: qualityFactor,
    positives,
    negatives
  };
}

/**
 * 确定估值评级
 */
function determineValuationTier(tamAdjPeg: number): TamAdjPegValuation['conclusion']['valuationTier'] {
  if (tamAdjPeg < 0.5) return 'very_cheap';
  if (tamAdjPeg < 0.8) return 'clearly_attractive';
  if (tamAdjPeg < 1.2) return 'reasonable_to_slightly_cheap';
  if (tamAdjPeg < 1.8) return 'reasonable_to_slightly_expensive';
  if (tamAdjPeg < 2.5) return 'expensive_unless_super_long_runway';
  return 'very_expensive_or_inputs_distorted';
}

/**
 * 确定合适的持仓类型
 */
function determinePositionType(
  valuationTier: TamAdjPegValuation['conclusion']['valuationTier'],
  growthBreakdown: ReturnType<typeof extractGrowthBreakdown>
): TamAdjPegValuation['conclusion']['suitablePositionType'] {
  if (valuationTier === 'very_cheap' || valuationTier === 'clearly_attractive') {
    return 'core_growth';
  }

  if (growthBreakdown.epsCagr2To3Yr > 0.3) {
    return 'high_beta_growth';
  }

  return 'high_beta_growth'; // 默认
}

/**
 * 构建上行驱动因素
 */
function buildUpsideDrivers(growthBreakdown: ReturnType<typeof extractGrowthBreakdown>) {
  const drivers: string[] = [];

  if (growthBreakdown.epsCagr2To3Yr > 0.2) {
    drivers.push('高增长预期持续');
  }

  drivers.push('市场份额提升');
  drivers.push('利润率改善');

  return drivers;
}

/**
 * 构建下行风险因素
 */
function buildDownsideRisks(
  growthBreakdown: ReturnType<typeof extractGrowthBreakdown>,
  earningsSnapshot?: SerenityDataInput['earningsSnapshot']
) {
  const risks: string[] = [];

  const forwardPE = earningsSnapshot?.forwardPE;
  if (forwardPE !== undefined && forwardPE > 40) {
    risks.push('估值回调风险');
  }

  risks.push('竞争侵蚀份额');
  risks.push('增速不及预期');

  return risks;
}

/**
 * 基于真实数据生成 TAM-Adj-PEG
 */
export function generateTamAdjPegWithData(input: SerenityDataInput): TamAdjPegValuation {
  const { ticker, companyName, earningsSnapshot } = input;

  // 如果没有足够数据，回退到 mock 版本
  if (!earningsSnapshot) {
    return generateTamAdjPeg(ticker, companyName);
  }

  // 1. 提取估值倍数
  const currentPE = earningsSnapshot.trailingPE;
  const forwardPE = earningsSnapshot.forwardPE;
  const traditionalPeg = forwardPE && earningsSnapshot.forwardEps
    ? forwardPE / ((earningsSnapshot.forwardEps / Math.max(0.01, earningsSnapshot.trailingEps || earningsSnapshot.forwardEps) - 1) * 100)
    : undefined;

  // 2. 从真实数据提取增长分解
  const growthBreakdown = extractGrowthBreakdown(earningsSnapshot, input.basicData);

  // 3. 计算 TAM 跑道因子
  const tamRunwayFactor = calculateTamRunwayFactor(growthBreakdown);

  // 4. 计算质量因子
  const qualityFactor = calculateQualityFactor(earningsSnapshot, input.basicData);

  // 5. 计算调整后的 PEG
  const adjustedGrowth = growthBreakdown.epsCagr2To3Yr * tamRunwayFactor.estimate * qualityFactor.estimate;
  const tamAdjPeg = forwardPE ? forwardPE / (adjustedGrowth * 100) : 1.5;

  // 6. 确定估值评级
  const valuationTier = determineValuationTier(tamAdjPeg);

  // 7. 构建上行和下行因素
  const upsideDrivers = buildUpsideDrivers(growthBreakdown);
  const downsideRisks = buildDownsideRisks(growthBreakdown, earningsSnapshot);

  // 8. 确定合适的持仓类型
  const suitablePositionType = determinePositionType(valuationTier, growthBreakdown);

  return {
    version: '1.0',
    type: 'tam-adj-peg',

    companyName,
    ticker,

    currentValuation: {
      currentPE,
      forwardPE,
      traditionalPeg
    },

    growthBreakdown,

    tamRunwayFactor,
    qualityFactor,

    calculation: {
      adjustedGrowth,
      tamAdjPeg
    },

    conclusion: {
      valuationTier,
      upsideDrivers,
      downsideRisks,
      suitablePositionType
    }
  };
}
