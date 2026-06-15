/* eslint-disable @typescript-eslint/no-unused-vars */
import { GuidanceMetricComparison, GuidanceMetricKey } from '@/types/earnings';
import { GlobalGuidanceEvidence } from '@/types/global-stock-data';
import { earningsProviderConfig } from '@/lib/config/earningsProviders';
import { getManualGuidanceForTicker } from '@/lib/guidance/providers/manualGuidanceProvider';
import { getSecGuidanceEvidence } from '@/lib/guidance/providers/secGuidanceEvidenceProvider';

interface StructuredGuidanceInput {
  metricKey: GuidanceMetricKey;
  label: string;
  guidanceLow?: number;
  guidanceMid?: number;
  guidanceHigh?: number;
  consensus?: number;
  gapAbs?: number;
  gapPct?: number;
  periodLabel?: string;
  evidenceText?: string;
  sourceUrl?: string;
}

export interface GuidanceProviderResult {
  guidance: GuidanceMetricComparison[];
  evidence: GlobalGuidanceEvidence[];
  warnings: string[];
}

const EMPTY_GUIDANCE_WARNING = '当前未接入结构化公司指引数据。';

function createUnavailableGuidance(metricKey: GuidanceMetricKey, label: string): GuidanceMetricComparison {
  return {
    metricKey,
    label,
    source: 'mock',
    quality: 'missing',
    warnings: ['未提取到公司指引。'],
  };
}

function createExtractedGuidance(input: StructuredGuidanceInput): GuidanceMetricComparison {
  const hasEvidence = Boolean(input.evidenceText && input.sourceUrl);

  return {
    metricKey: input.metricKey,
    label: input.label,
    guidanceLow: input.guidanceLow,
    guidanceMid: input.guidanceMid,
    guidanceHigh: input.guidanceHigh,
    consensus: input.consensus,
    gapAbs: input.gapAbs,
    gapPct: input.gapPct,
    periodLabel: input.periodLabel,
    source: hasEvidence ? 'extracted' : 'manual',
    quality: hasEvidence ? 'extracted' : 'missing',
    evidenceText: input.evidenceText,
    sourceUrl: input.sourceUrl,
    warnings: hasEvidence ? [] : ['缺少 evidenceText 或 sourceUrl，不能标记为 verified / extracted。'],
  };
}

export function buildGuidanceFromStructuredData(items?: StructuredGuidanceInput[], evidence?: GlobalGuidanceEvidence[]): GuidanceProviderResult {
  if (!items || items.length === 0) {
    return {
      guidance: [],
      evidence: evidence ?? [],
      warnings: [EMPTY_GUIDANCE_WARNING],
    };
  }

  return {
    guidance: items.map(createExtractedGuidance),
    evidence: evidence ?? [],
    warnings: [],
  };
}

export function getEmptyGuidanceResult(): GuidanceProviderResult {
  return {
    guidance: [],
    evidence: [],
    warnings: [EMPTY_GUIDANCE_WARNING],
  };
}

export function mockGuidanceProvider(): GuidanceProviderResult {
  return {
    guidance: [
      createUnavailableGuidance('nextQuarterRevenue', 'Next quarter revenue guidance'),
      createUnavailableGuidance('nextQuarterEps', 'Next quarter EPS guidance'),
      createUnavailableGuidance('fullYearRevenue', 'Full year revenue guidance'),
      createUnavailableGuidance('fullYearEps', 'Full year EPS guidance'),
    ],
    evidence: [],
    warnings: ['mockGuidanceProvider 仅用于开发测试，不默认用于真实卡片。', EMPTY_GUIDANCE_WARNING],
  };
}

// Manual guidance provider - placeholder for future manual/extracted guidance
async function getManualGuidance(ticker?: string): Promise<GuidanceProviderResult> {
  if (!ticker) {
    return {
      guidance: [],
      evidence: [],
      warnings: ['No ticker provided for manual guidance.'],
    };
  }

  // First try manual guidance
  const manualResult = getManualGuidanceForTicker(ticker);
  if (manualResult) {
    // Also add SEC guidance evidence as backup
    try {
      const secEvidence = await getSecGuidanceEvidence(ticker);
      return {
        guidance: manualResult.guidance,
        evidence: [...manualResult.evidence, ...secEvidence.evidence],
        warnings: [...manualResult.warnings, ...secEvidence.warnings],
      };
    } catch (_error) {
      // Silently continue with just manual guidance
      return manualResult;
    }
  }

  // No manual guidance, try SEC guidance evidence
  try {
    const secEvidence = await getSecGuidanceEvidence(ticker);
    return {
      guidance: [],
      evidence: secEvidence.evidence,
      warnings: [`No manual guidance available for ${ticker}.`, ...secEvidence.warnings],
    };
  } catch (_error) {
    // Fallback to empty
  }

  return {
    guidance: [],
    evidence: [],
    warnings: [`No manual guidance available for ${ticker}.`],
  };
}

// Server-side only: returns guidance based on config
export async function getGuidanceData(ticker?: string): Promise<GuidanceProviderResult> {
  if (earningsProviderConfig.isGuidanceDisabled()) {
    return {
      guidance: [],
      evidence: [],
      warnings: ['Guidance provider is disabled via config.'],
    };
  }

  switch (earningsProviderConfig.guidance.provider) {
    case 'manual':
      return getManualGuidance(ticker);
    case 'mock':
      return mockGuidanceProvider();
    default:
      return {
        guidance: [],
        evidence: [],
        warnings: [`Unknown guidance provider: ${earningsProviderConfig.guidance.provider}`],
      };
  }
}
