export type SecPeriodTarget = 'currentQuarter' | 'priorYearSameQuarter';

export interface SecFactUnitValue {
  val?: number | string;
  start?: string;
  end?: string;
  filed?: string;
  fy?: number;
  fp?: string;
  form?: string;
  frame?: string;
  accn?: string;
}

export interface FactSelectionEvidence {
  target: SecPeriodTarget;
  tag?: string;
  unit?: string;
  form?: string;
  fiscalYear?: string;
  fiscalQuarter?: string;
  start?: string;
  end?: string;
  filed?: string;
  frame?: string;
  accessionNumber?: string;
  durationDays?: number;
  periodType: 'duration' | 'instant' | 'unknown';
  quality: 'matched' | 'missing';
  warning?: string;
}

export interface SelectedSecFact {
  value?: number;
  displayValue?: string;
  evidence: FactSelectionEvidence;
}

interface SelectSecFactForPeriodInput {
  usGaapFacts: Record<string, unknown>;
  tags: string[];
  preferredUnits: string[];
  latestFiling: {
    reportDate?: string;
    formType?: string;
  };
  target: SecPeriodTarget;
  metricLabel: string;
}

const QUARTER_MIN_DAYS = 70;
const QUARTER_MAX_DAYS = 110;
const YEAR_MIN_DAYS = 330;
const YEAR_MAX_DAYS = 390;
const PRIOR_YEAR_TOLERANCE_DAYS = 14;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
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

function parseDate(value?: string) {
  if (!value) {
    return undefined;
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  return Number.isNaN(date.getTime()) ? undefined : date;
}

function getDurationDays(value: SecFactUnitValue) {
  const start = parseDate(value.start);
  const end = parseDate(value.end);

  if (!start || !end) {
    return undefined;
  }

  return Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1;
}

function getPeriodType(value: SecFactUnitValue): FactSelectionEvidence['periodType'] {
  if (value.start && value.end) {
    return 'duration';
  }

  if (value.end) {
    return 'instant';
  }

  return 'unknown';
}

function isQuarterDuration(durationDays?: number) {
  return durationDays !== undefined && durationDays >= QUARTER_MIN_DAYS && durationDays <= QUARTER_MAX_DAYS;
}

function isYearDuration(durationDays?: number) {
  return durationDays !== undefined && durationDays >= YEAR_MIN_DAYS && durationDays <= YEAR_MAX_DAYS;
}

function isCloseToDate(value?: string, target?: Date, toleranceDays = 0) {
  const date = parseDate(value);

  if (!date || !target) {
    return false;
  }

  return Math.abs(date.getTime() - target.getTime()) <= toleranceDays * 86_400_000;
}

function getPriorYearDate(reportDate?: string) {
  const date = parseDate(reportDate);

  if (!date) {
    return undefined;
  }

  const priorYearDate = new Date(date);
  priorYearDate.setUTCFullYear(priorYearDate.getUTCFullYear() - 1);

  return priorYearDate;
}

function hasNumericValue(value: SecFactUnitValue) {
  return typeof value.val === 'number' && Number.isFinite(value.val);
}

function isCurrentQuarterCandidate(value: SecFactUnitValue, reportDate?: string, formType?: string) {
  const durationDays = getDurationDays(value);

  if (getPeriodType(value) !== 'duration') {
    return false;
  }

  if (!isCloseToDate(value.end, parseDate(reportDate))) {
    return false;
  }

  if (formType === '10-K') {
    return isYearDuration(durationDays);
  }

  return isQuarterDuration(durationDays);
}

function isPriorYearSameQuarterCandidate(value: SecFactUnitValue, reportDate?: string) {
  const durationDays = getDurationDays(value);
  const fp = value.fp?.toUpperCase();

  if (getPeriodType(value) !== 'duration') {
    return false;
  }

  if (!isQuarterDuration(durationDays)) {
    return false;
  }

  if (fp === 'FY') {
    return false;
  }

  return isCloseToDate(value.end, getPriorYearDate(reportDate), PRIOR_YEAR_TOLERANCE_DAYS);
}

function sortByFiledDate(values: SecFactUnitValue[]) {
  return [...values].sort((left, right) => (right.filed ?? right.end ?? '').localeCompare(left.filed ?? left.end ?? ''));
}

function makeEvidence({
  target,
  tag,
  unit,
  value,
  quality,
  warning,
}: {
  target: SecPeriodTarget;
  tag?: string;
  unit?: string;
  value?: SecFactUnitValue;
  quality: FactSelectionEvidence['quality'];
  warning?: string;
}): FactSelectionEvidence {
  const durationDays = value ? getDurationDays(value) : undefined;

  return {
    target,
    tag,
    unit,
    form: value?.form,
    fiscalYear: value?.fy !== undefined ? String(value.fy) : undefined,
    fiscalQuarter: value?.fp,
    start: value?.start,
    end: value?.end,
    filed: value?.filed,
    frame: value?.frame,
    accessionNumber: value?.accn,
    durationDays,
    periodType: value ? getPeriodType(value) : 'unknown',
    quality,
    warning,
  };
}

function selectCandidate(values: SecFactUnitValue[], target: SecPeriodTarget, reportDate?: string, formType?: string) {
  const candidates = values.filter((value) => {
    if (!hasNumericValue(value)) {
      return false;
    }

    if (target === 'currentQuarter') {
      return isCurrentQuarterCandidate(value, reportDate, formType);
    }

    return isPriorYearSameQuarterCandidate(value, reportDate);
  });

  return sortByFiledDate(candidates)[0];
}

export function selectSecFactForPeriod({
  usGaapFacts,
  tags,
  preferredUnits,
  latestFiling,
  target,
  metricLabel,
}: SelectSecFactForPeriodInput): SelectedSecFact {
  for (const tag of tags) {
    const units = getFactUnits(usGaapFacts, tag);

    if (!units) {
      continue;
    }

    const unitValues = getUnitValues(units, preferredUnits);

    if (!unitValues) {
      continue;
    }

    const selected = selectCandidate(
      unitValues.values,
      target,
      latestFiling.reportDate,
      latestFiling.formType
    );

    if (!selected || typeof selected.val !== 'number') {
      continue;
    }

    return {
      value: selected.val,
      displayValue: `${selected.val} ${unitValues.unit}`,
      evidence: makeEvidence({
        target,
        tag,
        unit: unitValues.unit,
        value: selected,
        quality: 'matched',
      }),
    };
  }

  return {
    value: undefined,
    displayValue: undefined,
    evidence: makeEvidence({
      target,
      quality: 'missing',
      warning: `${metricLabel} ${target} fact not found.`,
    }),
  };
}
