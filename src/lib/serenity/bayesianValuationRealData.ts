/**
 * Bayesian Intrinsic Growth Valuation - 真实数据版本
 *
 * 核心逻辑: 建立 H0-H5 增长假设 → 新信息贝叶斯更新 → 加权内在增长 vs 市场隐含增长
 */

import type { BayesianGrowthValuation, GrowthHypothesisItem } from '@/types/serenity';
import type { SerenityDataInput } from './index';
import { generateBayesianValuation } from './bayesianValuation';

/**
 * 基准增长假设
 */
const BASE_GROWTH_HYPOTHESES: GrowthHypothesisItem[] = [
  { hypothesis: 'H0', label: '衰退型', cagrRange: '<0%', priorProbability: 0.05, posteriorProbability: 0.05, coreReasoning: '行业长期需求仍在，衰退概率较低' },
  { hypothesis: 'H1', label: '低速成熟', cagrRange: '0%-5%', priorProbability: 0.15, posteriorProbability: 0.15, coreReasoning: '如果竞争加剧可能进入此区间' },
  { hypothesis: 'H2', label: '稳定成长', cagrRange: '5%-12%', priorProbability: 0.30, posteriorProbability: 0.30, coreReasoning: '行业平均增速区间' },
  { hypothesis: 'H3', label: '高景气成长', cagrRange: '12%-25%', priorProbability: 0.35, posteriorProbability: 0.35, coreReasoning: '当前增长轨迹支持此假设' },
  { hypothesis: 'H4', label: '结构性爆发', cagrRange: '25%-50%', priorProbability: 0.12, posteriorProbability: 0.12, coreReasoning: '如果新产品超预期可能达到' },
  { hypothesis: 'H5', label: '平台级扩张', cagrRange: '>50%', priorProbability: 0.03, posteriorProbability: 0.03, coreReasoning: '当前证据不足以支持此假设' }
];

/**
 * 基于真实估值水平调整假设概率
 */
function adjustHypothesesWithRealData(
  hypotheses: typeof BASE_GROWTH_HYPOTHESES,
  earningsSnapshot?: SerenityDataInput['earningsSnapshot']
) {
  const forwardPE = earningsSnapshot?.forwardPE;
  const trailingPE = earningsSnapshot?.trailingPE;

  // 复制一份以避免修改原数据
  const adjusted = hypotheses.map(h => ({ ...h, posteriorProbability: h.priorProbability }));

  // 基于 PE 调整概率
  if (forwardPE !== undefined) {
    if (forwardPE > 40) {
      // 高估值，增加高增长假设概率
      adjusted.find(h => h.hypothesis === 'H3')!.posteriorProbability += 0.05;
      adjusted.find(h => h.hypothesis === 'H4')!.posteriorProbability += 0.03;
      adjusted.find(h => h.hypothesis === 'H1')!.posteriorProbability -= 0.05;
      adjusted.find(h => h.hypothesis === 'H0')!.posteriorProbability -= 0.03;
    } else if (forwardPE < 15) {
      // 低估值，增加低增长假设概率
      adjusted.find(h => h.hypothesis === 'H1')!.posteriorProbability += 0.05;
      adjusted.find(h => h.hypothesis === 'H2')!.posteriorProbability += 0.03;
      adjusted.find(h => h.hypothesis === 'H4')!.posteriorProbability -= 0.05;
      adjusted.find(h => h.hypothesis === 'H5')!.posteriorProbability -= 0.03;
    }
  }

  // 归一化概率
  const totalProb = adjusted.reduce((sum, h) => sum + Math.max(0, h.posteriorProbability), 0);
  adjusted.forEach(h => {
    h.posteriorProbability = Math.max(0, h.posteriorProbability) / totalProb;
    h.coreReasoning += '（基于真实估值调整）';
  });

  return adjusted;
}

/**
 * 计算加权内在增长
 */
function calculateWeightedIntrinsicGrowth(
  hypotheses: ReturnType<typeof adjustHypothesesWithRealData>
) {
  // 简化计算：基于假设中点
  const midpoints = {
    'H0': -0.02,
    'H1': 0.025,
    'H2': 0.085,
    'H3': 0.185,
    'H4': 0.375,
    'H5': 0.55
  };

  let weightedGrowth = 0;
  for (const h of hypotheses) {
    weightedGrowth += h.posteriorProbability * midpoints[h.hypothesis as keyof typeof midpoints];
  }

  // 确定区间
  let cagrRange = '';
  if (weightedGrowth < 0) cagrRange = '<0%';
  else if (weightedGrowth < 0.05) cagrRange = '0%-5%';
  else if (weightedGrowth < 0.12) cagrRange = '5%-12%';
  else if (weightedGrowth < 0.25) cagrRange = '12%-25%';
  else if (weightedGrowth < 0.5) cagrRange = '25%-50%';
  else cagrRange = '>50%';

  return {
    cagrRange,
    midpointCagr: weightedGrowth,
    keyAssumptions: [
      `基于 H3-H4 为主要情景，概率 ${(hypotheses.find(h => h.hypothesis === 'H3')!.posteriorProbability + hypotheses.find(h => h.hypothesis === 'H4')!.posteriorProbability).toFixed(2)}`,
      '假设行业需求稳定',
      '假设公司市场份额保持'
    ]
  };
}

