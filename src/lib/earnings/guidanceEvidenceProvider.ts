import { GlobalGuidanceEvidence } from '@/types/global-stock-data';
import { findSecCompanyByTicker } from '@/lib/dataProviders/sec/secCompanyTickerMapper';
import { SEC_BASE_URL, secFetchJson } from '@/lib/dataProviders/sec/secClient';
import { serverFetchJson } from '@/lib/globalStockData/http';

interface GuidanceEvidenceResult {
  evidence: GlobalGuidanceEvidence[];
  warnings: string[];
}

interface YahooSearchResponse {
  news?: Array<{
    title?: string;
    publisher?: string;
    link?: string;
    providerPublishTime?: number;
    summary?: string;
  }>;
}

interface SecSubmissionsForEvidence {
  filings?: {
    recent?: {
      accessionNumber?: string[];
      filingDate?: string[];
      reportDate?: string[];
      form?: string[];
      primaryDocument?: string[];
      primaryDocDescription?: string[];
    };
  };
}

const GUIDANCE_KEYWORDS = ['earnings', 'guidance', 'outlook', 'forecast', 'Q1', 'Q2', 'Q3', 'Q4', 'FY'];

function hasGuidanceKeyword(text?: string) {
  if (!text) {
    return false;
  }

  const normalizedText = text.toLowerCase();

  return GUIDANCE_KEYWORDS.some((keyword) => normalizedText.includes(keyword.toLowerCase()));
}

function getPublishTime(timestamp?: number) {
  return timestamp ? new Date(timestamp * 1000).toISOString() : undefined;
}

async function fetchYahooGuidanceNews(symbol: string): Promise<GuidanceEvidenceResult> {
  const url = new URL('https://query2.finance.yahoo.com/v1/finance/search');
  url.searchParams.set('q', `${symbol} earnings guidance outlook forecast`);
  url.searchParams.set('quotesCount', '0');
  url.searchParams.set('newsCount', '10');

  const response = await serverFetchJson<YahooSearchResponse>(url.toString(), {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    return {
      evidence: [],
      warnings: [`Yahoo guidance news search failed: ${response.error}`],
    };
  }

  const evidence = (response.data.news ?? [])
    .filter((item) => hasGuidanceKeyword(`${item.title ?? ''} ${item.summary ?? ''}`))
    .map<GlobalGuidanceEvidence>((item) => ({
      symbol,
      title: item.title,
      source: 'yahoo',
      url: item.link,
      publishedAt: getPublishTime(item.providerPublishTime),
      snippet: item.summary,
      evidenceType: 'news',
      extracted: false,
      warnings: ['Yahoo news is guidance-related evidence only; no structured guidance number was extracted.'],
    }));

  return {
    evidence,
    warnings: evidence.length ? [] : ['Yahoo search did not return guidance-related news evidence.'],
  };
}

function buildSecFilingUrl(cik: string, accessionNumber?: string, primaryDocument?: string) {
  if (!accessionNumber) {
    return undefined;
  }

  const cikNoLeadingZeros = String(Number(cik));
  const accessionWithoutDashes = accessionNumber.replace(/-/g, '');

  if (primaryDocument) {
    return `https://www.sec.gov/Archives/edgar/data/${cikNoLeadingZeros}/${accessionWithoutDashes}/${primaryDocument}`;
  }

  return `https://www.sec.gov/Archives/edgar/data/${cikNoLeadingZeros}/${accessionWithoutDashes}/${accessionNumber}-index.html`;
}

async function fetchSecGuidanceFilings(symbol: string): Promise<GuidanceEvidenceResult> {
  const match = await findSecCompanyByTicker(symbol);

  if (!match) {
    return {
      evidence: [],
      warnings: ['SEC CIK was not found for guidance filing evidence.'],
    };
  }

  const response = await secFetchJson<SecSubmissionsForEvidence>(`${SEC_BASE_URL}/submissions/CIK${match.cik}.json`)
    .then((data) => ({ ok: true as const, data }))
    .catch((error) => ({
      ok: false as const,
      error: error instanceof Error ? error.message : 'SEC submissions request failed.',
    }));

  if (!response.ok) {
    return {
      evidence: [],
      warnings: [`SEC guidance filing lookup failed: ${response.error}`],
    };
  }

  const recent = response.data.filings?.recent;
  const forms = recent?.form ?? [];
  const evidence: GlobalGuidanceEvidence[] = [];

  for (let index = 0; index < forms.length && evidence.length < 5; index += 1) {
    if (forms[index] !== '8-K') {
      continue;
    }

    const description = recent?.primaryDocDescription?.[index];
    const filingDate = recent?.filingDate?.[index];
    const reportDate = recent?.reportDate?.[index];

    evidence.push({
      symbol,
      title: description ? `SEC 8-K: ${description}` : 'SEC 8-K filing',
      source: 'sec-edgar',
      url: buildSecFilingUrl(match.cik, recent?.accessionNumber?.[index], recent?.primaryDocument?.[index]),
      publishedAt: filingDate,
      snippet: reportDate ? `Report date: ${reportDate}` : undefined,
      evidenceType: 'sec-filing',
      extracted: false,
      warnings: ['SEC 8-K filing is guidance-related evidence only; structured guidance was not extracted.'],
    });
  }

  return {
    evidence,
    warnings: evidence.length ? [] : ['No recent SEC 8-K filing evidence was found.'],
  };
}

export async function getGuidanceEvidence(symbol?: string): Promise<GuidanceEvidenceResult> {
  if (!symbol) {
    return {
      evidence: [],
      warnings: ['Guidance evidence lookup requires a symbol.'],
    };
  }

  const normalizedSymbol = symbol.trim().toUpperCase();
  const [newsEvidence, filingEvidence] = await Promise.all([
    fetchYahooGuidanceNews(normalizedSymbol),
    fetchSecGuidanceFilings(normalizedSymbol),
  ]);
  const evidence = [...newsEvidence.evidence, ...filingEvidence.evidence];
  const warnings = [...newsEvidence.warnings, ...filingEvidence.warnings];

  if (evidence.length === 0) {
    warnings.push('当前未找到公司指引相关 evidence。');
  }

  return {
    evidence,
    warnings,
  };
}
