import type { GlobalGuidanceEvidence } from '@/types/global-stock-data';
import type { GuidanceDataResult } from './guidanceTypes';
import { getGuidanceEvidence } from './guidanceEvidenceProvider';

function filterYahooEvidence(evidence: GlobalGuidanceEvidence[]) {
  return evidence.filter((item) => item.source === 'yahoo' || item.evidenceType === 'news');
}

export async function extractGuidanceFromYahoo(
  ticker: string,
  evidenceInput?: GlobalGuidanceEvidence[]
): Promise<GuidanceDataResult> {
  const normalizedTicker = ticker.trim().toUpperCase();
  const lookup = evidenceInput
    ? { evidence: evidenceInput, warnings: [] as string[] }
    : await getGuidanceEvidence(normalizedTicker);
  const evidence = filterYahooEvidence(lookup.evidence);

  return {
    guidance: [],
    guidanceEvidence: evidence,
    source: evidence.length > 0 ? 'Yahoo guidance evidence' : 'Yahoo Finance',
    confidence: evidence.length > 0 ? 0.25 : 0,
    warnings: [
      ...lookup.warnings.filter((warning) => warning.toLowerCase().includes('yahoo')),
      evidence.length > 0
        ? 'Yahoo guidance-related news found; no structured guidance number was extracted automatically.'
        : 'Yahoo guidance-related news evidence was not found for this symbol.',
    ],
  };
}
