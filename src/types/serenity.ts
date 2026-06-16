/**
 * Serenity Skills - 类型定义
 *
 * 基于 haskaomni/serenity-skill 的研究框架，转译为 TypeScript 类型。
 * 原始框架参考：https://github.com/haskaomni/serenity-skill
 *
 * 重要：当前实现为演示版本，数据均为 Mock/Placeholder，不构成投资建议！
 */

// ============================================================================
// 1. Serenity Alpha - 新闻转 Alpha 假设
// ============================================================================

export interface AlphaBeneficiary {
  companyName: string;
  ticker: string;
  marketCap?: number;
  revenueBase?: number;
  businessPurity?: number; // 0-1，业务与需求主题的相关度
  segment: "first" | "second" | "third"; // 一阶/二阶/三阶受益者
}

export interface AlphaValidationMetric {
  metric: string;
  description: string;
  timeframe: "Q1" | "Q2" | "Q3" | "Q4";
  confirmationCondition: string;
  falsificationCondition: string;
}

export type AlphaPositionPosture =
  | "observe" // 观察
  | "small_test" // 小仓试错
  | "consider_adding" // 验证后加仓
  | "trade_only" // 只交易不投资
  | "exit_or_downgrade"; // 降级或退出

export interface SerenityAlphaAnalysis {
  version: "1.0";
  type: "serenity-alpha";

  // 结论先行
  primaryCandidate: AlphaBeneficiary | null;
  conclusionOneLiner: string;
  finalValidationCondition: string;

  // A. 表层新闻
  surfaceNews: string;

  // B. 已发生的需求变化
  observableDemand: {
    hasObservableDemand: boolean;
    changes: string[];
  };

  // C. 财务翻译
  financialTranslation: {
    revenueImpact: string;
    marginImpact: string;
    cashFlowImpact: string;
    balanceSheetImpact?: string;
  };

  // D. 受益链条
  beneficiaryChain: AlphaBeneficiary[];

  // E. 小市值高弹性标的
  smallCapCandidates: Array<{
    companyName: string;
    ticker: string;
    notes: string[];
  }>;

  // F. 市场误分类
  marketMisclassification: {
    currentMarketLabel: string;
    potentialNewLabel: string;
    validationRequired: string;
  } | null;

  // G. 验证指标
  validationMetrics: AlphaValidationMetric[];

  // H. 下行风险
  downsideRisks: string[];

  // I. 仓位建议（条件化表述）
  positionGuidance: {
    posture: AlphaPositionPosture;
    conditions: string[];
  };

  // Alpha 强度评分（1-5）
  alphaScores: {
    demandCertainty: number; // 需求确定性
    transmissionClarity: number; // 传导清晰度
    businessPurity: number; // 业务纯度
    marketCapElasticity: number; // 市值弹性
    marketNeglect: number; // 市场忽视度
    verificationSpeed: number; // 验证速度
    overallScore: number; // 综合评分
  };
}

// ============================================================================
// 2. Bayesian Intrinsic Growth Valuation - 贝叶斯内在增长估值
// ============================================================================

export type GrowthHypothesis = "H0" | "H1" | "H2" | "H3" | "H4" | "H5";

export interface GrowthHypothesisItem {
  hypothesis: GrowthHypothesis;
  label: string;
  cagrRange: string;
  priorProbability: number; // 0-1
  posteriorProbability: number; // 0-1
  coreReasoning: string;
}

export type ValuationState =
  | "undervalued" // 低估
  | "fair_value" // 合理
  | "expensive_but_tradable" // 高估但可交易
  | "bubble_like"; // 泡沫化

export type PriceGrowthDivergence =
  | "price_lagging_fundamentals" // 股价落后基本面
  | "price_aligned_with_fundamentals" // 股价匹配基本面
  | "price_ahead_of_fundamentals" // 股价领先基本面
  | "severe_divergence_fomo_risk"; // 严重背离

export interface BayesianGrowthValuation {
  version: "1.0";
  type: "bayesian-intrinsic-growth-valuation";

  // 1. 公司一句话定位
  companyOneLiner: string;

  // 2. 当前增长假设概率表
  growthHypotheses: GrowthHypothesisItem[];

  // 3. 加权内在增长速度
  weightedIntrinsicGrowth: {
    cagrRange: string;
    midpointCagr: number;
    keyAssumptions: string[];
  };

  // 4. 市场隐含增长速度
  marketImpliedGrowth: {
    cagrRange: string;
    reasoning: string;
    missingInputs?: string[];
  } | null;

