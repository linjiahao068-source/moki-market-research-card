import type { BasicCompanyData } from '@/types/basic-data';
import type { GlobalGuidanceEvidence } from '@/types/global-stock-data';
import type { GuidanceDataResult } from './guidanceTypes';
import { getGuidanceEvidence } from './guidanceEvidenceProvider';

function filterSecEvidence(evidence: GlobalGuidanceEvidence[]) {
  return evidence.filter((item) => item.source === 'sec-edgar' || item.evidenceType === 'sec-filing');
}

function buildSourceLinkEvidence(
  ticker: string,
  basicData?: BasicCompanyData
): GlobalGuidanceEvidence[] {
  if (!basicData?.sourceLinks || !basicData.latestFiling) {
    return [];
  }

  return basicData.sourceLinks
    .filter((link) => {
      const label = link.label.toLowerCase();
      return label.includes('8-k') || label.includes('earnings') || label.includes('filing');
    })
    .map((link) => ({
      symbol: ticker,
      title: link.label,
      source: 'sec-edgar' as const,
      url: link.url,
      publishedAt: basicData.latestFiling?.filingDate,
      snippet: `${link.label} may contain management commentary or forward-looking statements.`,
      evidenceType: 'sec-filing' as const,
      extracted: false,
      warnings: ['SEC filing linked as evidence; structured guidance values require source review.'],
    }));
}

export async function extractGuidanceFromSec(
  ticker: string,
  basicData?: BasicCompanyData,
  evidenceInput?: GlobalGuidanceEvidence[]
): Promise<GuidanceDataResult> {
  const normalizedTicker = ticker.trim().toUpperCase();
  const lookup = evidenceInput
    ? { evidence: evidenceInput, warnings: [] as string[] }
    : await getGuidanceEvidence(normalizedTicker);
  const evidence = [
    ...filterSecEvidence(lookup.evidence),
    ...buildSourceLinkEvidence(normalizedTicker, basicData),
  ];

  return {
    guidance: [],
    guidanceEvidence: evidence,
    source: evidence.length > 0 ? 'SEC EDGAR evidence' : 'SEC EDGAR',
    confidence: evidence.length > 0 ? 0.35 : 0,
    warnings: [
      ...lookup.warnings.filter((warning) => warning.toLowerCase().includes('sec')),
      evidence.length > 0
        ? 'SEC filing evidence found; no structured guidance number was extracted automatically.'
        : 'SEC filing evidence was not found for this symbol.',
    ],
  };
}
