/**
 * 公司指引数据整合提供者
 * 从多个来源提取公司指引数据
 */

import type { BasicCompanyData } from '@/types/basic-data';
import type { SecurityRecord } from '@/types/security';
import { getGuidanceEvidence } from './guidanceEvidenceProvider';
import { extractGuidanceFromSec } from './secGuidanceExtractor';
import { fetchFmpGuidance } from './fmpGuidanceProvider';
import { extractGuidanceFromYahoo } from './yahooGuidanceExtractor';
import type { GuidanceDataResult } from './guidanceTypes';

export type { GuidanceDataResult } from './guidanceTypes';

/**
 * 主函数：获取指引数据
 */
export async function getGuidanceData({
  ticker,
  security,
  basicData
}: {
  ticker: string;
  security?: SecurityRecord;
  basicData?: BasicCompanyData;
}): Promise<GuidanceDataResult> {
  const normalizedTicker = (security?.symbol ?? ticker).trim().toUpperCase();
  const results: { data: GuidanceDataResult; priority: number }[] = [];
  const warnings: string[] = [];
  const evidenceLookup = await getGuidanceEvidence(normalizedTicker);
  const evidence = evidenceLookup.evidence;

  warnings.push(...evidenceLookup.warnings);

  try {
    const secGuidance = await extractGuidanceFromSec(normalizedTicker, basicData, evidence);
    results.push({ data: secGuidance, priority: 1 });
  } catch (e) {
    warnings.push(e instanceof Error ? e.message : 'SEC guidance extraction skipped.');
  }

  try {
    const fmpGuidance = await fetchFmpGuidance(normalizedTicker);
    results.push({ data: fmpGuidance, priority: 2 });
  } catch (e) {
    warnings.push(e instanceof Error ? e.message : 'FMP guidance fetch skipped.');
  }

  try {
    const yahooGuidance = await extractGuidanceFromYahoo(normalizedTicker, evidence);
    results.push({ data: yahooGuidance, priority: 3 });
  } catch (e) {
    warnings.push(e instanceof Error ? e.message : 'Yahoo guidance extraction skipped.');
  }

  const evidenceByKey = new Map<string, GuidanceDataResult['guidanceEvidence'][number]>();
  const allWarnings = [...warnings];

  for (const result of results) {
    for (const item of result.data.guidanceEvidence) {
      const key = item.textBlockId ?? item.url ?? `${item.source}-${item.title ?? item.snippet ?? evidenceByKey.size}`;
      evidenceByKey.set(key, item);
    }
    allWarnings.push(...result.data.warnings);
  }

  const structuredResults = results
    .filter((result) => result.data.guidance.length > 0)
    .sort((a, b) => a.priority - b.priority);

  if (structuredResults.length > 0) {
    const primary = structuredResults[0].data;
    return {
      ...primary,
      guidanceEvidence: Array.from(evidenceByKey.values()),
      warnings: [...new Set([...allWarnings, ...primary.warnings])],
    };
  }

  const mergedEvidence = Array.from(evidenceByKey.values());
  if (mergedEvidence.length > 0) {
    return {
      guidance: [],
      guidanceEvidence: mergedEvidence,
      source: 'SEC/Yahoo guidance evidence',
      confidence: 0.3,
      warnings: [...new Set(allWarnings)],
    };
  }

  return {
    guidance: [],
    guidanceEvidence: [],
    source: '暂无指引数据',
    confidence: 0,
    warnings: [...new Set([...allWarnings, '当前股票暂未找到公开的业绩指引数据'])],
  };
}
