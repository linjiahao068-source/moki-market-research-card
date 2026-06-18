import {
  AlertTriangle,
  BookOpenText,
  Database,
  Layers,
  LineChart,
  ListChecks,
  ShieldCheck,
} from 'lucide-react';
import type {
  IntegratedReportPillarId,
  IntegratedReportPillarStatus,
  IntegratedReportPriority,
  IntegratedReportStatus,
  ResearchReport,
} from '@/types/research-report';

interface IntegratedResearchReportPanelProps {
  report: ResearchReport;
}

const statusLabels: Record<IntegratedReportStatus, string> = {
  ready: 'Ready',
  partial: 'Partial',
  blocked: 'Blocked',
};

const statusStyles: Record<IntegratedReportStatus, string> = {
  ready: 'border-[var(--brand-border)] bg-[var(--brand-soft)] text-[var(--brand-ink)]',
  partial: 'border-[oklch(0.88_0.045_70)] bg-[oklch(0.98_0.035_80)] text-[oklch(0.39_0.08_60)]',
  blocked: 'border-[var(--risk-border)] bg-[var(--risk-soft)] text-[var(--risk-ink)]',
};

const pillarLabels: Record<IntegratedReportPillarId, string> = {
  source_ingestion: 'Sources',
  evidence_layer: 'Evidence',
  buy_side_report: 'Buy-side',
  technical_data: 'Technical',
  follow_up_research: 'Follow-up',
};

const pillarStatusLabels: Record<IntegratedReportPillarStatus, string> = {
  ready: 'Ready',
  partial: 'Partial',
  needs_review: 'Review',
  blocked: 'Blocked',
};

const pillarStatusStyles: Record<IntegratedReportPillarStatus, string> = {
  ready: 'border-[var(--brand-border)] bg-[var(--brand-soft)] text-[var(--brand-ink)]',
  partial: 'border-border bg-white text-[oklch(0.28_0.025_160)]',
  needs_review: 'border-[oklch(0.88_0.045_70)] bg-[oklch(0.98_0.035_80)] text-[oklch(0.39_0.08_60)]',
  blocked: 'border-[var(--risk-border)] bg-[var(--risk-soft)] text-[var(--risk-ink)]',
};

const priorityStyles: Record<IntegratedReportPriority, string> = {
  high: 'border-[var(--risk-border)] bg-[var(--risk-soft)] text-[var(--risk-ink)]',
  medium: 'border-[oklch(0.88_0.045_70)] bg-[oklch(0.98_0.035_80)] text-[oklch(0.39_0.08_60)]',
  low: 'border-border bg-muted text-[oklch(0.45_0.018_160)]',
};

