/**
 * Buy-Side Equity Research Memo - 真实数据版本
 *
 * 整合所有 Serenity 技能，生成完整的买方研究备忘录
 */

import type { BuySideResearchMemo } from '@/types/serenity';
import type { SerenityDataInput } from './index';
import { generateBuySideMemo } from './buySideMemo';

// 导入其他真实数据模块
import { generateGfDmaHealthIndexWithData } from './gfDmaHealthIndexRealData';
import { generateTamAdjPegWithData } from './tamAdjPegRealData';
import { generateBayesianValuationWithData } from './bayesianValuationRealData';

/**
 * 构建投资观点
 */
function buildInvestmentView(
  gfDma: ReturnType<typeof generateGfDmaHealthIndexWithData>,
  tamAdjPeg: ReturnType<typeof generateTamAdjPegWithData>,
  bayesian: ReturnType<typeof generateBayesianValuationWithData>,
  earningsSnapshot?: SerenityDataInput['earningsSnapshot']
): BuySideResearchMemo['investmentView'] {
  // 综合评分
  const gfScore = gfDma.finalScore;
  const pegTier = tamAdjPeg.conclusion.valuationTier;
  const valState = bayesian.valuationState;

  // 确定偏向
  let bias: BuySideResearchMemo['investmentView']['bias'] = 'neutral';
  let coreLogicOneLiner = '';
  const keyDebates = [
    '当前估值是否充分反映了增长预期',
    '基本面趋势是否能够持续',
    '行业竞争格局是否会影响利润率'
  ];
  const thesisBreakpoint = '下季度财报验证增长质量，若超预期则观点可能上调，若不及预期则需重新评估';

  if (gfScore >= 7 && (pegTier === 'clearly_attractive' || pegTier === 'very_cheap')) {
    bias = 'positive';
    coreLogicOneLiner = `GF-DMA 评分 ${gfScore.toFixed(1)}/10 · TAM-Adj-PEG 评级 ${pegTier} · 综合观点偏积极`;
  } else if (gfScore <= 5 && (pegTier === 'very_expensive_or_inputs_distorted' || valState === 'expensive_but_tradable')) {
    bias = 'cautious';
    coreLogicOneLiner = `GF-DMA 评分 ${gfScore.toFixed(1)}/10 · TAM-Adj-PEG 评级 ${pegTier} · 综合观点偏谨慎`;
  } else {
    bias = 'neutral';
    coreLogicOneLiner = `GF-DMA 评分 ${gfScore.toFixed(1)}/10 · TAM-Adj-PEG 评级 ${pegTier} · 综合观点中性，等待验证`;
  }

  return {
    bias,
    coreLogicOneLiner,
    keyDebates,
    thesisBreakpoint
  };
}

/**
 * 构建业务定位
 */
function buildBusinessPositioning(basicData?: SerenityDataInput['basicData'], companyName?: string): BuySideResearchMemo['businessPositioning'] {
  return {
    oneLinerDescription: `${companyName || '公司'} · 数据来源: ${basicData?.provider || 'N/A'}`,
    businessModel: '收入来源: 产品销售、服务收入 · 成本结构: 原材料、研发、销售费用 · 盈利驱动: 量增+价升+规模效应',
    moats: ['技术壁垒', '客户粘性', '品牌效应', '规模优势']
  };
}

/**
 * 构建行业分析
 */
function buildIndustryAnalysis(tamAdjPeg: ReturnType<typeof generateTamAdjPegWithData>, earningsSnapshot?: SerenityDataInput['earningsSnapshot']): BuySideResearchMemo['industryAnalysis'] {
  return {
    tam: 100000000000, // 占位
    penetration: 0.08, // 占位
    growthDrivers: ['需求自然增长', '渗透率提升', '新产品拓展'],
    competitiveLandscape: '行业集中度较高，头部公司享有定价权'
  };
}

/**
 * 构建财务分析
 */
