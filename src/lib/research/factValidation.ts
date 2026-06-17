import type { DataFreshnessLevel, FactUnit } from '@/types/evidence';

export function clampConfidence(value: number | undefined, fallback = 0.5) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return fallback;
  }

  return Math.max(0, Math.min(1, value));
}

export function createStableId(parts: Array<string | number | boolean | undefined | null>) {
  return parts
    .filter((part) => part !== undefined && part !== null && part !== '')
    .map((part) => String(part).trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''))
    .filter(Boolean)
    .join('-')
    .slice(0, 160);
}

export function compactText(text: string | undefined, maxLength = 420) {
  if (!text) {
    return undefined;
  }

  const normalized = text.replace(/\s+/g, ' ').trim();

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength - 1).trim()}...`;
}

export function parseNumericString(value?: string) {
  if (!value) {
    return undefined;
  }

  const normalized = value.replace(/[$,%\s]/g, '').replace(/,/g, '');
  const parsed = Number(normalized);

  return Number.isFinite(parsed) ? parsed : undefined;
}

export function inferMetricUnit(label: string, fallback: FactUnit = 'unknown'): FactUnit {
  const normalized = label.toLowerCase();

  if (normalized.includes('eps') || normalized.includes('per share')) {
    return 'perShare';
  }

  if (normalized.includes('margin') || normalized.includes('rate') || normalized.includes('growth') || normalized.includes('return')) {
    return 'percent';
  }

  if (normalized.includes('pe') || normalized.includes('multiple') || normalized.includes('ratio')) {
    return 'ratio';
  }

  if (
    normalized.includes('revenue') ||
    normalized.includes('income') ||
    normalized.includes('cash') ||
    normalized.includes('debt') ||
    normalized.includes('asset') ||
    normalized.includes('price')
  ) {
    return 'USD';
  }

  return fallback;
}

export function uniqueById<T extends { id: string }>(items: T[]) {
  const byId = new Map<string, T>();

  for (const item of items) {
    if (!byId.has(item.id)) {
      byId.set(item.id, item);
    }
  }

  return Array.from(byId.values());
}

export function inferFreshness(dates: Array<string | undefined>): DataFreshnessLevel {
  const timestamps = dates
    .map((date) => (date ? Date.parse(date) : NaN))
    .filter((timestamp) => Number.isFinite(timestamp));

  if (timestamps.length === 0) {
    return 'unknown';
  }

  const latest = Math.max(...timestamps);
  const daysOld = (Date.now() - latest) / (1000 * 60 * 60 * 24);

  return daysOld <= 120 ? 'fresh' : 'stale';
}
