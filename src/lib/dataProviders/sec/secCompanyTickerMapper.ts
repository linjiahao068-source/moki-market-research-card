import { SEC_FILES_BASE_URL, secFetchJson } from './secClient';

interface SecCompanyTickerRecord {
  cik_str: number | string;
  ticker: string;
  title: string;
}

export interface SecCompanyTickerMatch {
  cik: string;
  ticker: string;
  title: string;
}

type SecCompanyTickersResponse = Record<string, SecCompanyTickerRecord>;

let companyTickerCache: SecCompanyTickerRecord[] | null = null;
let companyTickerRequest: Promise<SecCompanyTickerRecord[]> | null = null;

const FALLBACK_COMPANY_TICKERS: SecCompanyTickerMatch[] = [
  { cik: '0001045810', ticker: 'NVDA', title: 'NVIDIA CORP' },
  { cik: '0001341439', ticker: 'ORCL', title: 'ORACLE CORP' },
  { cik: '0001318605', ticker: 'TSLA', title: 'TESLA, INC.' },
  { cik: '0000320193', ticker: 'AAPL', title: 'APPLE INC.' },
  { cik: '0000789019', ticker: 'MSFT', title: 'MICROSOFT CORP' },
  { cik: '0001018724', ticker: 'AMZN', title: 'AMAZON COM, INC.' },
  { cik: '0001652044', ticker: 'GOOGL', title: 'ALPHABET INC.' },
  { cik: '0001326801', ticker: 'META', title: 'META PLATFORMS, INC.' },
  { cik: '0001065280', ticker: 'NFLX', title: 'NETFLIX INC' },
  { cik: '0000002488', ticker: 'AMD', title: 'ADVANCED MICRO DEVICES INC' },
];

function normalizeCik(cik: number | string) {
  return String(cik).padStart(10, '0');
}

function findFallbackTicker(normalizedSymbol: string) {
  return FALLBACK_COMPANY_TICKERS.find((record) => record.ticker === normalizedSymbol) ?? null;
}

async function fetchCompanyTickers() {
  if (companyTickerCache) {
    return companyTickerCache;
  }

  if (!companyTickerRequest) {
    companyTickerRequest = secFetchJson<SecCompanyTickersResponse>(`${SEC_FILES_BASE_URL}/company_tickers.json`)
      .then((data) => {
        companyTickerCache = Object.values(data);
        return companyTickerCache;
      })
      .finally(() => {
        companyTickerRequest = null;
      });
  }

  return companyTickerRequest;
}

export async function findSecCompanyByTicker(symbol: string): Promise<SecCompanyTickerMatch | null> {
  const normalizedSymbol = symbol.trim().toUpperCase();

  if (!normalizedSymbol) {
    return null;
  }

  const records = await fetchCompanyTickers().catch(() => []);
  const match = records.find((record) => record.ticker.toUpperCase() === normalizedSymbol);

  if (!match) {
    return findFallbackTicker(normalizedSymbol);
  }

  return {
    cik: normalizeCik(match.cik_str),
    ticker: match.ticker.toUpperCase(),
    title: match.title,
  };
}