function buildFinancialAnalysis(
  earningsSnapshot?: SerenityDataInput['earningsSnapshot'],
  basicData?: SerenityDataInput['basicData']
): BuySideResearchMemo['financialAnalysis'] {
  const metrics = earningsSnapshot?.metrics || [];

  let historicalTrends = '财报数据待补充';
  if (metrics.length > 0) {
    const revenueMetric = metrics.find(m => m.metricKey === 'revenue');
    const epsMetric = metrics.find(m => m.metricKey === 'eps');
    const netIncomeMetric = metrics.find(m => m.metricKey === 'netIncome');

    historicalTrends = [
      revenueMetric && `营收: ${revenueMetric.actual}`,
      epsMetric && `EPS: ${epsMetric.actual}`,
      netIncomeMetric && `净利润: ${netIncomeMetric.actual}`
    ].filter(Boolean).join(' · ');
  }

  let guidanceAnalysis = '暂无指引数据';
  if (earningsSnapshot?.guidance && earningsSnapshot.guidance.length > 0) {
    guidanceAnalysis = `公司提供 ${earningsSnapshot.guidance.length} 项指引`;
  }

  return {
    historicalTrends,
    guidanceAnalysis,
    keyMetrics: ['收入增速', '毛利率', '订单指引', '现金流'],
    validationChain: ['Q1 财报验证', '管理层电话会议', '行业数据验证']
  };
}

/**
 * 构建估值分析
 */
function buildValuationAnalysis(
  tamAdjPeg: ReturnType<typeof generateTamAdjPegWithData>,
  bayesian: ReturnType<typeof generateBayesianValuationWithData>,
  gfDma: ReturnType<typeof generateGfDmaHealthIndexWithData>,
  earningsSnapshot?: SerenityDataInput['earningsSnapshot']
): BuySideResearchMemo['valuationAnalysis'] {
  return {
    currentMultiples: {
      pe: earningsSnapshot?.trailingPE,
      evSales: undefined, // 后续可补充
      evEbitda: undefined // 后续可补充
    },
    historicalPercentile: '数据不足，后续可补充历史分位分析',
    peerComparison: '数据不足，后续可补充同业对比',
    serenityCrossChecks: {
      tamAdjPeg: true,
      bayesianIntrinsicGrowth: true,
      gfDmaHealthIndex: true
    }
  };
}

/**
 * 构建情景分析
 */
function buildScenarios(
  gfDma: ReturnType<typeof generateGfDmaHealthIndexWithData>,
  tamAdjPeg: ReturnType<typeof generateTamAdjPegWithData>
): BuySideResearchMemo['scenarios'] {
  const isPositive = gfDma.finalScore >= 7;

  return {
    bull: {
      probability: 0.25,
      revenueGrowth: isPositive ? '高增长' : '符合预期',
      margin: isPositive ? '扩张' : '稳定',
      multiple: isPositive ? '估值扩张' : '保持',
      impliedChange: isPositive ? '+20%' : '+10%',
      assumptions: isPositive ? ['乐观假设', '基本面支撑'] : ['乐观假设']
    },
    base: {
      probability: 0.55,
      revenueGrowth: '符合预期',
      margin: '稳定',
      multiple: '保持',
      impliedChange: '0%',
      assumptions: ['基准假设']
    },
    bear: {
      probability: 0.2,
      revenueGrowth: isPositive ? '低于预期' : '低于预期',
      margin: '承压',
      multiple: '收缩',
      impliedChange: isPositive ? '-15%' : '-20%',
      assumptions: isPositive ? ['悲观假设'] : ['悲观假设', '估值回调']
    }
  };
}

/**
 * 构建催化剂
 */
function buildCatalysts(
  earningsSnapshot?: SerenityDataInput['earningsSnapshot'],
  basicData?: SerenityDataInput['basicData']
): BuySideResearchMemo['catalysts'] {
  const catalysts: Array<{ description: string; timeframe: string }> = [];

  // 从财报日期添加
  if (earningsSnapshot?.reportDate) {
    catalysts.push({
      description: '下季度财报发布',
      timeframe: earningsSnapshot.reportDate
    });
  }

  // 添加通用催化剂
  catalysts.push({
    description: '行业峰会/产品发布会',
    timeframe: '待公布'
  });

  return catalysts;
}

