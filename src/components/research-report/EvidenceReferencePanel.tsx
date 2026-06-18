import { AlertTriangle, Database, ExternalLink, FileSearch, Link2, ShieldCheck } from 'lucide-react';
import type {
  EvidenceWeight,
  ResearchReport,
  ResearchReportEvidenceLinkStatus,
  ResearchReportEvidenceReference,
  ResearchReportReferenceKind,
} from '@/types/research-report';

interface EvidenceReferencePanelProps {
  report: ResearchReport;
}

const weightLabels: Record<EvidenceWeight, string> = {
  primary: 'Primary',
  supporting: 'Supporting',
  context: 'Context',
  fallback: 'Fallback',
};

const weightStyles: Record<EvidenceWeight, string> = {
  primary: 'border-[var(--brand-border)] bg-[var(--brand-soft)] text-[var(--brand-ink)]',
  supporting: 'border-border bg-white text-[oklch(0.28_0.025_160)]',
  context: 'border-border bg-muted text-[oklch(0.45_0.018_160)]',
  fallback: 'border-[var(--risk-border)] bg-[var(--risk-soft)] text-[var(--risk-ink)]',
};

const statusLabels: Record<ResearchReportEvidenceLinkStatus, string> = {
  linked: 'Linked',
  missing_source: 'Missing source',
  fallback_source: 'Fallback source',
  needs_review: 'Needs review',
};

const statusStyles: Record<ResearchReportEvidenceLinkStatus, string> = {
  linked: 'border-[var(--brand-border)] bg-[var(--brand-soft)] text-[var(--brand-ink)]',
  missing_source: 'border-[var(--risk-border)] bg-[var(--risk-soft)] text-[var(--risk-ink)]',
  fallback_source: 'border-[var(--risk-border)] bg-[var(--risk-soft)] text-[var(--risk-ink)]',
  needs_review: 'border-[oklch(0.88_0.045_70)] bg-[oklch(0.98_0.035_80)] text-[oklch(0.39_0.08_60)]',
};

const targetKindLabels: Record<ResearchReportReferenceKind, string> = {
  claim: 'Claim',
  metric: 'Metric',
  section_item: 'Item',
  follow_up_task: 'Follow-up',
};

function evidenceDate(evidence: ResearchReportEvidenceReference) {
  return evidence.publishedAt ?? evidence.fetchedAt ?? 'date pending';
}