  // 5. 股价走势与内在增速背离
  priceGrowthDivergence: {
    state: PriceGrowthDivergence;
    analysis: string;
  };

  // 6. 新信息的贝叶斯更新
  bayesianUpdates: Array<{
    information: string;
    affectedVariables: string[];
    likelihoodInterpretation: string;
    posteriorShift: string;
  }>;

  // 7. 估值状态
  valuationState: ValuationState;
  valuationReasoning: string;

  // 8. 上行空间
  upsideDrivers: string[];

  // 9. 下行风险
  downsideRisks: string[];

  // 10. 验证周期
  validationTimeline: Array<{
    timeframe: string;
    metricsToWatch: string[];
  }>;

  // 11. 关键跟踪指标
  trackingIndicators: string[];

  // 12. 仓位建议（条件化表述）
  positionGuidance: {
    posture: string;
    conditions: string[];
  };

  // 13. 一句话结论
  conclusionOneLiner: string;
}

// ============================================================================
// 3. GF-DMA Health Index - 基本面/趋势健康评分
// ============================================================================

export type GfDmaHealthState =
  | "healthy_momentum" // 健康上涨趋势
  | "strong_but_watch" // 强势但需观察
  | "hot_but_supported" // 过热但有支撑
  | "damaged_or_overheated" // 趋势受损或过热
  | "high_risk" // 高风险
  | "broken_or_escaping"; // 趋势断裂或逃逸

export interface GfDmaSpeedMatch {
  dma: "20DMA" | "50DMA" | "100DMA" | "200DMA";
  quarterlySlope: number; // 季度化斜率 G_DMAx
  relativeToFundamental: number; // R_x = G_DMAx / G_f
  status: string;
}

export interface GfDmaPriceDivergence {
  metric: string;
  divergence: number;
  status: string;
}

export interface GfDmaHealthIndex {
  version: "1.0";
  type: "gf-dma-health-index";

  // 评分结果
  finalScore: number; // 0-100
  healthState: GfDmaHealthState;
  oneLinerJudgement: string;

  // 1. 基本面速度 G_f
  fundamentalSpeed: {
    latestQuarterRevenue?: number;
    nextQuarterRevenueGuide?: number;
    revenueQoq?: number;
    epsQoq?: number;
    grossProfitQoq?: number;
    gRevenue?: number;
    gGrossProfit?: number;
    gEps?: number;
    gRevision?: number;
    overallGF: number; // 综合基本面速度
  };

  // 2. 均线速度匹配
  dmaSpeedMatches: GfDmaSpeedMatch[];

  // 3. 股价-均线背离
  priceDmaDivergences: GfDmaPriceDivergence[];

  // 4. 趋势平行度 / 逃逸比率
  trendParallelism: {
    escapeRatio?: number;
    status: string;
  };

  // 5. 预期上修确认
  revisionConfirmation: {
    guidanceVsConsensus: string;
    past30DayChange: string;
    status: string;
    score: number; // 0-100
  };

  // 6. 综合评分分解
  scoreBreakdown: {
    growthMatchScore: number; // S_GrowthMatch (40%)
    divergenceScore: number; // S_Divergence (25%)
    parallelScore: number; // S_Parallel (20%)
    revisionScore: number; // S_Revision (15%)
  };
}

// ============================================================================
// 4. TAM-Adj-PEG - TAM 调整 PEG 估值
// ============================================================================

export type TamAdjPegValuationTier =
  | "very_cheap" // < 0.5
  | "clearly_attractive" // 0.5-0.8
  | "reasonable_to_slightly_cheap" // 0.8-1.2
  | "reasonable_to_slightly_expensive" // 1.2-1.8
  | "expensive_unless_super_long_runway" // 1.8-2.5
  | "very_expensive_or_inputs_distorted"; // > 2.5

export type PositionType =
  | "core_growth" // 核心成长
  | "high_beta_growth" // 高beta成长
  | "turnaround" // 反转
  | "option_like" // 期权特性
  | "cyclical"; // 周期

export interface TamAdjPegValuation {
  version: "1.0";
  type: "tam-adj-peg";

  companyName: string;
  ticker: string;

  // 1. 当前估值
  currentValuation: {
    currentPE?: number;
    forwardPE?: number;
    traditionalPeg?: number;
  };

  // 2. 增长拆解
  growthBreakdown: {
    epsCagr2To3Yr?: number;
    revenueCagr?: number;
    tamCagr?: number;
    currentRevenueVsTam?: number; // 渗透率
    highGrowthDurationYears?: number; // 高速增长 runway
  };