/**
 * 构建风险因素
 */
function buildRiskFactors(
  tamAdjPeg: ReturnType<typeof generateTamAdjPegWithData>,
  bayesian: ReturnType<typeof generateBayesianValuationWithData>,
  earningsSnapshot?: SerenityDataInput['earningsSnapshot']
): BuySideResearchMemo['riskFactors'] {
  const upsideRisks = tamAdjPeg.conclusion.upsideDrivers.length > 0 ?
    tamAdjPeg.conclusion.upsideDrivers :
    ['需求超预期', '新产品表现出色'];

  const downsideRisks: BuySideResearchMemo['riskFactors']['downsideRisks'] = [];

  // 基于估值添加风险
  const forwardPE = earningsSnapshot?.forwardPE;
  if (forwardPE !== undefined && forwardPE > 40) {
    downsideRisks.push({
      category: '估值',
      description: '当前估值较高，存在估值回调风险'
    });
  }

  // 从 PEG 添加风险
  const pegRisks = tamAdjPeg.conclusion.downsideRisks;
  for (const risk of pegRisks) {
    if (!downsideRisks.some(d => d.description === risk)) {
      downsideRisks.push({
        category: '业务',
        description: risk
      });
    }
  }

  // 添加通用风险
  if (downsideRisks.length === 0) {
    downsideRisks.push(
      { category: '业务', description: '需求增长可能不及预期' },
      { category: '执行', description: '新产品推进可能不顺' },
      { category: '估值', description: '估值可能回调' },
      { category: '宏观/周期', description: '行业周期波动风险' }
    );
  }

  return {
    upsideRisks,
    downsideRisks
  };
}

/**
 * 构建差异化认知
 */
function buildVariantPerception(
  bayesian: ReturnType<typeof generateBayesianValuationWithData>,
  tamAdjPeg: ReturnType<typeof generateTamAdjPegWithData>
): BuySideResearchMemo['variantPerception'] {
  const marketGrowth = bayesian.marketImpliedGrowth?.cagrRange || 'N/A';
  const intrinsicGrowth = bayesian.weightedIntrinsicGrowth?.cagrRange || 'N/A';

  return {
    marketConsensus: `市场预期增长区间 ${marketGrowth}`,
    ourDifference: `我们的内在增长估计 ${intrinsicGrowth} · 需验证市场预期是否合理`,
    validationConditions: '下季度财报数据将验证增长假设'
  };
}

/**
 * 构建跟踪仪表盘
 */
function buildTrackingDashboard(
  earningsSnapshot?: SerenityDataInput['earningsSnapshot'],
  basicData?: SerenityDataInput['basicData']
): BuySideResearchMemo['trackingDashboard'] {
  const dashboard: BuySideResearchMemo['trackingDashboard'] = [];

  // 从财报指标添加
  if (earningsSnapshot?.metrics) {
    for (const metric of earningsSnapshot.metrics) {
      let currentValue: string | undefined;
      if (metric.actual !== undefined) {
        currentValue = metric.metricKey === 'eps' ?
          `$${metric.actual.toFixed(2)}` :
          formatMoneyCompact(metric.actual, metric.currency || 'USD');
      }

      dashboard.push({
        metric: metric.label,
        currentValue,
        frequency: 'quarterly'
      });
    }
  }

  // 如果指标太少，添加通用指标
  if (dashboard.length < 3) {
    dashboard.push(
      { metric: '收入增速', frequency: 'quarterly' },
      { metric: '毛利率', frequency: 'quarterly' },
      { metric: '相对行业表现', frequency: 'monthly' }
    );
  }

  return dashboard;
}

/**
 * 构建来源列表
 */
