import { SecurityRecord } from '@/types/security';

export interface MarketSymbolMapping {
  symbol?: string;
  numericCode?: string;
  yahooSymbol?: string;
  eastmoneySecid?: string;
  eastmoneySecucode?: string;
}

const US_EXCHANGE_PREFIX: Record<string, string> = {
  NVDA: '105',
  SNOW: '106',
  DELL: '106',
  ORCL: '106',
};

const US_SECUCODE_SUFFIX: Record<string, string> = {
  NVDA: 'O',
  SNOW: 'N',
  DELL: 'N',
  ORCL: 'N',
};

function normalizeQuery(query: string) {
  return query.trim().toUpperCase();
}

function normalizeHongKongCode(code: string) {
  const normalizedCode = code.trim();

  if (/^\d+$/.test(normalizedCode) && normalizedCode.length < 5) {
    return normalizedCode.padStart(5, '0');
  }

  return normalizedCode;
}

function toYahooHongKongSymbol(numericCode: string) {
  const normalizedCode = normalizeHongKongCode(numericCode);
  const yahooCode = normalizedCode.length === 5 && normalizedCode.startsWith('0')
    ? normalizedCode.slice(1)
    : normalizedCode;

  return `${yahooCode}.HK`;
}

function getUsSecidPrefix(symbol: string) {
  return US_EXCHANGE_PREFIX[symbol] ?? '105';
}

function getUsSecucodeSuffix(symbol: string) {
  return US_SECUCODE_SUFFIX[symbol] ?? 'O';
}

function isHongKongNumericCode(value: string) {
  return /^\d{4,5}$/.test(value);
}

export function getMarketSymbolMapping(input: SecurityRecord | string): MarketSymbolMapping {
  const symbol = typeof input === 'string' ? normalizeQuery(input) : input.symbol?.trim().toUpperCase();
  const numericCode = typeof input === 'string'
    ? (isHongKongNumericCode(normalizeQuery(input)) ? normalizeHongKongCode(normalizeQuery(input)) : undefined)
    : input.numericCode;

  if (numericCode) {
    const normalizedCode = normalizeHongKongCode(numericCode);

    return {
      symbol,
      numericCode: normalizedCode,
      yahooSymbol: toYahooHongKongSymbol(normalizedCode),
      eastmoneySecid: `116.${normalizedCode}`,
      eastmoneySecucode: `${normalizedCode}.HK`,
    };
  }

  if (!symbol) {
    return {};
  }

  return {
    symbol,
    yahooSymbol: symbol,
    eastmoneySecid: `${getUsSecidPrefix(symbol)}.${symbol}`,
    eastmoneySecucode: `${symbol}.${getUsSecucodeSuffix(symbol)}`,
  };
}

export function getYahooSymbol(input: SecurityRecord | string) {
  return getMarketSymbolMapping(input).yahooSymbol;
}

export function getEastmoneySecid(input: SecurityRecord | string) {
  return getMarketSymbolMapping(input).eastmoneySecid;
}

export function getEastmoneySecucode(input: SecurityRecord | string) {
  return getMarketSymbolMapping(input).eastmoneySecucode;
}
