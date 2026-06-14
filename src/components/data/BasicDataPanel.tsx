import { ExternalLink } from 'lucide-react';
import { BasicCompanyData } from '@/types/basic-data';
import { getMarketLabel } from '@/lib/security/formatSecurityDisplay';
import { DataCoverageNotice } from './DataCoverageNotice';
import { DataSourceBadge } from './DataSourceBadge';

interface BasicDataPanelProps {
  data: BasicCompanyData;
}

function formatMaybeMoney(value?: string) {
  if (!value) {
    return '--';
  }

  const numericValue = Number(value.replace(/[^0-9.-]/g, ''));

  if (!Number.isFinite(numericValue)) {
    return value;
  }

  const absoluteValue = Math.abs(numericValue);
  const prefix = numericValue < 0 ? '-$' : '$';

  if (absoluteValue >= 1_000_000_000) {
    return `${prefix}${(absoluteValue / 1_000_000_000).toFixed(2)}B`;
  }

  if (absoluteValue >= 1_000_000) {
    return `${prefix}${(absoluteValue / 1_000_000).toFixed(2)}M`;
  }

  return `${prefix}${absoluteValue.toLocaleString()}`;
}

function valueOrDash(value?: string) {
  return value || '--';
}

function DataRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className="rounded-[8px] border border-border bg-white p-3">
      <div className="mb-1 text-[11px] font-semibold text-[oklch(0.5_0.018_160)]">{label}</div>
      <div className="text-sm font-semibold leading-relaxed text-[oklch(0.18_0.014_160)]">{valueOrDash(value)}</div>
    </div>
  );
}

export function BasicDataPanel({ data }: BasicDataPanelProps) {
  const latestFiling = data.latestFiling;
  const financials = data.financials ?? {};
  const security = data.security;

  return (
    <section className="rounded-[8px] border border-border bg-[oklch(0.992_0.005_85)] p-4 sm:p-5">
      <div className="mb-4 flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <DataSourceBadge provider={data.provider} />
            <span className="rounded-full border border-border bg-white px-2.5 py-1 font-mono text-xs text-[oklch(0.45_0.018_160)]">
              {valueOrDash(data.fetchedAt)}
            </span>
          </div>
          <h3 className="text-xl font-bold leading-tight text-[oklch(0.16_0.014_160)]">
            基础数据面板
          </h3>
          <p className="mt-2 text-xs leading-relaxed text-[oklch(0.48_0.018_160)]">
            仅展示基础数据覆盖情况，不代表数据完整准确，也不构成投资建议。
          </p>
        </div>
        <DataCoverageNotice coverageStatus={data.coverageStatus} />
      </div>

      <div className="mb-4 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <DataRow label="公司名称" value={data.profile?.companyName ?? security.companyName} />
        <DataRow label="市场" value={getMarketLabel(security.market)} />
        <DataRow label="Symbol" value={security.symbol} />
        <DataRow label="数字代码" value={security.numericCode} />
      </div>

      <div className="mb-4 rounded-[8px] border border-border bg-white p-3">
        <div className="mb-2 text-xs font-semibold text-[oklch(0.45_0.018_160)]">最近 filing</div>
        <div className="grid gap-3 text-sm md:grid-cols-4">
          <div>类型：{valueOrDash(latestFiling?.formType)}</div>
          <div>日期：{valueOrDash(latestFiling?.filingDate)}</div>
          <div>期间：{valueOrDash(latestFiling?.fiscalPeriod)}</div>
          <div>Accession：{valueOrDash(latestFiling?.accessionNumber)}</div>
        </div>
      </div>

      <div className="mb-4 grid gap-3 md:grid-cols-2 lg:grid-cols-5">
        <DataRow label="Revenue" value={formatMaybeMoney(financials.revenue)} />
        <DataRow label="Net income" value={formatMaybeMoney(financials.netIncome)} />
        <DataRow label="Assets" value={formatMaybeMoney(financials.assets)} />
        <DataRow label="Cash" value={formatMaybeMoney(financials.cashAndEquivalents)} />
        <DataRow label="Quote" value={data.quote?.price ? formatMaybeMoney(data.quote.price) : '--'} />
      </div>

      {data.warnings.length > 0 && (
        <div className="mb-4 rounded-[8px] border border-[var(--brand-border)] bg-[var(--brand-soft)] p-3 text-sm leading-relaxed text-[var(--brand-ink)]">
          <div className="mb-2 text-xs font-semibold">数据提示</div>
          <ul className="space-y-1">
            {data.warnings.map((warning) => (
              <li key={warning}>- {warning}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="rounded-[8px] border border-border bg-white p-3">
        <div className="mb-2 text-xs font-semibold text-[oklch(0.45_0.018_160)]">来源链接</div>
        {data.sourceLinks.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {data.sourceLinks.map((source) => (
              <a
                key={`${source.label}-${source.url}`}
                href={source.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted px-2.5 py-1 text-xs font-medium text-[oklch(0.35_0.018_160)] transition-colors hover:bg-[var(--brand-soft)] hover:text-[var(--brand-ink)]"
              >
                {source.label}
                <ExternalLink className="h-3 w-3" aria-hidden="true" />
              </a>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[oklch(0.48_0.018_160)]">--</p>
        )}
      </div>
    </section>
  );
}
