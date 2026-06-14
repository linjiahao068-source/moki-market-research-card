function isValidNumber(value: number | undefined): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

export function safePctChange(current?: number, base?: number): number | undefined {
  if (!isValidNumber(current) || !isValidNumber(base)) {
    return undefined;
  }

  if (base === 0) {
    return undefined;
  }

  return ((current - base) / Math.abs(base)) * 100;
}

export function calcSurprise(actual?: number, estimate?: number): {
  surpriseAbs?: number;
  surprisePct?: number;
} {
  if (!isValidNumber(actual) || !isValidNumber(estimate)) {
    return {};
  }

  return {
    surpriseAbs: actual - estimate,
    surprisePct: safePctChange(actual, estimate),
  };
}

export function calcGuidanceMid(low?: number, high?: number, singleValue?: number): number | undefined {
  if (isValidNumber(low) && isValidNumber(high)) {
    return (low + high) / 2;
  }

  if (isValidNumber(singleValue)) {
    return singleValue;
  }

  return undefined;
}

export function calcGuidanceGap(guidanceMid?: number, consensus?: number): {
  gapAbs?: number;
  gapPct?: number;
} {
  if (!isValidNumber(guidanceMid) || !isValidNumber(consensus)) {
    return {};
  }

  return {
    gapAbs: guidanceMid - consensus,
    gapPct: safePctChange(guidanceMid, consensus),
  };
}
