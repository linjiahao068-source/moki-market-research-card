/**
 * Enhanced Earnings Provider
 * 增强版财报数据提供者 - 整合多源数据，提供更完整的财报快照
 */

import type { EarningsSnapshotData, EarningsMetricComparison } from '@/types/earnings';
import type { BasicCompanyData } from '@/types/basic-data';
import type { SecurityRecord } from '@/types/security';
import { getGlobalEarningsSnapshotData } from './globalEarningsProvider';

// 扩展财报快照类型
export interface EnhancedEarningsSnapshot extends EarningsSnapshotData {
  // 历史季度数据
  historicalQuarters?: Array<{
    periodEnd?: string;
    fiscalYear?: string;
    fiscalQuarter?: string;
    revenue?: number;
    netIncome?: number;
    dilutedEps?: number;
    source?: string;
  }>;

  // 数据质量评分 (0-10)
  dataQualityScore?: number;

  // 各指标置信度
  metricConfidence?: Record<string, number>;
}

// 增长计算结果
interface GrowthRates {
  qoq?: number; // 环比增长
  yoy?: number; // 同比增长
}

/**
 * 获取增强版财报快照
 */
export async function getEnhancedEarningsSnapshot({
  query,
  security,
  basicData
}: {
  query: string;
  security?: SecurityRecord;
  basicData?: BasicCompanyData;
}): Promise<EnhancedEarningsSnapshot> {
  // 1. 获取基础财报快照
  const baseSnapshot = await getGlobalEarningsSnapshotData({ query, security, basicData });

  // 2. 获取历史季度数据
  const historicalQuarters = await fetchHistoricalQuarters(security, basicData) || [];

  // 3. 增强指标：添加增长率
  const enhancedMetrics = enhanceMetricsWithGrowthRates(baseSnapshot.metrics, historicalQuarters);

  // 4. 计算数据质量评分
  const dataQualityScore = calculateDataQualityScore(baseSnapshot, historicalQuarters);

  // 5. 计算指标置信度
  const metricConfidence = calculateMetricConfidence(enhancedMetrics);

  const result: EnhancedEarningsSnapshot = {
    ...baseSnapshot,
    metrics: enhancedMetrics,
    dataQualityScore,
    metricConfidence,
    warnings: [
      ...(baseSnapshot.warnings || []),
      ...(historicalQuarters.length === 0 ? ['暂无历史季度数据'] : [])
    ]
  };

  // 有历史数据时才添加
  if (historicalQuarters.length > 0) {
    result.historicalQuarters = historicalQuarters;
  }

  return result;
}

/**
 * 从多个来源获取历史季度数据
 */
async function fetchHistoricalQuarters(
  _security?: SecurityRecord,
  _basicData?: BasicCompanyData
): Promise<EnhancedEarningsSnapshot['historicalQuarters']> {
  const quarters: EnhancedEarningsSnapshot['historicalQuarters'] = [];

  // TODO: 后续可以从以下来源获取历史数据：
  // 1. 东方财富历史财务数据
  // 2. Yahoo Finance 历史财务
  // 3. SEC filings 历史提取

  // 暂时返回空（后续实现）
  // 占位示例：
  // if (security?.symbol === 'ORCL') {
  //   quarters.push(
  //     { periodEnd: '2026-02-28', fiscalYear: '2026', fiscalQuarter: 'Q3', revenue: 13300000000, netIncome: 3200000000, dilutedEps: 1.16, source: 'SEC EDGAR' },
  //     { periodEnd: '2025-11-30', fiscalYear: '2025', fiscalQuarter: 'Q2', revenue: 12900000000, netIncome: 2800000000, dilutedEps: 1.02, source: 'SEC EDGAR' }
  //   );
  // }

  return quarters;
}

/**
 * 增强指标：添加增长率计算
 */
