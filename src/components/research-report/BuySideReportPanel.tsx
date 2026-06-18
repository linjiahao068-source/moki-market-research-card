import {
  AlertTriangle,
  BarChart3,
  FileSearch,
  Link2,
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import type {
  BuySideReportBias,
  BuySideReportGenerationStatus,
  BuySideReportReviewStatus,
  ResearchReport,
} from '@/types/research-report';

interface BuySideReportPanelProps {
  report: ResearchReport;
}

const biasLabels: Record<BuySideReportBias, string> = {
  constructive: 'Constructive',
  balanced: 'Balanced',
  cautious: 'Cautious',
  watch: 'Watch',
};

const biasStyles: Record<BuySideReportBias, string> = {
  constructive: 'border-[var(--brand-border)] bg-[var(--brand-soft)] text-[var(--brand-ink)]',
  balanced: 'border-border bg-white text-[oklch(0.28_0.025_160)]',
  cautious: 'border-[var(--risk-border)] bg-[var(--risk-soft)] text-[var(--risk-ink)]',
  watch: 'border-[oklch(0.88_0.045_70)] bg-[oklch(0.98_0.035_80)] text-[oklch(0.39_0.08_60)]',
};

const generationStatusLabels: Record<BuySideReportGenerationStatus, string> = {
  generated: 'Generated',
  partial: 'Partial',
  fallback: 'Fallback',
};

const generationStatusStyles: Record<BuySideReportGenerationStatus, string> = {
  generated: 'border-[var(--brand-border)] bg-[var(--brand-soft)] text-[var(--brand-ink)]',
  partial: 'border-[oklch(0.88_0.045_70)] bg-[oklch(0.98_0.035_80)] text-[oklch(0.39_0.08_60)]',
  fallback: 'border-[var(--risk-border)] bg-[var(--risk-soft)] text-[var(--risk-ink)]',
};

const reviewStatusLabels: Record<BuySideReportReviewStatus, string> = {
  linked: 'Linked',
  needs_source: 'Needs source',
  requires_review: 'Review',
};

const reviewStatusStyles: Record<BuySideReportReviewStatus, string> = {
  linked: 'border-[var(--brand-border)] bg-[var(--brand-soft)] text-[var(--brand-ink)]',
  needs_source: 'border-[var(--risk-border)] bg-[var(--risk-soft)] text-[var(--risk-ink)]',
  requires_review: 'border-[oklch(0.88_0.045_70)] bg-[oklch(0.98_0.035_80)] text-[oklch(0.39_0.08_60)]',
};

const scenarioStyles: Record<string, string> = {
  bull: 'border-[var(--brand-border)] bg-[var(--brand-soft)] text-[var(--brand-ink)]',
  base: 'border-border bg-white text-[oklch(0.24_0.018_160)]',
  bear: 'border-[var(--risk-border)] bg-[var(--risk-soft)] text-[var(--risk-ink)]',
};

function BulletList({ items, limit = 4 }: { items: string[]; limit?: number }) {
  const visibleItems = items.slice(0, limit);

  if (visibleItems.length === 0) {
    return (
      <div className="rounded-[8px] border border-border bg-muted px-3 py-2 text-xs text-[oklch(0.48_0.018_160)]">
        Pending source-backed detail
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {visibleItems.map((item) => (
        <li key={item} className="flex gap-2 text-sm leading-relaxed text-[oklch(0.24_0.016_160)]">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--brand-dot)]" />
          <span className="min-w-0">{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function BuySideReportPanel({ report }: BuySideReportPanelProps) {
  const buySide = report.buySideReport;
  const { investmentView, businessQuality, generationState } = buySide;

  return (
    <div className="space-y-4">
      <div className="rounded-[8px] border border-border bg-white p-4">
        <div className="mb-4 flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="mb-1 flex items-center gap-2 text-sm font-semibold text-[var(--brand-ink)]">
              <FileSearch className="h-4 w-4" aria-hidden="true" />
              Buy-Side Report Generator
            </div>
            <h3 className="text-xl font-bold leading-tight text-[oklch(0.16_0.014_160)]">
              {buySide.title}
            </h3>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${generationStatusStyles[buySide.status]}`}>
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
              {generationStatusLabels[buySide.status]}
            </span>
            <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${biasStyles[investmentView.bias]}`}>
              {biasLabels[investmentView.bias]}
            </span>
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-[8px] border border-border bg-[oklch(0.992_0.005_85)] p-3">
            <div className="mb-1 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-normal text-[oklch(0.48_0.018_160)]">
              <TrendingUp className="h-3.5 w-3.5" aria-hidden="true" />
              View
            </div>
            <div className="text-base font-semibold text-[oklch(0.18_0.014_160)]">
              {biasLabels[investmentView.bias]}
            </div>
          </div>
          <div className="rounded-[8px] border border-border bg-[oklch(0.992_0.005_85)] p-3">
            <div className="mb-1 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-normal text-[oklch(0.48_0.018_160)]">
              <BarChart3 className="h-3.5 w-3.5" aria-hidden="true" />
              Scenarios
            </div>
            <div className="font-mono text-xl font-semibold text-[oklch(0.18_0.014_160)]">
              {buySide.scenarios.length}
            </div>
          </div>
          <div className="rounded-[8px] border border-border bg-[oklch(0.992_0.005_85)] p-3">
            <div className="mb-1 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-normal text-[oklch(0.48_0.018_160)]">
              <Link2 className="h-3.5 w-3.5" aria-hidden="true" />
              Sources
            </div>
            <div className="font-mono text-xl font-semibold text-[oklch(0.18_0.014_160)]">
              {generationState.sourceRecordCount}
            </div>
          </div>
          <div className="rounded-[8px] border border-border bg-[oklch(0.992_0.005_85)] p-3">
            <div className="mb-1 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-normal text-[oklch(0.48_0.018_160)]">
              <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
              Review
            </div>
            <div className="font-mono text-xl font-semibold text-[oklch(0.18_0.014_160)]">
              {generationState.missingReferenceCount + generationState.warnings.length}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <section className="rounded-[8px] border border-[var(--brand-border)] bg-[var(--brand-soft)] p-4">
          <div className="mb-2 text-xs font-semibold text-[var(--brand-ink)]">Investment View</div>
          <p className="mb-4 text-base font-semibold leading-relaxed text-[oklch(0.18_0.014_160)]">
            {investmentView.headline}
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <div className="mb-2 text-[11px] font-semibold uppercase tracking-normal text-[var(--brand-ink)]">
                Thesis
              </div>
              <BulletList items={investmentView.thesis} />
            </div>
            <div>
              <div className="mb-2 text-[11px] font-semibold uppercase tracking-normal text-[var(--brand-ink)]">
                Key Debates
              </div>
              <BulletList items={investmentView.keyDebates} />
            </div>
          </div>
        </section>

        <section className="rounded-[8px] border border-border bg-white p-4">
          <div className="mb-2 text-xs font-semibold text-[oklch(0.45_0.018_160)]">Business Quality</div>
          <p className="mb-3 text-sm leading-relaxed text-[oklch(0.24_0.016_160)]">
            {businessQuality.positioning}
          </p>
          <div className="mb-3 flex flex-wrap gap-2">
            {businessQuality.revenueDrivers.slice(0, 6).map((driver) => (
              <span key={driver} className="rounded-full border border-[var(--brand-border)] bg-[var(--brand-soft)] px-2.5 py-1 text-xs text-[var(--brand-ink)]">
                {driver}
              </span>
            ))}
          </div>
          <BulletList items={businessQuality.financialReadThrough} limit={3} />
        </section>
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        {buySide.scenarios.map((scenario) => (
          <article key={scenario.id} className={`rounded-[8px] border p-4 ${scenarioStyles[scenario.id]}`}>
            <div className="mb-2 flex items-center justify-between gap-3">
              <div className="text-sm font-semibold">{scenario.label}</div>
              <span className="rounded-full border border-current/25 bg-white/60 px-2 py-0.5 font-mono text-[10px]">
                {scenario.probabilityLabel}
              </span>
            </div>
            <p className="mb-3 text-sm leading-relaxed">{scenario.narrative}</p>
            <BulletList items={scenario.keyAssumptions} limit={3} />
          </article>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.42fr)]">
        <section className="rounded-[8px] border border-border bg-white p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-[oklch(0.18_0.014_160)]">
            <BarChart3 className="h-4 w-4" aria-hidden="true" />
            Monitoring Plan
          </div>
          <div className="space-y-2">
            {buySide.monitoringPlan.map((item) => (
              <div key={item.id} className="rounded-[8px] border border-border bg-[oklch(0.992_0.005_85)] p-3">
                <div className="mb-1 flex min-w-0 flex-wrap items-center gap-2">
                  <span className="min-w-0 text-sm font-semibold text-[oklch(0.18_0.014_160)]">
                    {item.label}
                  </span>
                  <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${reviewStatusStyles[item.reviewStatus]}`}>
                    {reviewStatusLabels[item.reviewStatus]}
                  </span>
                </div>
                <div className="mb-1 text-xs font-medium text-[var(--brand-ink)]">
                  {item.currentState}
                </div>
                <p className="text-xs leading-relaxed text-[oklch(0.45_0.018_160)]">
                  {item.whyItMatters}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[8px] border border-border bg-white p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-[oklch(0.18_0.014_160)]">
            <ShieldAlert className="h-4 w-4" aria-hidden="true" />
            Source Audit
          </div>
          <div className="space-y-2">
            {buySide.sourceAttribution.slice(0, 5).map((source) => (
              <div key={source.sourceId} className="rounded-[8px] border border-border bg-muted p-3">
                <div className="mb-1 text-sm font-semibold leading-snug text-[oklch(0.2_0.016_160)]">
                  {source.sourceLabel}
                </div>
                <div className="flex flex-wrap gap-1.5 font-mono text-[10px] text-[oklch(0.48_0.018_160)]">
                  <span>{source.sourceType}</span>
                  <span>{source.method}</span>
                  <span>{source.status}</span>
                </div>
              </div>
            ))}
          </div>
          {generationState.warnings.length > 0 && (
            <div className="mt-3 rounded-[8px] border border-[var(--risk-border)] bg-[var(--risk-soft)] p-3">
              <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-[var(--risk-ink)]">
                <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
                Review Required
              </div>
              <BulletList items={generationState.warnings} limit={3} />
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
