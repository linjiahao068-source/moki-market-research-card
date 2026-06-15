import { GlobalDataSource } from '@/types/global-stock-data';
import { SecurityRecord } from '@/types/security';
import { serverFetchJson } from './http';
import { getMarketSymbolMapping } from './marketSymbol';

const EASTMONEY_DATACENTER_URL = 'https://datacenter-web.eastmoney.com/api/data/v1/get';
const EASTMONEY_USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36';

interface EastmoneyIndicatorRow {
  REPORT_DATE?: string;
  REPORT?: string;
  REPORT_TYPE?: string;
  SECURITY_NAME_ABBR?: string;
  OPERATE_INCOME?: number | string;
  OPERATE_INCOME_YOY?: number | string;
  BASIC_EPS?: number | string;
  BASIC_EPS_YOY?: number | string;
  DILUTED_EPS?: number | string;
  ROE_AVG?: number | string;
  ROA?: number | string;
  GROSS_PROFIT_RATIO?: number | string;
  DEBT_ASSET_RATIO?: number | string;
  [key: string]: unknown;
}

interface EastmoneyDatacenterResponse {
  result?: {
    data?: EastmoneyIndicatorRow[];
  };
}

export interface GlobalKeyIndicator {
  symbol?: string;
  companyName?: string;
  market?: string;
  fiscalYear?: string;
  fiscalQuarter?: string;
  reportDate?: string;
  reportType?: string;
  revenue?: number;
  revenueYoyPct?: number;
  basicEps?: number;
  dilutedEps?: number;
  epsYoyPct?: number;
  roeAvgPct?: number;
  roaPct?: number;
  grossMarginPct?: number;
  debtAssetRatioPct?: number;
  source: GlobalDataSource;
  sourceLabel: string;
  raw?: unknown;
  warnings: string[];
}

function getNumber(value: number | string | undefined) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const numericValue = Number(value.replace(/,/g, ''));

    if (Number.isFinite(numericValue)) {
      return numericValue;
    }
  }

  return undefined;
}

function getFiscalYear(row: EastmoneyIndicatorRow) {
  const reportYear = row.REPORT?.match(/20\d{2}/)?.[0];

  return reportYear ?? row.REPORT_DATE?.slice(0, 4);
}

function getFiscalQuarter(row: EastmoneyIndicatorRow) {
  const report = `${row.REPORT ?? ''} ${row.REPORT_TYPE ?? ''}`;

  if (/Q[1-4]/i.test(report)) {
    return report.match(/Q[1-4]/i)?.[0].toUpperCase();
  }

  if (/一季/.test(report)) {
    return 'Q1';
  }

  if (/二季|半年/.test(report)) {
    return 'Q2';
  }

  if (/三季/.test(report)) {
    return 'Q3';
  }

  if (/四季|年报/.test(report)) {
    return 'Q4';
  }

  return undefined;
}

function isExplicitQuarter(row: EastmoneyIndicatorRow) {
  const reportText = `${row.REPORT ?? ''} ${row.REPORT_TYPE ?? ''}`;

  return /Q[1-4]|一季|二季|三季|四季|单季|季度/i.test(reportText) && !/TTM|年度|年报|全年/i.test(reportText);
}

function normalizeSecucode(input: SecurityRecord | string) {
  const mapping = getMarketSymbolMapping(input);

  return mapping.eastmoneySecucode ?? (typeof input === 'string' ? input.trim().toUpperCase() : input.symbol ?? input.numericCode ?? '');
}

function detectMarket(secucode: string) {
  return secucode.endsWith('.HK') ? 'HK' : 'US';
}

function buildUrl(secucode: string, pageSize: number) {
  const market = secucode.endsWith('.HK') ? 'HK' : 'US';
  const url = new URL(EASTMONEY_DATACENTER_URL);

  url.searchParams.set('reportName', `RPT_${market}F10_FN_GMAININDICATOR`);
  url.searchParams.set('columns', 'ALL');
  url.searchParams.set('filter', `(SECUCODE="${secucode}")`);
  url.searchParams.set('pageNumber', '1');
  url.searchParams.set('pageSize', String(pageSize));
  url.searchParams.set('sortColumns', 'REPORT_DATE');
  url.searchParams.set('sortTypes', '-1');
  url.searchParams.set('source', 'WEB');
  url.searchParams.set('client', 'WEB');

  return url.toString();
}

function mapIndicatorRow(secucode: string, row: EastmoneyIndicatorRow): GlobalKeyIndicator {
  const warnings: string[] = [];
  const explicitQuarter = isExplicitQuarter(row);

  if (!explicitQuarter) {
    warnings.push('Eastmoney GMAININDICATOR may be annual, cumulative, or TTM; do not treat EPS as single-quarter EPS without source review.');
  }

  if (getNumber(row.BASIC_EPS) === undefined && getNumber(row.DILUTED_EPS) === undefined) {
    warnings.push('Eastmoney GMAININDICATOR EPS field was not found.');
  }

  return {
    symbol: secucode,
    companyName: row.SECURITY_NAME_ABBR,
    market: detectMarket(secucode),
    fiscalYear: getFiscalYear(row),
    fiscalQuarter: explicitQuarter ? getFiscalQuarter(row) : undefined,
    reportDate: row.REPORT_DATE,
    reportType: row.REPORT_TYPE ?? row.REPORT,
    revenue: getNumber(row.OPERATE_INCOME),
    revenueYoyPct: getNumber(row.OPERATE_INCOME_YOY),
    basicEps: getNumber(row.BASIC_EPS),
    dilutedEps: getNumber(row.DILUTED_EPS),
    epsYoyPct: getNumber(row.BASIC_EPS_YOY),
    roeAvgPct: getNumber(row.ROE_AVG),
    roaPct: getNumber(row.ROA),
    grossMarginPct: getNumber(row.GROSS_PROFIT_RATIO),
    debtAssetRatioPct: getNumber(row.DEBT_ASSET_RATIO),
    source: 'eastmoney',
    sourceLabel: 'Eastmoney GMAININDICATOR',
    raw: row,
    warnings,
  };
}

export async function fetchEastmoneyKeyIndicators(
  input: SecurityRecord | string,
  pageSize = 4
): Promise<GlobalKeyIndicator[]> {
  const secucode = normalizeSecucode(input);

  if (!secucode) {
    return [
      {
        source: 'eastmoney',
        sourceLabel: 'Eastmoney GMAININDICATOR',
        warnings: ['Eastmoney secucode could not be resolved.'],
      },
    ];
  }

  const response = await serverFetchJson<EastmoneyDatacenterResponse>(buildUrl(secucode, pageSize), {
    headers: {
      'User-Agent': EASTMONEY_USER_AGENT,
      Accept: 'application/json',
    },
    timeoutMs: 15_000,
  });

  if (!response.ok) {
    return [
      {
        symbol: secucode,
        source: 'eastmoney',
        sourceLabel: 'Eastmoney GMAININDICATOR',
        warnings: [`Eastmoney GMAININDICATOR request failed: ${response.error}`],
      },
    ];
  }

  const rows = response.data.result?.data ?? [];

  if (rows.length === 0) {
    return [
      {
        symbol: secucode,
        source: 'eastmoney',
        sourceLabel: 'Eastmoney GMAININDICATOR',
        warnings: ['Eastmoney GMAININDICATOR returned no rows.'],
      },
    ];
  }

  return rows.map((row) => mapIndicatorRow(secucode, row));
}
