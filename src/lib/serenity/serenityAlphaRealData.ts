/**
 * Serenity Alpha - 简化真实数据版本
 *
 * 核心逻辑: 新闻 → 已观察到的需求变化 → 财务影响 → 小盘弹性 → 验证
 * 注意：本版本暂时不接入真实新闻数据，仅用于框架验证
 */

import type { SerenityAlphaAnalysis } from '@/types/serenity';
import type { SerenityDataInput } from './index';
import { generateSerenityAlpha } from './serenityAlpha';

/**
 * 基于真实数据生成 Serenity Alpha 分析
 * 注意：目前为简化版本，不包含真实新闻数据
 */
export function generateSerenityAlphaWithData(input: SerenityDataInput): SerenityAlphaAnalysis {
  const { ticker, companyName, earningsSnapshot, basicData } = input;

  // 如果没有足够数据，回退到 mock 版本
  if (!earningsSnapshot && !basicData) {
    return generateSerenityAlpha(ticker, companyName);
  }

  // 从真实数据提取一些指标
  const revenueMetric = earningsSnapshot?.metrics.find(m => m.metricKey === 'revenue');
  const epsMetric = earningsSnapshot?.metrics.find(m => m.metricKey === 'eps');

  // 计算 Alpha 评分（简化版）
  let demandCertainty = 3.0;
  let transmissionClarity = 2.5;
  const businessPurity = 3.0;
  const marketCapElasticity = 2.5;
  const marketNeglect = 2.5;
  const verificationSpeed = 3.0;

  // 根据真实数据调整评分
  if (revenueMetric?.actual !== undefined && revenueMetric.yoyPct !== undefined) {
    const yoy = revenueMetric.yoyPct;
    if (yoy > 0.15) {
      demandCertainty = 3.5;
      transmissionClarity = 3.0;
    } else if (yoy < 0.05) {
      demandCertainty = 2.5;
    }
  }

  const overallScore = (
    demandCertainty +
    transmissionClarity +
    businessPurity +
    marketCapElasticity +
    marketNeglect +
    verificationSpeed
  ) / 6;

  const hasRealData = earningsSnapshot?.provider !== 'mock' || basicData?.provider !== 'mock';

  return {
    version: '1.0',
    type: 'serenity-alpha',

    primaryCandidate: {
      companyName,
      ticker,
      segment: 'first'
    },

    conclusionOneLiner: hasRealData ?
      `优先验证 ${companyName} (${ticker})，作为本次主题的一阶受益者（基于真实财报数据）` :
      `优先验证 ${companyName} (${ticker})，作为本次主题的一阶受益者`,

    finalValidationCondition: '下季度财报收入/毛利率超预期则验证假设，不及预期则放弃',

    surfaceNews: hasRealData ?
      `新闻表面描述: 基于 ${earningsSnapshot?.provider || basicData?.provider} 财报数据，公司财务状况良好` :
      `新闻表面描述: ${companyName} 所在行业出现积极变化`,

    observableDemand: {
      hasObservableDemand: true,
      changes: [
        '可观察到的需求变化1: 产业链数据显示订单增加',
        '可观察到的需求变化2: 公司指引或供应链信息验证'
      ]
    },

    financialTranslation: {
      revenueImpact: hasRealData ?
        `需求变化可能推动收入增长（当前营收增速 ${revenueMetric?.yoyPct ? revenueMetric.yoyPct * 100 + '%' : 'N/A'}）` :
        '需求变化可能推动收入增长',
      marginImpact: '规模效应可能带来毛利率改善',
      cashFlowImpact: '运营现金流可能改善'
    },

    beneficiaryChain: [
      { companyName, ticker, segment: 'first' },
      { companyName: '供应链公司A', ticker: 'SUPPLYA', segment: 'second' },
      { companyName: '供应链公司B', ticker: 'SUPPLYB', segment: 'third' }
    ],

    smallCapCandidates: [
      { companyName: '小盘股X', ticker: 'SMALLX', notes: ['市值较小', '业务纯度高', '需验证财务数据'] }
    ],

    marketMisclassification: {
      currentMarketLabel: '传统行业公司',
      potentialNewLabel: '新主题受益标的',
      validationRequired: '需财报验证新业务贡献'
    },

    validationMetrics: [
      {
        metric: '收入增速',
        description: hasRealData ? '验证当前增速是否可持续' : '验证需求增长',
        timeframe: 'Q1',
        confirmationCondition: '收入增长超预期',
        falsificationCondition: '收入增长不及预期'
      },
      {
        metric: '毛利率',
        description: '验证盈利能力',
        timeframe: 'Q1',
        confirmationCondition: '毛利率提升',
        falsificationCondition: '毛利率下降'
      }
    ],

    downsideRisks: [
      '需求验证风险: 需求可能不如预期',
      '竞争风险: 竞争对手可能更快反应',
      '估值风险: 当前估值可能已提前反应',
      '时点风险: 兑现时间可能比预期长'
    ],

    positionGuidance: {
      posture: 'observe',
      conditions: [
        '先观察，暂不形成操作结论',
        '等待财报验证信号',
        '确认后再更新研究假设'
      ]
    },

    alphaScores: {
      demandCertainty,
      transmissionClarity,
      businessPurity,
      marketCapElasticity,
      marketNeglect,
      verificationSpeed,
      overallScore
    }
  };
}
