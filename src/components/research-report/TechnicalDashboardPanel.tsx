import {
  Activity,
  AlertTriangle,
  BarChart3,
  Database,
  Gauge,
  Layers,
  LineChart,
  ShieldAlert,
} from 'lucide-react';
import type {
  ResearchReport,
  TechnicalDashboardIndicatorCategory,
  TechnicalDashboardReviewStatus,
  TechnicalDashboardSignal,
  TechnicalDashboardStatus,
  TechnicalDashboardZone,
} from '@/types/research-report';

interface TechnicalDashboardPanelProps {
  report: ResearchReport;
}

const statusLabels: Record<TechnicalDashboardStatus, string> = {
  mock: 'Mock',
  partial_mock: 'Partial Mock',
  blocked: 'Blocked',
};

const statusStyles: Record<TechnicalDashboardStatus, string> = {
  mock: 'border-[var(--brand-border)] bg-[var(--brand-soft)] text-[var(--brand-ink)]',
  partial_mock: 'border-[oklch(0.88_0.045_70)] bg-[oklch(0.98_0.035_80)] text-[oklch(0.39_0.08_60)]',
  blocked: 'border-[var(--risk-border)] bg-[var(--risk-soft)] text-[var(--risk-ink)]',
};

const signalLabels: Record<TechnicalDashboardSignal, string> = {
  constructive: 'Constructive',
  neutral: 'Neutral',
  caution: 'Caution',
  missing: 'Missing',
};

const signalStyles: Record<TechnicalDashboardSignal, string> = {
  constructive: 'border-[var(--brand-border)] bg-[var(--brand-soft)] text-[var(--brand-ink)]',
  neutral: 'border-border bg-white text-[oklch(0.28_0.025_160)]',
  caution: 'border-[var(--risk-border)] bg-[var(--risk-soft)] text-[var(--risk-ink)]',
  missing: 'border-[oklch(0.86_0.015_160)] bg-muted text-[oklch(0.46_0.018_160)]',
};

const reviewLabels: Record<TechnicalDashboardReviewStatus, string> = {
  linked: 'Linked',
  needs_source: 'Needs source',
  requires_review: 'Review',
};

const reviewStyles: Record<TechnicalDashboardReviewStatus, string> = {
  linked: 'border-[var(--brand-border)] bg-[var(--brand-soft)] text-[var(--brand-ink)]',
  needs_source: 'border-[var(--risk-border)] bg-[var(--risk-soft)] text-[var(--risk-ink)]',
  requires_review: 'border-[oklch(0.88_0.045_70)] bg-[oklch(0.98_0.035_80)] text-[oklch(0.39_0.08_60)]',
};

const categoryLabels: Record<TechnicalDashboardIndicatorCategory, string> = {
  price_action: 'Price',
  volume: 'Volume',
  volatility: 'Volatility',
  scenario: 'Scenario',
  monitoring: 'Monitor',
  source_quality: 'Source',
};

const zoneLabels: Record<TechnicalDashboardZone['zoneType'], string> = {
  support: 'Support',
  resistance: 'Resistance',
  range: 'Range',
  watch: 'Watch',
};

function EmptyState({ label }: { label: string }) {
  return (
    <div className="rounded-[8px] border border-border bg-muted px-3 py-2 text-xs text-[oklch(0.48_0.018_160)]">
      {label}
    </div>
  );
}

