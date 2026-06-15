import { GlobalQuarterFinancial } from '@/types/global-stock-data';
import { SecurityRecord } from '@/types/security';
import { serverFetchJson } from './http';
import { getMarketSymbolMapping } from './marketSymbol';

const EASTMONEY_DATACENTER_URL = 'https://datacenter-web.eastmoney.com/api/data/v1/get';
const EASTMONEY_USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36';

type StatementType = 'balance' | 'income' | 'cashflow';
type EastmoneyMarket = 'us' | 'hk';

type EastmoneyRow = Record<string, unknown>;

interface EastmoneyDatacenterResponse {
  result?: {
    data?: EastmoneyRow[];
  };
}

interface StatementFetchResult {
  rows: EastmoneyRow[];
  warning?: string;
}

const reportNames: Record<StatementType, Record<EastmoneyMarket, string>> = {
  balance: {
    us: 'RPT_USF10_FN_BALANCE',
    hk: 'RPT_HKF10_FN_BALANCE',
  },
  income: {
    us: 'RPT_USF10_FN_INCOME',
    hk: 'RPT_HKF10_FN_INCOME',
  },
  cashflow: {
    us: 'RPT_USSK_FN_CASHFLOW',
    hk: 'RPT_HKSK_FN_CASHFLOW',
  },
};

const fieldNameMap = {
  revenue: ['营业收入', '营业总收入', '总收入', '收入', 'Revenue', 'Total Revenue', 'OPERATE_INCOME'],
  netIncome: ['净利润', '归属于母公司股东的净利润', '归母净利润', '股东应占溢利', '本公司拥有人应占溢利', 'Net Income', 'PARENT_HOLDER_NETPROFIT'],
  dilutedEps: ['稀释每股收益', '摊薄每股收益', 'Diluted EPS', 'DILUTED_EPS'],
};

function getString(row: EastmoneyRow, keys: string[]) {
  for (const key of keys) {
    const value = row[key];

    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }

  return undefined;
}

function getNumber(row: EastmoneyRow, keys: string[]) {
  for (const key of keys) {
    const value = row[key];

    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === 'string') {
      const numericValue = Number(value.replace(/,/g, ''));

      if (Number.isFinite(numericValue)) {
        return numericValue;
      }
    }
  }

  return undefined;
}

function getItemName(row: EastmoneyRow) {
  return getString(row, ['ITEM_NAME', 'STD_ITEM_NAME', 'STD_ITEM_CODE', 'REPORT_ITEM_NAME']);
}

function getAmount(row: EastmoneyRow) {
  return getNumber(row, ['AMOUNT', 'REPORT_AMOUNT', 'VALUE']);
}

function detectMarket(secucode: string): EastmoneyMarket {
  return secucode.endsWith('.HK') ? 'hk' : 'us';
}

function normalizeSecucode(input: SecurityRecord | string) {
  const mapping = getMarketSymbolMapping(input);

  return mapping.eastmoneySecucode ?? (typeof input === 'string' ? input.trim().toUpperCase() : input.symbol ?? input.numericCode ?? '');
}