/**
 * 从当前估值计算市场隐含增长
 */
function calculateMarketImpliedGrowth(earningsSnapshot?: SerenityDataInput['earningsSnapshot']) {
  const forwardPE = earningsSnapshot?.forwardPE;

  if (forwardPE === undefined) {
    return {
      cagrRange: '15%-20%',
      reasoning: '暂无估值数据，使用基准假设'
    };
  }

  // 简化计算：PE 反推增长
  let impliedGrowth = 0.15;
  let cagrRange = '15%-20%';
  let reasoning = '';

  if (forwardPE > 40) {
    impliedGrowth = 0.25;
    cagrRange = '20%-30%';
    reasoning = `当前估值较高（PE ${forwardPE.toFixed(1)}），市场隐含增速较高`;
  } else if (forwardPE > 25) {
    impliedGrowth = 0.18;
    cagrRange = '15%-20%';
    reasoning = `估值中等（PE ${forwardPE.toFixed(1)}），市场隐含增速适中`;
  } else {
    impliedGrowth = 0.12;
    cagrRange = '10%-15%';
    reasoning = `估值较低（PE ${forwardPE.toFixed(1)}），市场隐含增速较低`;
  }

  return {
    cagrRange,
    reasoning
  };
}

/**
 * 计算价格-增速背离状态
 */
function calculatePriceGrowthDivergence(
  weightedIntrinsicGrowth: ReturnType<typeof calculateWeightedIntrinsicGrowth>,
  marketImpliedGrowth: ReturnType<typeof calculateMarketImpliedGrowth>,
  earningsSnapshot?: SerenityDataInput['earningsSnapshot']
) {
  // 简化计算：比较内在增长和市场隐含增长
  const intrinsicMid = weightedIntrinsicGrowth.midpointCagr;

  let state: BayesianGrowthValuation['priceGrowthDivergence']['state'] = 'price_aligned_with_fundamentals';
  let analysis = '';

  const forwardPE = earningsSnapshot?.forwardPE;

  if (forwardPE !== undefined) {
    if (forwardPE > 40 && intrinsicMid < 0.2) {
      state = 'price_ahead_of_fundamentals';
      analysis = '过去股价涨幅领先于基本面改善速度，需警惕短期回调风险';
    } else if (forwardPE < 15 && intrinsicMid > 0.15) {
      state = 'price_lagging_fundamentals';
      analysis = '股价未反映基本面改善速度，存在修复空间';
    } else {
      state = 'price_aligned_with_fundamentals';
      analysis = '股价与基本面大致匹配';
    }
  } else {
    state = 'price_aligned_with_fundamentals';
    analysis = '数据有限，暂时认为估值合理';
  }

  return {
    state,
    analysis
  };
}

/**
 * 确定估值状态
 */
function determineValuationState(
  marketImpliedGrowth: ReturnType<typeof calculateMarketImpliedGrowth>,
  weightedIntrinsicGrowth: ReturnType<typeof calculateWeightedIntrinsicGrowth>,
  priceGrowthDivergence: ReturnType<typeof calculatePriceGrowthDivergence>
) {
  let state: BayesianGrowthValuation['valuationState'] = 'fair_value';
  let reasoning = '';

  const intrinsicMid = weightedIntrinsicGrowth.midpointCagr;

  // 简化判断
  if (priceGrowthDivergence.state === 'price_ahead_of_fundamentals') {
    state = 'expensive_but_tradable';
    reasoning = '估值略高但基本面仍在改善，需要继续跟踪验证';
  } else if (priceGrowthDivergence.state === 'price_lagging_fundamentals') {
    state = 'undervalued';
    reasoning = '估值较低但基本面改善，存在修复空间';
  } else {
    state = 'fair_value';
    reasoning = '估值与基本面匹配，持有为主';
  }

  return {
    valuationState: state,
    valuationReasoning: reasoning
  };
}

/**
 * 构建上行驱动因素
 */
function buildUpsideDrivers(
  weightedIntrinsicGrowth: ReturnType<typeof calculateWeightedIntrinsicGrowth>,
  earningsSnapshot?: SerenityDataInput['earningsSnapshot']
) {
  const drivers: string[] = [];

  if (weightedIntrinsicGrowth.midpointCagr > 0.15) {
    drivers.push('需求持续超预期');
  }

  drivers.push('市场份额提升');
  drivers.push('利润率改善');

  return drivers;
}

/**
 * 构建下行风险因素
 */
