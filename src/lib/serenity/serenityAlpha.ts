/**
 * Serenity Alpha - 新闻转 Alpha 假设引擎
 *
 * 核心逻辑：news -> observed demand -> financial impact -> small-cap elasticity -> validation
 */

import type { SerenityAlphaAnalysis } from '@/types/serenity';

/**
 * 生成 Serenity Alpha 分析（Mock 实现）
 */
export function generateSerenityAlpha(ticker: string, companyName: string): SerenityAlphaAnalysis {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _ = { ticker, companyName }; // Placeholder for future use
  return {
    version: '1.0',
    type: 'serenity-alpha',

    primaryCandidate: {
      companyName,
      ticker,
      segment: 'first',
    },

    conclusionOneLiner: `优先验证 ${companyName} (${ticker})，作为本次主题的一阶受益者。`,
    finalValidationCondition: `下季度财报收入/毛利率超预期则验证假设，不及预期则放弃。`,

    surfaceNews: `新闻表面描述：${companyName} 所在行业出现积极变化。`,

    observableDemand: {
      hasObservableDemand: true,
      changes: [
        '可观察到的需求变化1：产业链数据显示订单增加',
        '可观察到的需求变化2：公司指引或供应链信息验证',
      ],
    },

    financialTranslation: {
      revenueImpact: '需求变化可能推动收入增长 X%',
      marginImpact: '规模效应可能带来毛利率提升 Y%',
      cashFlowImpact: '运营现金流可能改善',
    },

    beneficiaryChain: [
      { companyName, ticker, segment: 'first' },
      { companyName: '供应链公司A', ticker: 'SUPPLYA', segment: 'second' },
      { companyName: '供应链公司B', ticker: 'SUPPLYB', segment: 'third' },
    ],

    smallCapCandidates: [
      { companyName: '小盘股X', ticker: 'SMALLX', notes: ['市值较小', '业务纯度高', '需验证财务数据'] },
    ],

    marketMisclassification: {
      currentMarketLabel: '传统行业公司',
      potentialNewLabel: '新主题受益标的',
      validationRequired: '需财报验证新业务贡献',
    },

    validationMetrics: [
      {
        metric: '收入增速',
        description: '收入增长是否验证需求',
        timeframe: 'Q1',
        confirmationCondition: '收入增长超预期',
        falsificationCondition: '收入增长不及预期',
      },
      {
        metric: '毛利率',
        description: '毛利率是否改善',
        timeframe: 'Q1',
        confirmationCondition: '毛利率提升',
        falsificationCondition: '毛利率下降',
      },
    ],

    downsideRisks: [
      '需求验证风险：需求可能不如预期',
      '竞争风险：竞争对手可能更快反应',
      '估值风险：当前估值可能已提前反应',
      '时点风险：兑现时间可能比预期长',
    ],

    positionGuidance: {
      posture: 'observe',
      conditions: [
        '先观察，暂不形成操作结论',
        '等待财报验证信号',
        '确认后再更新研究假设',
      ],
    },

    alphaScores: {
      demandCertainty: 3.5,
      transmissionClarity: 3.0,
      businessPurity: 3.5,
      marketCapElasticity: 2.5,
      marketNeglect: 3.0,
      verificationSpeed: 3.5,
      overallScore: 3.1,
    },
  };
}