function buildDatacenterUrl(reportName: string, secucode: string, pageSize: number) {
  const url = new URL(EASTMONEY_DATACENTER_URL);

  url.searchParams.set('reportName', reportName);
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

async function fetchStatement(secucode: string, statement: StatementType): Promise<StatementFetchResult> {
  const market = detectMarket(secucode);
  const reportName = reportNames[statement][market];
  const response = await serverFetchJson<EastmoneyDatacenterResponse>(buildDatacenterUrl(reportName, secucode, 200), {
    headers: {
      'User-Agent': EASTMONEY_USER_AGENT,
      Accept: 'application/json',
    },
    timeoutMs: 15_000,
  });

  if (!response.ok) {
    return {
      rows: [],
      warning: `Eastmoney ${statement} statement request failed: ${response.error}`,
    };
  }

  return {
    rows: response.data.result?.data ?? [],
  };
}

function getReportKey(row: EastmoneyRow) {
  return getString(row, ['REPORT_DATE', 'REPORT', 'REPORT_TYPE']) ?? 'unknown-report';
}

function isQuarterOnlyReport(rows: EastmoneyRow[]) {
  const sample = rows[0] ?? {};
  const reportType = getString(sample, ['REPORT_TYPE', 'REPORT']) ?? '';
  const report = getString(sample, ['REPORT']) ?? '';

  if (/累计|年初至|中报|三季报|年报|FY/i.test(reportType)) {
    return false;
  }

  if (/单季|单季度|季度/i.test(reportType)) {
    return true;
  }

  return /Q1/i.test(report) || /一季报/.test(reportType);
}

function getFiscalQuarter(row: EastmoneyRow) {
  const report = getString(row, ['REPORT', 'REPORT_TYPE']) ?? '';

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

function getFiscalYear(row: EastmoneyRow) {
  const reportDate = getString(row, ['REPORT_DATE']);
  const report = getString(row, ['REPORT']);
  const yearMatch = report?.match(/20\d{2}/)?.[0];

  return yearMatch ?? reportDate?.slice(0, 4);
}

function findMappedAmount(rows: EastmoneyRow[], aliases: string[]) {
  const match = rows.find((row) => {
    const itemName = getItemName(row);

    return itemName ? aliases.some((alias) => itemName === alias || itemName.includes(alias)) : false;
  });

  return match ? getAmount(match) : undefined;
}

function buildQuarterFinancial({
  secucode,
  rows,
  statementWarnings,
}: {
  secucode: string;
  rows: EastmoneyRow[];
  statementWarnings: string[];
}): GlobalQuarterFinancial {
  const sample = rows[0] ?? {};
  const warnings = [...statementWarnings];
  const revenue = findMappedAmount(rows, fieldNameMap.revenue);
  const netIncome = findMappedAmount(rows, fieldNameMap.netIncome);
  const dilutedEps = findMappedAmount(rows, fieldNameMap.dilutedEps);

  if (revenue === undefined) {
    warnings.push('Eastmoney income statement revenue field was not found.');
  }

  if (netIncome === undefined) {
    warnings.push('Eastmoney income statement net income field was not found.');
  }

  if (dilutedEps === undefined) {
    warnings.push('Eastmoney income statement diluted EPS field was not found.');
  }

  return {
    symbol: secucode,
    companyName: getString(sample, ['SECURITY_NAME_ABBR', 'SECURITY_NAME']) ?? secucode,
    market: detectMarket(secucode) === 'hk' ? 'HK' : 'US',
    fiscalYear: getFiscalYear(sample),
    fiscalQuarter: getFiscalQuarter(sample),
    periodEnd: getString(sample, ['REPORT_DATE']),
    reportDate: getString(sample, ['REPORT_DATE']),
    revenue,
    netIncome,
    dilutedEps,
    currency: getString(sample, ['CURRENCY']),
    source: 'eastmoney',
    sourceLabel: 'Eastmoney datacenter income statement',
    raw: rows,
    warnings,
  };
}

export async function fetchEastmoneyQuarterFinancials(input: SecurityRecord | string): Promise<GlobalQuarterFinancial[]> {
  const secucode = normalizeSecucode(input);

  if (!secucode) {
    return [
      {
        source: 'eastmoney',
        sourceLabel: 'Eastmoney datacenter',
        warnings: ['Eastmoney secucode could not be resolved.'],
      },
    ];
  }

  const [incomeResult, balanceResult, cashflowResult] = await Promise.all([
    fetchStatement(secucode, 'income'),
    fetchStatement(secucode, 'balance'),
    fetchStatement(secucode, 'cashflow'),
  ]);
  const statementWarnings = [balanceResult.warning, cashflowResult.warning].filter(Boolean) as string[];

  if (incomeResult.warning) {
    return [
      {
        symbol: secucode,
        source: 'eastmoney',
        sourceLabel: 'Eastmoney datacenter income statement',
        warnings: [incomeResult.warning, ...statementWarnings],
      },
    ];
  }

  if (incomeResult.rows.length === 0) {
    return [
      {
        symbol: secucode,
        source: 'eastmoney',
        sourceLabel: 'Eastmoney datacenter income statement',
        warnings: ['Eastmoney income statement returned no rows.', ...statementWarnings],
      },
    ];
  }

  const groupedRows = new Map<string, EastmoneyRow[]>();

  incomeResult.rows.forEach((row) => {
    const key = getReportKey(row);
    const group = groupedRows.get(key) ?? [];
    group.push(row);
    groupedRows.set(key, group);
  });

  const quarterGroups = Array.from(groupedRows.values()).filter(isQuarterOnlyReport);

  if (quarterGroups.length === 0) {
    return [
      {
        symbol: secucode,
        source: 'eastmoney',
        sourceLabel: 'Eastmoney datacenter income statement',
        raw: incomeResult.rows,
        warnings: [
          'No quarter-only income statement group was identified. YTD or annual data was not used as a single-quarter value.',
          ...statementWarnings,
        ],
      },
    ];
  }

  return quarterGroups.map((rows) => buildQuarterFinancial({ secucode, rows, statementWarnings }));
}
