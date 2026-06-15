import { GlobalStockSearchResult } from '@/types/global-stock-data';
import { SecurityRecord, SecurityResolution } from '@/types/security';
import { resolveSecurityInput } from '@/lib/security/resolveSecurityInput';
import { serverFetchJson } from './http';

const EASTMONEY_SEARCH_URL = 'https://searchapi.eastmoney.com/api/suggest/get';
const EASTMONEY_SEARCH_TOKEN = 'D43BF722C8E33BDC906FB84D85E326E8';
const EASTMONEY_USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36';

interface EastmoneySearchItem {
  Code?: string;
  Name?: string;
  MktNum?: string | number;
  SecurityTypeName?: string;
}

interface EastmoneySearchResponse {
  QuotationCodeTable?: {
    Data?: EastmoneySearchItem[];
  };
}

const marketNameMap: Record<string, string> = {
  '105': 'NASDAQ',
  '106': 'NYSE',
  '107': 'US_OTHER',
  '116': 'HK',
};

function normalizeCode(code?: string) {
  return code?.trim() ?? '';
}

function getSecid(code: string, mktNum: string) {
  return `${mktNum}.${code}`;
}

function getYahooSymbol(code: string, mktNum: string) {
  if (mktNum === '116') {
    const normalizedCode = code.length < 5 ? code.padStart(5, '0') : code;
    const yahooCode = normalizedCode.startsWith('0') ? normalizedCode.slice(1) : normalizedCode;

    return `${yahooCode}.HK`;
  }

  return code.toUpperCase();
}

function getEastmoneyCode(code: string, mktNum: string) {
  if (mktNum === '116') {
    const normalizedCode = code.length < 5 ? code.padStart(5, '0') : code;

    return `${normalizedCode}.HK`;
  }

  if (mktNum === '106') {
    return `${code.toUpperCase()}.N`;
  }

  return `${code.toUpperCase()}.O`;
}

function mapSearchItem(item: EastmoneySearchItem): GlobalStockSearchResult | null {
  const mktNum = String(item.MktNum ?? '');

  if (!['105', '106', '107', '116'].includes(mktNum)) {
    return null;
  }

  const code = normalizeCode(item.Code);

  if (!code) {
    return null;
  }

  return {
    symbol: mktNum === '116' ? undefined : code.toUpperCase(),
    name: item.Name,
    market: marketNameMap[mktNum] ?? mktNum,
    secid: getSecid(code, mktNum),
    yahooSymbol: getYahooSymbol(code, mktNum),
    eastmoneyCode: getEastmoneyCode(code, mktNum),
    exchange: marketNameMap[mktNum] ?? mktNum,
    raw: item,
  };
}

function toSecurityRecord(result: GlobalStockSearchResult): SecurityRecord {
  const isHongKong = result.market === 'HK';
  const numericCode = isHongKong ? result.eastmoneyCode?.replace('.HK', '') : undefined;

  return {
    id: `eastmoney-${result.secid ?? result.yahooSymbol ?? result.name ?? 'unknown'}`,
    market: isHongKong ? 'HK' : 'US',
    symbol: isHongKong ? result.yahooSymbol : result.symbol,
    numericCode,
    codeVariants: numericCode ? [numericCode, numericCode.replace(/^0+/, '')].filter(Boolean) : undefined,
    companyName: result.name ?? result.symbol ?? result.yahooSymbol ?? 'Unknown Company',
    chineseNameHK: result.name,
    chineseAliases: result.name ? [result.name] : undefined,
    theme: 'Eastmoney search fallback security record',
  };
}

export async function searchEastmoneyStocks(query: string, count = 10): Promise<GlobalStockSearchResult[]> {
  const normalizedQuery = query.trim();

  if (!normalizedQuery) {
    return [];
  }

  const url = new URL(EASTMONEY_SEARCH_URL);
  url.searchParams.set('input', normalizedQuery);
  url.searchParams.set('type', '14');
  url.searchParams.set('token', EASTMONEY_SEARCH_TOKEN);
  url.searchParams.set('count', String(count));

  const response = await serverFetchJson<EastmoneySearchResponse>(url.toString(), {
    headers: {
      'User-Agent': EASTMONEY_USER_AGENT,
      Accept: 'application/json',
    },
    timeoutMs: 10_000,
  });

  if (!response.ok) {
    return [];
  }

  return (response.data.QuotationCodeTable?.Data ?? [])
    .map(mapSearchItem)
    .filter((item): item is GlobalStockSearchResult => Boolean(item));
}

// Async fallback helper: keep the existing sync Security Resolver as the first source of truth.
// Only call Eastmoney search when the local mock security master returns unmatched.
export async function resolveSecurityInputWithEastmoneyFallback(rawInput: string): Promise<SecurityResolution> {
  const localResolution = resolveSecurityInput(rawInput);

  if (localResolution.status !== 'unmatched' || localResolution.inputKind === 'unknown') {
    return localResolution;
  }

  const searchResults = await searchEastmoneyStocks(rawInput);

  if (searchResults.length === 0) {
    return localResolution;
  }

  const candidates = searchResults.map(toSecurityRecord);

  if (candidates.length === 1) {
    return {
      status: 'matched',
      inputKind: localResolution.inputKind,
      matchType: localResolution.inputKind === 'numericCode' ? 'numericCode' : 'symbol',
      rawInput,
      normalizedInput: localResolution.normalizedInput,
      security: candidates[0],
    };
  }

  return {
    status: 'ambiguous',
    inputKind: localResolution.inputKind,
    rawInput,
    normalizedInput: localResolution.normalizedInput,
    candidates,
  };
}