  // 3. TAM Runway Factor
  tamRunwayFactor: {
    estimate: number;
    reasoning: string;
  };

  // 4. Quality Factor
  qualityFactor: {
    estimate: number;
    positives: string[];
    negatives: string[];
  };

  // 5. TAM-Adj-PEG 计算
  calculation: {
    adjustedGrowth: number; // EPS CAGR × TAM 因子 × 质量因子
    tamAdjPeg: number;
  };

  // 6. 结论
  conclusion: {
    valuationTier: TamAdjPegValuationTier;
    upsideDrivers: string[];
    downsideRisks: string[];
    suitablePositionType: PositionType;
  };
}

// ============================================================================
// 5. Buy-Side Equity Research Memo - 完整买方研究备忘录
// ============================================================================

export type InvestmentViewBias = "positive" | "neutral" | "cautious";

export interface Catalyst {
  description: string;
  timeframe: string;
}

export interface TrackingMetric {
  metric: string;
  currentValue?: string;
  upperThreshold?: string;
  lowerThreshold?: string;
  frequency: "quarterly" | "monthly" | "weekly" | "daily";
}

export interface SourceReference {
  type: "SEC 10-K" | "SEC 10-Q" | "SEC 8-K" | "Earnings Call" | "IR Presentation" | "Industry Report" | "Other";
  date: string;
  description: string;
}

export interface BuySideResearchMemo {
  version: "1.0";
  type: "buy-side-equity-research-memo";

  ticker: string;
  companyName: string;

  // 投资观点先行
  investmentView: {
    bias: InvestmentViewBias;
    coreLogicOneLiner: string;
    keyDebates: string[];
    thesisBreakpoint: string; // 什么条件让假设成立或失效
  };

  // 公司业务定位
  businessPositioning: {
    oneLinerDescription: string;
    businessModel: string;
    moats: string[];
  };

  // 行业与需求分析
  industryAnalysis: {
    tam?: number;
    penetration?: number;
    growthDrivers: string[];
    competitiveLandscape: string;
  };

  // 财务分析与验证
  financialAnalysis: {
    historicalTrends: string;
    guidanceAnalysis: string;
    keyMetrics: string[];
    validationChain: string[];
  };

  // 估值分析
  valuationAnalysis: {
    currentMultiples: {
      pe?: number;
      evSales?: number;
      evEbitda?: number;
    };
    historicalPercentile: string;
    peerComparison: string;
    serenityCrossChecks: {
      tamAdjPeg: boolean;
      bayesianIntrinsicGrowth: boolean;
      gfDmaHealthIndex: boolean;
    };
  };

  // Bull / Base / Bear 情景
  scenarios: {
    bull: {
      probability: number;
      revenueGrowth: string;
      margin: string;
      multiple: string;
      impliedChange: string;
      assumptions: string[];
    };
    base: {
      probability: number;
      revenueGrowth: string;
      margin: string;
      multiple: string;
      impliedChange: string;
      assumptions: string[];
    };
    bear: {
      probability: number;
      revenueGrowth: string;
      margin: string;
      multiple: string;
      impliedChange: string;
      assumptions: string[];
    };
  };

  // 催化剂
  catalysts: Catalyst[];

  // 风险因素
  riskFactors: {
    upsideRisks: string[];
    downsideRisks: Array<{
      category: "业务" | "执行" | "估值" | "宏观/周期" | "流动性";
      description: string;
    }>;
  };

  // 差异化认知（Variant Perception）
  variantPerception: {
    marketConsensus: string;
    ourDifference: string;
    validationConditions: string;
  } | null;

  // 跟踪仪表盘
  trackingDashboard: TrackingMetric[];

  // 来源清单
  sources: SourceReference[];

  // 免责声明
  disclaimer: string;
}

// ============================================================================
// 综合容器 - 包含所有 Serenity 分析结果
// ============================================================================

export interface SerenityAnalysisBundle {
  ticker: string;
  companyName: string;
  generatedAt: string;
  dataNotice?: string;

  // 各模块分析结果（可能为空）
  alphaAnalysis?: SerenityAlphaAnalysis;
  bayesianValuation?: BayesianGrowthValuation;
  gfDmaHealthIndex?: GfDmaHealthIndex;
  tamAdjPeg?: TamAdjPegValuation;
  buySideMemo?: BuySideResearchMemo;
}
