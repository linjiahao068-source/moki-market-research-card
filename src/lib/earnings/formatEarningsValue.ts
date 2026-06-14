function isValidNumber(value: number | undefined): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function getCurrencySymbol(currency: string) {
  if (currency === 'USD') {
    return '$';
  }

  return `${currency} `;
}

export function formatMoneyCompact(value?: number, currency = 'USD') {
  if (!isValidNumber(value)) {
    return '--';
  }

  const symbol = getCurrencySymbol(currency);
  const absoluteValue = Math.abs(value);
  const prefix = value < 0 ? `-${symbol}` : symbol;

  if (absoluteValue >= 1_000_000_000) {
    return `${prefix}${(absoluteValue / 1_000_000_000).toFixed(2)}B`;
  }

  if (absoluteValue >= 1_000_000) {
    return `${prefix}${(absoluteValue / 1_000_000).toFixed(2)}M`;
  }

  return `${prefix}${absoluteValue.toLocaleString(undefined, {
    maximumFractionDigits: 2,
  })}`;
}

export function formatEps(value?: number) {
  if (!isValidNumber(value)) {
    return '--';
  }

  return `$${value.toFixed(2)}`;
}

export function formatPercent(value?: number) {
  if (!isValidNumber(value)) {
    return '--';
  }

  const prefix = value > 0 ? '+' : '';

  return `${prefix}${value.toFixed(2)}%`;
}

export function formatGuidanceRange(
  low?: number,
  high?: number,
  mid?: number,
  type: 'money' | 'eps' = 'money'
) {
  const formatter = type === 'eps' ? formatEps : formatMoneyCompact;

  if (isValidNumber(low) && isValidNumber(high)) {
    return `${formatter(low)} - ${formatter(high)}`;
  }

  if (isValidNumber(mid)) {
    return formatter(mid);
  }

  return '--';
}
