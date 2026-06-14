import { SEC_BASE_URL, secFetchJson } from './secClient';

interface SecRecentFilings {
  accessionNumber?: string[];
  filingDate?: string[];
  reportDate?: string[];
  form?: string[];
}

interface SecSubmissionsResponse {
  name?: string;
  tickers?: string[];
  exchanges?: string[];
  filings?: {
    recent?: SecRecentFilings;
  };
}

export interface SecLatestFiling {
  form?: string;
  filingDate?: string;
  accessionNumber?: string;
  reportDate?: string;
  sourceUrl?: string;
}

export interface SecSubmissionsSummary {
  companyName?: string;
  cik: string;
  ticker?: string;
  exchange?: string;
  latestFiling?: SecLatestFiling;
}

const TARGET_FORMS = new Set(['10-K', '10-Q', '8-K']);

function normalizeCik(cik: string) {
  return cik.padStart(10, '0');
}

function buildFilingUrl(cik: string, accessionNumber?: string) {
  if (!accessionNumber) {
    return undefined;
  }

  const cikNoLeadingZeros = String(Number(cik));
  const accessionWithoutDashes = accessionNumber.replace(/-/g, '');

  return `https://www.sec.gov/Archives/edgar/data/${cikNoLeadingZeros}/${accessionWithoutDashes}/${accessionNumber}-index.html`;
}

function getLatestTargetFiling(recent?: SecRecentFilings, cik?: string): SecLatestFiling | undefined {
  if (!recent || !cik) {
    return undefined;
  }

  const forms = recent.form ?? [];

  for (let index = 0; index < forms.length; index += 1) {
    const form = forms[index];

    if (!TARGET_FORMS.has(form)) {
      continue;
    }

    const accessionNumber = recent.accessionNumber?.[index];

    return {
      form,
      filingDate: recent.filingDate?.[index],
      accessionNumber,
      reportDate: recent.reportDate?.[index],
      sourceUrl: buildFilingUrl(cik, accessionNumber),
    };
  }

  return undefined;
}

export async function fetchSecSubmissions(cik: string): Promise<SecSubmissionsSummary> {
  const normalizedCik = normalizeCik(cik);
  const data = await secFetchJson<SecSubmissionsResponse>(`${SEC_BASE_URL}/submissions/CIK${normalizedCik}.json`);

  return {
    companyName: data.name,
    cik: normalizedCik,
    ticker: data.tickers?.[0],
    exchange: data.exchanges?.[0],
    latestFiling: getLatestTargetFiling(data.filings?.recent, normalizedCik),
  };
}