export function EvidenceReferencePanel({ report }: EvidenceReferencePanelProps) {
  const { summary, links, missingReferences } = report.evidenceLayer;
  const ingestion = report.sourceIngestionState;

  return (
    <div className="space-y-4">
      <div className="rounded-[8px] border border-[var(--brand-border)] bg-[var(--brand-soft)] p-4">
        <div className="mb-3 flex min-w-0 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="mb-1 flex items-center gap-2 text-sm font-semibold text-[var(--brand-ink)]">
              <Database className="h-4 w-4" aria-hidden="true" />
              Source Ingestion
            </div>
            <div className="flex flex-wrap gap-2 font-mono text-[11px] text-[oklch(0.4_0.02_75)]">
              <span>{ingestion.status}</span>
              <span>{ingestion.method}</span>
              <span>{ingestion.records.length} records</span>
              <span>{ingestion.freshness}</span>
              {ingestion.lastIngestedAt && <span>{ingestion.lastIngestedAt.slice(0, 10)}</span>}
            </div>
          </div>
          {ingestion.warnings.length > 0 && (
            <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-[var(--risk-border)] bg-white px-2.5 py-1 text-xs font-semibold text-[var(--risk-ink)]">
              <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
              {ingestion.warnings.length} warnings
            </span>
          )}
        </div>
        {ingestion.sourceSummary.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {ingestion.sourceSummary.slice(0, 8).map((source) => (
              <span key={source} className="rounded-full border border-[var(--brand-border)] bg-white px-2.5 py-1 text-xs text-[var(--brand-ink)]">
                {source}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-[8px] border border-border bg-white p-3">
          <div className="mb-1 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-normal text-[oklch(0.48_0.018_160)]">
            <FileSearch className="h-3.5 w-3.5" aria-hidden="true" />
            Evidence
          </div>
          <div className="font-mono text-xl font-semibold text-[oklch(0.18_0.014_160)]">
            {summary.evidenceReferenceCount}
          </div>
        </div>
        <div className="rounded-[8px] border border-border bg-white p-3">
          <div className="mb-1 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-normal text-[oklch(0.48_0.018_160)]">
            <Link2 className="h-3.5 w-3.5" aria-hidden="true" />
            Linked Targets
          </div>
          <div className="font-mono text-xl font-semibold text-[oklch(0.18_0.014_160)]">
            {summary.linkedTargetCount}
          </div>
        </div>
        <div className="rounded-[8px] border border-border bg-white p-3">
          <div className="mb-1 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-normal text-[oklch(0.48_0.018_160)]">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
            Fact Refs
          </div>
          <div className="font-mono text-xl font-semibold text-[oklch(0.18_0.014_160)]">
            {summary.factReferenceCount}
          </div>
        </div>
        <div className="rounded-[8px] border border-border bg-white p-3">
          <div className="mb-1 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-normal text-[oklch(0.48_0.018_160)]">
            <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
            Review Items
          </div>
          <div className="font-mono text-xl font-semibold text-[oklch(0.18_0.014_160)]">
            {summary.warningCount}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {report.evidenceReferences.map((evidence) => {
          const evidenceLinks = links.filter((link) => link.evidenceId === evidence.id);
          const status = evidenceLinks.find((link) => link.status !== 'linked')?.status ?? 'linked';

          return (
            <article key={evidence.id} className="rounded-[8px] border border-border bg-white p-4">
              <div className="mb-3 flex min-w-0 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="mb-1 flex min-w-0 flex-wrap items-center gap-2">
                    <span className="min-w-0 text-sm font-semibold leading-snug text-[oklch(0.18_0.014_160)]">
                      {evidence.title}
                    </span>
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${weightStyles[evidence.evidenceWeight]}`}>
                      {weightLabels[evidence.evidenceWeight]}
                    </span>
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${statusStyles[status]}`}>
                      {statusLabels[status]}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2 font-mono text-[11px] text-[oklch(0.48_0.018_160)]">
                    <span>{evidence.sourceType}</span>
                    <span>{evidenceDate(evidence)}</span>
                    <span>{evidence.sourceQuality}</span>
                  </div>
                </div>
                {evidence.sourceUrl && (
                  <a
                    href={evidence.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-8 w-fit shrink-0 items-center gap-1.5 rounded-[8px] border border-border bg-white px-2.5 text-xs font-semibold text-[oklch(0.28_0.025_160)] transition-colors hover:bg-muted"
                  >
                    Source
                    <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                  </a>
                )}
              </div>

              {evidence.snippet && (
                <p className="mb-3 text-sm leading-relaxed text-[oklch(0.3_0.016_160)]">
                  {evidence.snippet}
                </p>
              )}

              <div className="flex flex-wrap gap-2">
                {evidenceLinks.length > 0 ? (
                  evidenceLinks.map((link) => (
                    <span
                      key={link.id}
                      className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-border bg-muted px-2.5 py-1 text-xs text-[oklch(0.32_0.018_160)]"
                    >
                      <Link2 className="h-3 w-3 shrink-0" aria-hidden="true" />
                      <span className="font-semibold">{targetKindLabels[link.target.kind]}</span>
                      <span className="min-w-0 truncate">{link.target.label}</span>
                    </span>
                  ))
                ) : (
                  <span className="rounded-full border border-[var(--risk-border)] bg-[var(--risk-soft)] px-2.5 py-1 text-xs text-[var(--risk-ink)]">
                    No linked report target
                  </span>
                )}
              </div>
            </article>
          );
        })}
      </div>

      {missingReferences.length > 0 && (
        <div className="rounded-[8px] border border-[var(--risk-border)] bg-[var(--risk-soft)] p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-[var(--risk-ink)]">
            <AlertTriangle className="h-4 w-4" aria-hidden="true" />
            Missing References
          </div>
          <div className="space-y-2">
            {missingReferences.slice(0, 6).map((item) => (
              <div key={item.id} className="rounded-[8px] border border-[var(--risk-border)] bg-white/70 p-3 text-sm leading-relaxed text-[var(--risk-ink)]">
                <div className="mb-1 font-semibold">
                  {targetKindLabels[item.target.kind]} - {item.target.label}
                </div>
                <div>{item.reason}</div>
              </div>
            ))}
            {missingReferences.length > 6 && (
              <div className="font-mono text-xs text-[var(--risk-ink)]">
                +{missingReferences.length - 6} more
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