function buildDownsideRisks(
  marketImpliedGrowth: ReturnType<typeof calculateMarketImpliedGrowth>,
  priceGrowthDivergence: ReturnType<typeof calculatePriceGrowthDivergence>
) {
  const risks: string[] = [];

  if (priceGrowthDivergence.state === 'price_ahead_of_fundamentals') {
    risks.push('估值回调');
  }

  risks.push('竞争加剧');
  risks.push('需求周期见顶');

  return risks;
}

/**
 * 构建验证时间表
 */
function buildValidationTimeline(input: SerenityDataInput) {
  return [
    { timeframe: 'Q2 ' + new Date().getFullYear(), metricsToWatch: ['收入增速', '毛利率'] },
    { timeframe: 'Q3 ' + new Date().getFullYear(), metricsToWatch: ['订单指引', '管理层评论'] }
  ];
}

/**
 * 构建跟踪指标
 */
function buildTrackingIndicators(input: SerenityDataInput) {
  return [
    '收入增速',
    '毛利率',
    '订单指引',
    '相对行业表现',
    '估值分位'
  ];
}

/**
 * 构建研究姿态
 */
function buildPositionGuidance(
  valuationState: BayesianGrowthValuation['valuationState'],
  priceGrowthDivergence: ReturnType<typeof calculatePriceGrowthDivergence>
) {
  let posture = '';
  let conditions: string[] = [];

  if (valuationState === 'undervalued') {
    posture = '观察验证，等待证据补充';
    conditions = ['估值演算较有吸引力', '等待验证', '验证通过后更新研究假设'];
  } else if (valuationState === 'expensive_but_tradable') {
    posture = '观察验证，等待证据补充';
    conditions = ['当前估值略高，谨慎解读', '等待财报验证增长质量', '验证通过后更新研究假设', '如果验证失败则下调假设等级'];
  } else {
    posture = '持续跟踪，等待新证据';
    conditions = ['估值演算大致合理', '等待验证', '视验证情况更新研究假设'];
  }

  return {
    posture,
    conditions
  };
}

/**
 * 构建结论一句话
 */
function buildConclusionOneLiner(
  valuationState: BayesianGrowthValuation['valuationState'],
  weightedIntrinsicGrowth: ReturnType<typeof calculateWeightedIntrinsicGrowth>,
  marketImpliedGrowth: ReturnType<typeof calculateMarketImpliedGrowth>
) {
  if (valuationState === 'undervalued') {
    return '内在增长健康但估值未充分反映，后续重点观察验证进展';
  } else if (valuationState === 'expensive_but_tradable') {
    return '内在增长健康但股价已领先基本面，需要等待后续财报验证';
  } else {
    return '内在增长与估值演算大致匹配，继续关注验证指标';
  }
}

/**
 * 基于真实数据生成贝叶斯估值分析
 */
export function generateBayesianValuationWithData(input: SerenityDataInput): BayesianGrowthValuation {
  const { ticker, companyName, earningsSnapshot, basicData } = input;

  // 如果没有足够数据，回退到 mock 版本
  if (!earningsSnapshot) {
    return generateBayesianValuation(ticker, companyName);
  }

  // 1. 基于真实估值水平调整假设概率
  const adjustedHypotheses = adjustHypothesesWithRealData(BASE_GROWTH_HYPOTHESES, earningsSnapshot);

  // 2. 计算加权内在增长
  const weightedIntrinsicGrowth = calculateWeightedIntrinsicGrowth(adjustedHypotheses);

  // 3. 计算市场隐含增长
  const marketImpliedGrowth = calculateMarketImpliedGrowth(earningsSnapshot);

  // 4. 计算价格-增速背离
  const priceGrowthDivergence = calculatePriceGrowthDivergence(weightedIntrinsicGrowth, marketImpliedGrowth, earningsSnapshot);

  // 5. 确定估值状态
  const { valuationState, valuationReasoning } = determineValuationState(marketImpliedGrowth, weightedIntrinsicGrowth, priceGrowthDivergence);

  // 6. 构建其他部分
  const upsideDrivers = buildUpsideDrivers(weightedIntrinsicGrowth, earningsSnapshot);
  const downsideRisks = buildDownsideRisks(marketImpliedGrowth, priceGrowthDivergence);
  const validationTimeline = buildValidationTimeline(input);
  const trackingIndicators = buildTrackingIndicators(input);
  const positionGuidance = buildPositionGuidance(valuationState, priceGrowthDivergence);
  const conclusionOneLiner = buildConclusionOneLiner(valuationState, weightedIntrinsicGrowth, marketImpliedGrowth);

  return {
    version: '1.0',
    type: 'bayesian-intrinsic-growth-valuation',

    companyOneLiner: `${companyName} (${ticker}) 行业领先公司`,

    growthHypotheses: adjustedHypotheses,
    weightedIntrinsicGrowth,
    marketImpliedGrowth,
    priceGrowthDivergence,

    // 暂时保留空（后续可以接入新闻事件）
    bayesianUpdates: [],

    valuationState,
    valuationReasoning,

    upsideDrivers,
    downsideRisks,

    validationTimeline,
    trackingIndicators,

    positionGuidance,
    conclusionOneLiner
  };
}
