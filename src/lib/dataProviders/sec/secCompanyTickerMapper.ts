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

function normalizeCik(cik: number | string) {
  return String(cik).padStart(10, '0');
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

  const records = await fetchCompanyTickers();
  const match = records.find((record) => record.ticker.toUpperCase() === normalizedSymbol);

  if (!match) {
    return null;
  }

  return {
    cik: normalizeCik(match.cik_str),
    ticker: match.ticker.toUpperCase(),
    title: match.title,
  };
}