export function IntegratedResearchReportPanel({ report }: IntegratedResearchReportPanelProps) {
  const integrated = report.integratedReport;
  const { readiness, sourceAudit } = integrated;

  return (
    <div className="space-y-4">
      <section className="rounded-[8px] border border-border bg-white p-4">
        <div className="mb-4 flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="mb-1 flex items-center gap-2 text-sm font-semibold text-[var(--brand-ink)]">
              <BookOpenText className="h-4 w-4" aria-hidden="true" />
              Integrated Research Report
            </div>
            <h3 className="text-xl font-bold leading-tight text-[oklch(0.16_0.014_160)]">
              {integrated.title}
            </h3>
          </div>
          <span className={`inline-flex w-fit items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${statusStyles[integrated.status]}`}>
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
            {statusLabels[integrated.status]}
          </span>
        </div>

        <p className="mb-4 rounded-[8px] border border-[var(--brand-border)] bg-[var(--brand-soft)] p-3 text-sm leading-relaxed text-[var(--brand-ink)]">
          {integrated.executiveNarrative}
        </p>

        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-[8px] border border-border bg-[oklch(0.992_0.005_85)] p-3">
            <div className="mb-1 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-normal text-[oklch(0.48_0.018_160)]">
              <Database className="h-3.5 w-3.5" aria-hidden="true" />
              Sources
            </div>
            <div className="font-mono text-xl font-semibold text-[oklch(0.18_0.014_160)]">
              {sourceAudit.sourceRecordCount}
            </div>
          </div>
          <div className="rounded-[8px] border border-border bg-[oklch(0.992_0.005_85)] p-3">
            <div className="mb-1 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-normal text-[oklch(0.48_0.018_160)]">
              <Layers className="h-3.5 w-3.5" aria-hidden="true" />
              Linked
            </div>
            <div className="font-mono text-xl font-semibold text-[oklch(0.18_0.014_160)]">
              {sourceAudit.linkedTargetCount}
            </div>
          </div>
          <div className="rounded-[8px] border border-border bg-[oklch(0.992_0.005_85)] p-3">
            <div className="mb-1 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-normal text-[oklch(0.48_0.018_160)]">
              <LineChart className="h-3.5 w-3.5" aria-hidden="true" />
              Technical
            </div>
            <div className="truncate font-mono text-xs font-semibold text-[oklch(0.18_0.014_160)]">
              {sourceAudit.technicalProvider}
            </div>
          </div>
          <div className="rounded-[8px] border border-border bg-[oklch(0.992_0.005_85)] p-3">
            <div className="mb-1 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-normal text-[oklch(0.48_0.018_160)]">
              <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
              Review
            </div>
            <div className="font-mono text-xl font-semibold text-[oklch(0.18_0.014_160)]">
              {readiness.warningCount + readiness.evidenceMissingCount}
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.42fr)]">
        <section className="rounded-[8px] border border-border bg-white p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-[oklch(0.18_0.014_160)]">
            <ListChecks className="h-4 w-4" aria-hidden="true" />
            Report Pillars
          </div>
          <div className="grid gap-2 md:grid-cols-2">
            {integrated.pillars.map((pillar) => (
              <article key={pillar.id} className="rounded-[8px] border border-border bg-[oklch(0.992_0.005_85)] p-3">
                <div className="mb-2 flex min-w-0 flex-wrap items-center gap-2">
                  <span className="min-w-0 text-sm font-semibold text-[oklch(0.18_0.014_160)]">
                    {pillar.title}
                  </span>
                  <span className="rounded-full border border-border bg-white px-2 py-0.5 text-[10px] font-semibold text-[oklch(0.44_0.018_160)]">
                    {pillarLabels[pillar.id]}
                  </span>
                  <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${pillarStatusStyles[pillar.status]}`}>
                    {pillarStatusLabels[pillar.status]}
                  </span>
                </div>
                <div className="mb-1 text-xs font-medium text-[var(--brand-ink)]">
                  {pillar.headline}
                </div>
                <p className="text-xs leading-relaxed text-[oklch(0.45_0.018_160)]">
                  {pillar.detail}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-[8px] border border-border bg-white p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-[oklch(0.18_0.014_160)]">
            <AlertTriangle className="h-4 w-4" aria-hidden="true" />
            Review Queue
          </div>
          <div className="space-y-2">
            {integrated.reviewQueue.length > 0 ? (
              integrated.reviewQueue.slice(0, 6).map((item) => (
                <div key={item.id} className="rounded-[8px] border border-border bg-muted p-3">
                  <div className="mb-1 flex min-w-0 flex-wrap items-center gap-2">
                    <span className="min-w-0 text-sm font-semibold text-[oklch(0.2_0.016_160)]">
                      {item.title}
                    </span>
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${priorityStyles[item.priority]}`}>
                      {item.priority}
                    </span>
                  </div>
                  <div className="text-xs leading-relaxed text-[oklch(0.45_0.018_160)]">
                    {item.reason}
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-[8px] border border-[var(--brand-border)] bg-[var(--brand-soft)] p-3 text-xs text-[var(--brand-ink)]">
                No review items are currently queued.
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
