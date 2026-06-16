/**
 * Serenity Skills - Mock 数据生成器
 *
 * 用于快速演示所有 Serenity 分析模块。
 * 重要：所有数据都是 Mock/Placeholder，仅用于产品体验验证，不构成投资建议！
 */

import type { SerenityAnalysisBundle } from '@/types/serenity';
import {
  generateSerenityAlpha,
  generateBayesianValuation,
  generateGfDmaHealthIndex,
  generateTamAdjPeg,
  generateBuySideMemo,
} from '.';

/**
 * Serenity 数据状态说明
 */
export const SERENITY_DATA_NOTICE =
  'Serenity Skills 分析当前为演示版本，所有数据为 Mock/Placeholder，不代表真实预测或研究观点。' +
  '后续版本将接入真实 SEC  filings、分析师预期和市场数据。';

/**
 * 生成完整的 Serenity 分析包
 */
export function generateSerenityBundle(ticker: string, companyName: string): SerenityAnalysisBundle {
  return {
    ticker,
    companyName,
    generatedAt: new Date().toISOString(),
    dataNotice: SERENITY_DATA_NOTICE,

    alphaAnalysis: generateSerenityAlpha(ticker, companyName),
    bayesianValuation: generateBayesianValuation(ticker, companyName),
    gfDmaHealthIndex: generateGfDmaHealthIndex(ticker, companyName),
    tamAdjPeg: generateTamAdjPeg(ticker, companyName),
    buySideMemo: generateBuySideMemo(ticker, companyName),
  };
}

/**
 * NVDA 预设分析包
 */
export function getNvdaSerenityBundle(): SerenityAnalysisBundle {
  return generateSerenityBundle('NVDA', 'NVIDIA Corporation');
}

/**
 * MU 预设分析包
 */
export function getMuSerenityBundle(): SerenityAnalysisBundle {
  return generateSerenityBundle('MU', 'Micron Technology Inc.');
}
