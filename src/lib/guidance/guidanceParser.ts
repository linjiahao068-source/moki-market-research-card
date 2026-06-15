// V0.2.6.1 placeholder - guidance parser stub for SEC/IR extraction
/* eslint-disable @typescript-eslint/no-unused-vars */
import { GlobalGuidanceEvidence } from '@/types/global-stock-data';

const GUIDANCE_KEYWORDS = [
  'outlook',
  'guidance',
  'expected to be',
  'revenue is expected',
  'revenue to be',
  'plus or minus',
  'midpoint',
  'our guidance',
  'fiscal year',
  'fiscal quarter',
  'expects revenue',
  'expects GAAP',
  'we expect',
];

export function searchTextForGuidanceEvidence(
  text: string,
  sourceUrl?: string,
  publishedAt?: string,
  source?: 'eastmoney' | 'yahoo' | 'sec-edgar' | 'sina' | 'tencent' | 'mock'
): GlobalGuidanceEvidence | null {
  const lowerText = text.toLowerCase();
  const hasGuidanceKeywords = GUIDANCE_KEYWORDS.some((keyword) => lowerText.includes(keyword));

  if (!hasGuidanceKeywords) {
    return null;
  }

  // Extract snippet around first matching keyword
  let snippet = text;
  const firstMatchIndex = GUIDANCE_KEYWORDS.reduce((earliest, keyword) => {
    const index = lowerText.indexOf(keyword);
    if (index !== -1 && (earliest === -1 || index < earliest)) {
      return index;
    }
    return earliest;
  }, -1);

  if (firstMatchIndex !== -1) {
    const start = Math.max(0, firstMatchIndex - 100);
    const end = Math.min(text.length, firstMatchIndex + 300);
    snippet = text.slice(start, end).trim();
    if (start > 0) {
      snippet = '...' + snippet;
    }
    if (end < text.length) {
      snippet = snippet + '...';
    }
  }

  return {
    title: 'Potential guidance found',
    publishedAt,
    source: source || 'sec-edgar',
    snippet,
    url: sourceUrl,
    extracted: false,
  };
}

export function parseGuidanceFromText(_text: string): {
  guidanceLow?: number;
  guidanceMid?: number;
  guidanceHigh?: number;
  warnings: string[];
} {
  // TODO: Implement actual guidance value extraction from text
  return {
    guidanceLow: undefined,
    guidanceMid: undefined,
    guidanceHigh: undefined,
    warnings: ['Guidance value extraction not implemented yet.'],
  };
}
