import { BasicCompanyData } from '@/types/basic-data';
import { SecCompanyFacts } from './secCompanyFactsClient';

type Financials = NonNullable<BasicCompanyData['financials']>;

interface SecFactUnitValue {
  val?: number | string;
  end?: string;
  filed?: string;
  fy?: number;
  fp?: string;
  form?: string;
}

interface ParsedFact {
  value: string;
  period?: string;
  fiscalYear?: string;
}

const FACT_TAGS = {
  revenue: ['RevenueFromContractWithCustomerExcludingAssessedTax', 'Revenues'],
  netIncome: ['NetIncomeLoss'],
  assets: ['Assets'],
  liabilities: ['Liabilities'],
  cashAndEquivalents: ['CashAndCashEquivalentsAtCarryingValue'],
  operatingIncome: ['OperatingIncomeLoss'],
  eps: ['EarningsPerShareDiluted'],
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function getUsGaapFacts(companyFacts: SecCompanyFacts) {
  const facts = companyFacts.facts;

  if (!isRecord(facts)) {
    return undefined;
  }

  const usGaap = facts['us-gaap'];

  return isRecord(usGaap) ? usGaap : undefined;
}

function getFactUnits(usGaapFacts: Record<string, unknown>, tag: string) {
  const fact = usGaapFacts[tag];

  if (!isRecord(fact) || !isRecord(fact.units)) {
    return undefined;
  }

  return fact.units;
}

function getUnitValues(units: Record<string, unknown>, preferredUnits: string[]) {
  for (const unit of preferredUnits) {
    const values = units[unit];

    if (Array.isArray(values)) {
      return {
        unit,
        values: values.filter(isRecord) as SecFactUnitValue[],
      };
    }
  }

  return undefined;
}

function getComparableDate(value: SecFactUnitValue) {
  return value.filed ?? value.end ?? '';
}

function pickLatest(values: SecFactUnitValue[]) {
  return values
    .filter((value) => value.val !== undefined)
    .sort((left, right) => getComparableDate(right).localeCompare(getComparableDate(left)))[0];
}

function formatFact(value: SecFactUnitValue, unit: string): ParsedFact {
  return {
    value: `${value.val} ${unit}`,
    period: value.fp ?? value.end,
    fiscalYear: value.fy !== undefined ? String(value.fy) : undefined,
  };
}

function pickFact(
  usGaapFacts: Record<string, unknown>,
  tags: string[],
  preferredUnits: string[],
  label: string,
  warnings: string[]
): ParsedFact | undefined {
  for (const tag of tags) {
    const units = getFactUnits(usGaapFacts, tag);

    if (!units) {
      continue;
    }

    const unitValues = getUnitValues(units, preferredUnits);

    if (!unitValues) {
      warnings.push(`${label} exists but no supported unit was found.`);
      continue;
    }

    const latest = pickLatest(unitValues.values);

    if (!latest) {
      warnings.push(`${label} exists but no usable value was found.`);
      continue;
    }

    return formatFact(latest, unitValues.unit);
  }

  warnings.push(`${label} not found in SEC companyfacts.`);
  return undefined;
}

export function parseSecCompanyFacts(companyFacts: SecCompanyFacts): {
  financials: Financials;
  warnings: string[];
} {
  const warnings: string[] = [];
  const financials: Financials = {};
  const usGaapFacts = getUsGaapFacts(companyFacts);

  if (!usGaapFacts) {
    return {
      financials,
      warnings: ['SEC companyfacts missing facts.us-gaap.'],
    };
  }

  const revenue = pickFact(usGaapFacts, FACT_TAGS.revenue, ['USD'], 'Revenue', warnings);
  const netIncome = pickFact(usGaapFacts, FACT_TAGS.netIncome, ['USD'], 'Net Income', warnings);
  const assets = pickFact(usGaapFacts, FACT_TAGS.assets, ['USD'], 'Assets', warnings);
  const liabilities = pickFact(usGaapFacts, FACT_TAGS.liabilities, ['USD'], 'Liabilities', warnings);
  const cash = pickFact(usGaapFacts, FACT_TAGS.cashAndEquivalents, ['USD'], 'Cash', warnings);
  const operatingIncome = pickFact(usGaapFacts, FACT_TAGS.operatingIncome, ['USD'], 'Operating Income', warnings);
  const eps = pickFact(usGaapFacts, FACT_TAGS.eps, ['USD/shares', 'USD/shares (Diluted)', 'USD / shares'], 'Diluted EPS', warnings);

  if (revenue) {
    financials.revenue = revenue.value;
    financials.period = revenue.period;
    financials.fiscalYear = revenue.fiscalYear;
  }

  if (netIncome) {
    financials.netIncome = netIncome.value;
  }

  if (assets) {
    financials.assets = assets.value;
  }

  if (liabilities) {
    financials.liabilities = liabilities.value;
  }

  if (cash) {
    financials.cashAndEquivalents = cash.value;
  }

  if (operatingIncome) {
    financials.operatingIncome = operatingIncome.value;
  }

  if (eps) {
    financials.eps = eps.value;
  } else {
    warnings.push('Diluted EPS skipped when no supported per-share unit is available.');
  }

  return {
    financials,
    warnings,
  };
}