function enhanceMetricsWithGrowthRates(
  metrics: EarningsMetricComparison[],
  _historicalQuarters: EnhancedEarningsSnapshot['historicalQuarters']
): (EarningsMetricComparison & { qoqGrowthPercent?: number; yoyGrowthPercent?: number })[] {
  return metrics.map(metric => {
    const growthRates = calculateGrowthRates(metric, _historicalQuarters);

    return {
      ...metric,
      qoqGrowthPercent: growthRates.qoq,
      yoyGrowthPercent: growthRates.yoy
    };
  });
}

/**
 * 计算同比环比增长率
 */
function calculateGrowthRates(
  metric: EarningsMetricComparison,
  _historicalQuarters: EnhancedEarningsSnapshot['historicalQuarters']
): GrowthRates {
  const result: GrowthRates = {};

  // 如果有同比数据，直接使用
  if (metric.yoyPct !== undefined) {
    result.yoy = metric.yoyPct;
  }

  // 后续可以从历史季度计算环比和同比
  // if (historicalQuarters && historicalQuarters.length >= 2) {
  //   // 计算逻辑...
  // }

  return result;
}

/**
 * 计算数据质量评分 (0-10)
 */
function calculateDataQualityScore(
  snapshot: EarningsSnapshotData,
  historicalQuarters: EnhancedEarningsSnapshot['historicalQuarters'] = []
): number {
  let score = 0;

  // 1. 基础数据完整性 (最多 3 分)
  const hasRevenue = snapshot.metrics.some(m => m.metricKey === 'revenue' && m.actual !== undefined);
  const hasEps = snapshot.metrics.some(m => m.metricKey === 'eps' && m.actual !== undefined);
  const hasNetIncome = snapshot.metrics.some(m => m.metricKey === 'netIncome' && m.actual !== undefined);

  score += (hasRevenue ? 1 : 0) + (hasEps ? 1 : 0) + (hasNetIncome ? 1 : 0);

  // 2. 历史数据完整性 (最多 3 分)
  const historyScore = Math.min(historicalQuarters.length, 4) * 0.75;
  score += historyScore;

  // 3. 估值数据可用性 (最多 2 分)
  const hasCurrentPrice = snapshot.currentPrice !== undefined;
  const hasPe = snapshot.forwardPE !== undefined || snapshot.trailingPE !== undefined;
  score += (hasCurrentPrice ? 1 : 0) + (hasPe ? 1 : 0);

  // 4. 指引数据可用性 (最多 2 分)
  const hasGuidance = snapshot.guidance && snapshot.guidance.length > 0;
  const hasGuidanceEvidence = snapshot.guidanceEvidence && snapshot.guidanceEvidence.length > 0;
  score += hasGuidance ? 1 : 0;
  score += hasGuidanceEvidence ? 1 : 0;

  // 确保在 0-10 范围内
  return Math.max(0, Math.min(10, score));
}

/**
 * 计算各指标的置信度
 */
function calculateMetricConfidence(
  metrics: EarningsMetricComparison[]
): Record<string, number> {
  const confidence: Record<string, number> = {};

  metrics.forEach(metric => {
    let score = 0;

    // 有实际值
    if (metric.actual !== undefined) score += 0.5;
    // 有预期值
    if (metric.estimate !== undefined) score += 0.3;
    // 有来源
    if (metric.actualSource) score += 0.2;
    // 质量较好
    if (metric.quality === 'verified') score += 0.3;
    else if (metric.quality === 'estimated') score += 0.15;

    confidence[metric.metricKey] = Math.min(1, score);
  });

  return confidence;
}

/**
 * 获取主要数据来源标签
 */
export function getPrimaryDataSource(snapshot: EarningsSnapshotData): string {
  if (snapshot.provider === 'sec-edgar') return 'SEC EDGAR';
  if (snapshot.provider === 'yahoo') return 'Yahoo Finance';
  if (snapshot.provider === 'fmp') return 'FMP';
  if (snapshot.provider === 'mock') return 'Mock 数据';
  return snapshot.provider || '多源整合';
}