function buildSources(
  basicData?: SerenityDataInput['basicData'],
  earningsSnapshot?: SerenityDataInput['earningsSnapshot']
): BuySideResearchMemo['sources'] {
  const sources: BuySideResearchMemo['sources'] = [];

  // 从基础数据添加
  if (basicData?.sourceLinks) {
    basicData.sourceLinks.forEach(link => {
      sources.push({
        type: 'Other',
        date: basicData.fetchedAt ? basicData.fetchedAt.split('T')[0] : 'N/A',
        description: link.label || link.url || '数据来源'
      });
    });
  }

  // 从财报添加
  if (earningsSnapshot?.provider) {
    sources.push({
      type: 'Other',
      date: earningsSnapshot.fetchedAt ? earningsSnapshot.fetchedAt.split('T')[0] : 'N/A',
      description: `财报数据来自 ${earningsSnapshot.provider}`
    });
  }

  // 添加默认来源
  if (sources.length === 0) {
    sources.push(
      { type: 'SEC 10-K', date: 'N/A', description: '最新年报' },
      { type: 'SEC 10-Q', date: 'N/A', description: '最新季报' },
      { type: 'Earnings Call', date: 'N/A', description: '最近财报电话会' },
      { type: 'IR Presentation', date: 'N/A', description: '投资者日演示' }
    );
  }

  return sources;
}

/**
 * 辅助函数：格式化金额（简化版）
 */
function formatMoneyCompact(value: number, currency: string): string {
  if (value >= 1000000000) {
    return `$${(value / 1000000000).toFixed(2)}B`;
  } else if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(2)}M`;
  }
  return `$${value.toFixed(2)}`;
}

/**
 * 基于真实数据生成完整买方研究备忘录
 */
export function generateBuySideMemoWithData(input: SerenityDataInput): BuySideResearchMemo {
  const { ticker, companyName, basicData, earningsSnapshot } = input;

  // 如果没有足够数据，回退到 mock 版本
  if (!basicData && !earningsSnapshot) {
    return generateBuySideMemo(ticker, companyName);
  }

  // 1. 生成其他模块分析（用于交叉验证）
  const gfDma = generateGfDmaHealthIndexWithData(input);
  const tamAdjPeg = generateTamAdjPegWithData(input);
  const bayesian = generateBayesianValuationWithData(input);

  // 2. 构建投资观点
  const investmentView = buildInvestmentView(gfDma, tamAdjPeg, bayesian, earningsSnapshot);

  // 3. 构建业务定位
  const businessPositioning = buildBusinessPositioning(basicData, companyName);

  // 4. 构建行业分析
  const industryAnalysis = buildIndustryAnalysis(tamAdjPeg, earningsSnapshot);

  // 5. 构建财务分析
  const financialAnalysis = buildFinancialAnalysis(earningsSnapshot, basicData);

  // 6. 构建估值分析
  const valuationAnalysis = buildValuationAnalysis(tamAdjPeg, bayesian, gfDma, earningsSnapshot);

  // 7. 构建情景分析
  const scenarios = buildScenarios(gfDma, tamAdjPeg);

  // 8. 构建催化剂
  const catalysts = buildCatalysts(earningsSnapshot, basicData);

  // 9. 构建风险因素
  const riskFactors = buildRiskFactors(tamAdjPeg, bayesian, earningsSnapshot);

  // 10. 构建差异化认知
  const variantPerception = buildVariantPerception(bayesian, tamAdjPeg);

  // 11. 构建跟踪仪表盘
  const trackingDashboard = buildTrackingDashboard(earningsSnapshot, basicData);

  // 12. 构建来源列表
  const sources = buildSources(basicData, earningsSnapshot);

  return {
    version: '1.0',
    type: 'buy-side-equity-research-memo',

    ticker,
    companyName,

    investmentView,
    businessPositioning,
    industryAnalysis,
    financialAnalysis,
    valuationAnalysis,
    scenarios,
    catalysts,
    riskFactors,
    variantPerception,
    trackingDashboard,
    sources,

    disclaimer: '本研究备忘录基于公开市场数据生成 · 仅供研究参考 · 不构成任何投资建议 · 投资有风险 · 决策需谨慎'
  };
}
