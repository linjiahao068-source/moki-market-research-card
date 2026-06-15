// V0.2.6.1 placeholder - SEC guidance evidence provider
// To be replaced by full implementation that fetches and parses 8-K Exhibit 99.1
/* eslint-disable @typescript-eslint/no-unused-vars */
import { GlobalGuidanceEvidence } from '@/types/global-stock-data';
import { BasicCompanyData } from '@/types/basic-data';
import { getBasicCompanyData } from '@/lib/dataProviders/getBasicCompanyData';
import { searchTextForGuidanceEvidence } from '../guidanceParser';

export interface SecGuidanceEvidenceResult {
  evidence: GlobalGuidanceEvidence[];
  warnings: string[];
}

// Placeholder - in real implementation this would fetch the actual filing
// document from SEC EDGAR and extract relevant text
async function fetchFilingText(_filingUrl: string): Promise<string | null> {
  // TODO: Implement actual fetching of filing text from SEC
  return null;
}

function buildEvidenceFromFilingInfo(
  filingInfo: BasicCompanyData['latestFiling'],
  cik?: string
): GlobalGuidanceEvidence[] {
  const evidence: GlobalGuidanceEvidence[] = [];

  if (filingInfo?.url) {
    // Build evidence just from the filing URL (without parsing actual content yet)
    evidence.push({
      title: `${filingInfo.formType || 'SEC Filing'} - Check for guidance`,
      publishedAt: filingInfo.filingDate,
      source: 'sec-edgar',
      snippet: `${filingInfo.formType || 'Filing'} filed on ${filingInfo.filingDate || 'unknown date'}. Please check for guidance/outlook information.`,
      url: filingInfo.url,
      extracted: false,
    });
  }

  // Also add EDGAR search link
  if (cik) {
    evidence.push({
      title: 'SEC EDGAR Filings Search',
      publishedAt: new Date().toISOString(),
      source: 'sec-edgar',
      snippet: `Search all SEC filings for CIK ${cik} to find guidance/outlook.`,
      url: `https://www.sec.gov/edgar/browse/?CIK=${cik}`,
      extracted: false,
    });
  }

  return evidence;
}

export async function getSecGuidanceEvidence(ticker: string): Promise<SecGuidanceEvidenceResult> {
  const warnings: string[] = [];
  const evidence: GlobalGuidanceEvidence[] = [];

  try {
    // First get basic data to find CIK and latest filing
    const basicData = await getBasicCompanyData({
      symbol: ticker,
      market: 'US',
    });

    if (!basicData) {
      warnings.push('Could not get basic company data from SEC.');
      return { evidence, warnings };
    }

    // Get CIK from basic data
    let cik: string | undefined;
    const securityId = basicData.security?.id;
    if (securityId?.startsWith('sec-')) {
      // Try to extract CIK from other fields
    }

    // Add evidence from latest filing info
    const filingEvidence = buildEvidenceFromFilingInfo(
      basicData.latestFiling,
      cik
    );
    evidence.push(...filingEvidence);

    // Try to fetch and search actual filing text (placeholder)
    if (basicData.latestFiling?.url) {
      try {
        const filingText = await fetchFilingText(basicData.latestFiling.url);
        if (filingText) {
          const guidanceEvidence = searchTextForGuidanceEvidence(
            filingText,
            basicData.latestFiling.url,
            basicData.latestFiling.filingDate,
            'sec-edgar'
          );
          if (guidanceEvidence) {
            evidence.push(guidanceEvidence);
          }
        }
      } catch (_error) {
        // Silently continue - placeholder doesn't actually fetch text
      }
    }
  } catch (error) {
    warnings.push(
      `SEC guidance evidence search failed: ${error instanceof Error ? error.message : 'unknown error'}`
    );
  }

  return { evidence, warnings };
}
