import { DataProviderName } from '@/types/basic-data';

interface DataSourceBadgeProps {
  provider: DataProviderName;
}

const providerLabels: Record<DataProviderName, string> = {
  'sec-edgar': 'SEC EDGAR',
  fmp: 'FMP',
  mock: 'Mock fallback',
};

export function DataSourceBadge({ provider }: DataSourceBadgeProps) {
  return (
    <span className="inline-flex w-fit items-center rounded-full border border-[var(--brand-border)] bg-[var(--brand-soft)] px-3 py-1 text-xs font-semibold text-[var(--brand-ink)]">
      {providerLabels[provider]}
    </span>
  );
}
