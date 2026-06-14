import { GuidanceMetricComparison, GuidanceMetricKey } from '@/types/earnings';

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

export function buildGuidanceFromStructuredData(items?: StructuredGuidanceInput[]): GuidanceProviderResult {
  if (!items || items.length === 0) {
    return {
      guidance: [],
      warnings: [EMPTY_GUIDANCE_WARNING],
    };
  }

  return {
    guidance: items.map(createExtractedGuidance),
    warnings: [],
  };
}

export function getEmptyGuidanceResult(): GuidanceProviderResult {
  return {
    guidance: [],
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
    warnings: ['mockGuidanceProvider 仅用于开发测试，不默认用于真实卡片。', EMPTY_GUIDANCE_WARNING],
  };
}