export function TechnicalDashboardPanel({ report }: TechnicalDashboardPanelProps) {
  const dashboard = report.technicalDashboard;
  const { summary } = dashboard;

  return (
    <div className="space-y-4">
      <div className="rounded-[8px] border border-border bg-white p-4">
        <div className="mb-4 flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="mb-1 flex items-center gap-2 text-sm font-semibold text-[var(--brand-ink)]">
              <LineChart className="h-4 w-4" aria-hidden="true" />
              Technical Dashboard Mock
            </div>
            <h3 className="text-xl font-bold leading-tight text-[oklch(0.16_0.014_160)]">
              {dashboard.title}
            </h3>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${statusStyles[dashboard.status]}`}>
              <Gauge className="h-3.5 w-3.5" aria-hidden="true" />
              {statusLabels[dashboard.status]}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted px-2.5 py-1 font-mono text-xs text-[oklch(0.46_0.018_160)]">
              <Database className="h-3.5 w-3.5" aria-hidden="true" />
              Adapter pending
            </span>
          </div>
        </div>

        <p className="mb-4 rounded-[8px] border border-[var(--brand-border)] bg-[var(--brand-soft)] p-3 text-sm leading-relaxed text-[var(--brand-ink)]">
          {dashboard.headline}
        </p>

        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-[8px] border border-border bg-[oklch(0.992_0.005_85)] p-3">
            <div className="mb-1 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-normal text-[oklch(0.48_0.018_160)]">
              <Activity className="h-3.5 w-3.5" aria-hidden="true" />
              Indicators
            </div>
            <div className="font-mono text-xl font-semibold text-[oklch(0.18_0.014_160)]">
              {dashboard.indicators.length}
            </div>
          </div>
          <div className="rounded-[8px] border border-border bg-[oklch(0.992_0.005_85)] p-3">
            <div className="mb-1 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-normal text-[oklch(0.48_0.018_160)]">
              <Layers className="h-3.5 w-3.5" aria-hidden="true" />
              Zones
            </div>
            <div className="font-mono text-xl font-semibold text-[oklch(0.18_0.014_160)]">
              {dashboard.zones.length}
            </div>
          </div>
          <div className="rounded-[8px] border border-border bg-[oklch(0.992_0.005_85)] p-3">
            <div className="mb-1 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-normal text-[oklch(0.48_0.018_160)]">
              <BarChart3 className="h-3.5 w-3.5" aria-hidden="true" />
              Linked
            </div>
            <div className="font-mono text-xl font-semibold text-[oklch(0.18_0.014_160)]">
              {summary.linkedEvidenceCount}
            </div>
          </div>
          <div className="rounded-[8px] border border-border bg-[oklch(0.992_0.005_85)] p-3">
            <div className="mb-1 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-normal text-[oklch(0.48_0.018_160)]">
              <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
              Gaps
            </div>
            <div className="font-mono text-xl font-semibold text-[oklch(0.18_0.014_160)]">
              {summary.missingReferenceCount + summary.warningCount}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.42fr)]">
        <section className="rounded-[8px] border border-border bg-white p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-[oklch(0.18_0.014_160)]">
            <Activity className="h-4 w-4" aria-hidden="true" />
            Indicator Matrix
          </div>
          <div className="grid gap-2 md:grid-cols-2">
            {dashboard.indicators.map((indicator) => (
              <article key={indicator.id} className="rounded-[8px] border border-border bg-[oklch(0.992_0.005_85)] p-3">
                <div className="mb-2 flex min-w-0 flex-wrap items-center gap-2">
                  <span className="min-w-0 text-sm font-semibold text-[oklch(0.18_0.014_160)]">
                    {indicator.label}
                  </span>
                  <span className="rounded-full border border-border bg-white px-2 py-0.5 text-[10px] font-semibold text-[oklch(0.44_0.018_160)]">
                    {categoryLabels[indicator.category]}
                  </span>
                  <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${signalStyles[indicator.signal]}`}>
                    {signalLabels[indicator.signal]}
                  </span>
                </div>
                <div className="mb-1 text-xs font-medium text-[var(--brand-ink)]">
                  {indicator.valueLabel}
                </div>
                <p className="mb-2 text-xs leading-relaxed text-[oklch(0.45_0.018_160)]">
                  {indicator.note}
                </p>
                <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold ${reviewStyles[indicator.reviewStatus]}`}>
                  {reviewLabels[indicator.reviewStatus]}
                </span>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-[8px] border border-border bg-white p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-[oklch(0.18_0.014_160)]">
            <Layers className="h-4 w-4" aria-hidden="true" />
            Key Zones
          </div>
          <div className="space-y-2">
            {dashboard.zones.length > 0 ? (
              dashboard.zones.map((zone) => (
                <div key={zone.id} className="rounded-[8px] border border-border bg-muted p-3">
                  <div className="mb-1 flex min-w-0 flex-wrap items-center gap-2">
                    <span className="min-w-0 text-sm font-semibold text-[oklch(0.2_0.016_160)]">
                      {zone.label}
                    </span>
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${signalStyles[zone.signal]}`}>
                      {zoneLabels[zone.zoneType]}
                    </span>
                  </div>
                  <div className="text-xs leading-relaxed text-[oklch(0.45_0.018_160)]">
                    {zone.level}
                  </div>
                </div>
              ))
            ) : (
              <EmptyState label="Technical zones pending adapter input" />
            )}
          </div>
        </section>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.42fr)]">
        <section className="rounded-[8px] border border-border bg-white p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-[oklch(0.18_0.014_160)]">
            <BarChart3 className="h-4 w-4" aria-hidden="true" />
            Scenario Read-through
          </div>
          <div className="grid gap-2 md:grid-cols-3">
            {dashboard.scenarioReadThrough.map((scenario) => (
              <article key={scenario.id} className={`rounded-[8px] border p-3 ${signalStyles[scenario.signal]}`}>
                <div className="mb-2 text-sm font-semibold">{scenario.label}</div>
                <div className="space-y-1">
                  {scenario.watchItems.slice(0, 3).map((item) => (
                    <div key={item} className="text-xs leading-relaxed">
                      {item}
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-[8px] border border-border bg-white p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-[oklch(0.18_0.014_160)]">
            <ShieldAlert className="h-4 w-4" aria-hidden="true" />
            Data Readiness
          </div>
          <div className="space-y-2">
            <div className="rounded-[8px] border border-border bg-muted p-3">
              <div className="mb-1 text-xs font-semibold text-[oklch(0.44_0.018_160)]">Mode</div>
              <div className="font-mono text-xs text-[oklch(0.2_0.016_160)]">{dashboard.mode}</div>
            </div>
            <div className="rounded-[8px] border border-border bg-muted p-3">
              <div className="mb-1 text-xs font-semibold text-[oklch(0.44_0.018_160)]">Adapter</div>
              <div className="font-mono text-xs text-[oklch(0.2_0.016_160)]">
                {summary.adapterReady ? 'ready' : 'pending'}
              </div>
            </div>
            {dashboard.warnings.length > 0 && (
              <div className="rounded-[8px] border border-[var(--risk-border)] bg-[var(--risk-soft)] p-3">
                <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-[var(--risk-ink)]">
                  <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
                  Review Notes
                </div>
                <div className="space-y-1">
                  {dashboard.warnings.slice(0, 4).map((warning) => (
                    <div key={warning} className="text-xs leading-relaxed text-[var(--risk-ink)]">
                      {warning}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
