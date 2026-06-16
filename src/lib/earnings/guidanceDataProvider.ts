/**
 * 公司指引数据整合提供者
 * 从多个来源提取公司指引数据
 */

import type { GuidanceMetricComparison } from '@/types/earnings';
import type { BasicCompanyData } from '@/types/basic-data';
import type { SecurityRecord } from '@/types/security';
import type { GlobalGuidanceEvidence } from '@/types/global-stock-data';

export interface GuidanceDataResult {
  guidance: GuidanceMetricComparison[];
  guidanceEvidence: GlobalGuidanceEvidence[];
  source: string;
  confidence: number;
  warnings: string[];
}

/**
 * 主函数：获取指引数据
 */
export async function getGuidanceData({
  ticker,
  security: _security,
  basicData
}: {
  ticker: string;
  security?: SecurityRecord;
  basicData?: BasicCompanyData;
}): Promise<GuidanceDataResult> {
  // 尝试从多个来源获取，优先级从高到低
  const results: { data: GuidanceDataResult; priority: number }[] = [];

  try {
    // 优先级1: SEC filings
    const secGuidance = await extractGuidanceFromSec(ticker, basicData);
    if (secGuidance.guidance.length > 0) {
      results.push({ data: secGuidance, priority: 1 });
    }
  } catch (e) {
    console.log('SEC guidance extraction skipped:', e);
  }

  try {
    // 优先级2: FMP (如果有 API Key)
    const fmpGuidance = await fetchFmpGuidance(ticker);
    if (fmpGuidance.guidance.length > 0) {
      results.push({ data: fmpGuidance, priority: 2 });
    }
  } catch (e) {
    console.log('FMP guidance fetch skipped:', e);
  }

  try {
    // 优先级3: Yahoo Finance
    const yahooGuidance = await extractGuidanceFromYahoo(ticker);
    if (yahooGuidance.guidance.length > 0) {
      results.push({ data: yahooGuidance, priority: 3 });
    }
  } catch (e) {
    console.log('Yahoo guidance extraction skipped:', e);
  }

  // 返回优先级最高的结果，如果都没有，返回空结果
  if (results.length > 0) {
    results.sort((a, b) => a.priority - b.priority);
    return results[0].data;
  }

  // 没有指引数据，返回空结果
  return {
    guidance: [],
    guidanceEvidence: [],
    source: '暂无指引数据',
    confidence: 0,
    warnings: ['当前股票暂未找到公开的业绩指引数据']
  };
}

/**
 * 从 SEC filings 提取指引信息
 */
async function extractGuidanceFromSec(
  _ticker: string,
  basicData?: BasicCompanyData
): Promise<GuidanceDataResult> {
  const guidance: GuidanceMetricComparison[] = [];
  const evidence: GlobalGuidanceEvidence[] = [];
  const warnings: string[] = [];

  // 尝试从最新的 filing 中查找
  if (basicData?.latestFiling) {
    // 这里是占位，后续可以实现真实的 SEC filing 解析
    warnings.push('SEC指引提取功能开发中');

    // 如果有 source links，可以添加为证据
    if (basicData.sourceLinks) {
      basicData.sourceLinks.forEach(link => {
        if (link.label.toLowerCase().includes('8-k') ||
            link.label.toLowerCase().includes('earnings')) {
          evidence.push({
            source: 'sec-edgar',
            snippet: `${link.label} 可能包含指引`,
            publishedAt: basicData.latestFiling!.filingDate,
            url: link.url,
            evidenceType: 'sec-filing'
          });
        }
      });
    }
  }

  return {
    guidance,
    guidanceEvidence: evidence,
    source: 'SEC EDGAR (placeholder)',
    confidence: guidance.length > 0 ? 0.85 : 0,
    warnings
  };
}

/**
 * 从 FMP 获取指引数据
 */
async function fetchFmpGuidance(_ticker: string): Promise<GuidanceDataResult> {
  // 检查是否有 API Key
  const apiKey = process.env.FMP_API_KEY;
  if (!apiKey) {
    return {
      guidance: [],
      guidanceEvidence: [],
      source: 'FMP (需要 API Key)',
      confidence: 0,
      warnings: ['FMP_API_KEY 未配置，无法获取指引数据']
    };
  }

  // 这里是占位，后续可以实现真实的 FMP API 调用
  return {
    guidance: [],
    guidanceEvidence: [],
    source: 'FMP (placeholder)',
    confidence: 0,
    warnings: ['FMP指引获取功能开发中']
  };
}

/**
 * 从 Yahoo Finance 提取指引
 */
async function extractGuidanceFromYahoo(_ticker: string): Promise<GuidanceDataResult> {
  // 这里是占位，后续可以实现从 Yahoo 提取指引
  return {
    guidance: [],
    guidanceEvidence: [],
    source: 'Yahoo Finance (placeholder)',
    confidence: 0,
    warnings: ['Yahoo指引提取功能开发中']
  };
}
