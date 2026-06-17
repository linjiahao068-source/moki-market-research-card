'use client';

import { AlertTriangle, BrainCircuit, CheckCircle2, FileText, Loader2, ShieldCheck } from 'lucide-react';
import type { ResearchBrief, ResearchBriefClaim, ResearchBriefModule } from '@/types/research-brief';

interface ResearchBriefPanelProps {
  brief?: ResearchBrief | null;
  isLoading?: boolean;
  error?: string;
}

const toneClass: Record<ResearchBriefClaim['tone'], string> = {
  positive: 'border-[oklch(0.78_0.12_145)] bg-[oklch(0.98_0.025_145)] text-[oklch(0.32_0.08_145)]',
  neutral: 'border-border bg-white text-[oklch(0.22_0.018_160)]',
  negative: 'border-[var(--risk-border)] bg-[var(--risk-soft)] text-[var(--risk-ink)]',
  watch: 'border-[var(--brand-border)] bg-[var(--brand-soft)] text-[var(--brand-ink)]',
};

function modeLabel(brief: ResearchBrief) {
  if (brief.generationMode === 'llm') {
    return `LLM · ${brief.provider}${brief.model ? ` · ${brief.model}` : ''}`;
  }

  return `回退 · ${brief.provider}`;
}

function moduleIcon(module: ResearchBriefModule) {
  if (module.id === 'earnings_snapshot') {
    return <FileText className="h-4 w-4" aria-hidden="true" />;
  }

  if (module.id === 'company_guidance') {
    return <ShieldCheck className="h-4 w-4" aria-hidden="true" />;
  }

  return <BrainCircuit className="h-4 w-4" aria-hidden="true" />;
}

export function ResearchBriefPanel({ brief, isLoading = false, error = '' }: ResearchBriefPanelProps) {
  if (isLoading) {
    return (
      <section className="rounded-[8px] border border-[var(--brand-border)] bg-[var(--brand-soft)] p-4">
        <div className="flex items-center gap-3 text-sm font-semibold text-[var(--brand-ink)]">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          正在生成 LLM 研究简报...
        </div>
      </section>
    );
  }

  if (!brief && !error) {
    return null;
  }

  if (!brief && error) {
    return (
      <section className="rounded-[8px] border border-[var(--risk-border)] bg-[var(--risk-soft)] p-4 text-sm leading-relaxed text-[var(--risk-ink)]">
        <div className="mb-1 flex items-center gap-2 font-semibold">
          <AlertTriangle className="h-4 w-4" aria-hidden="true" />
          LLM 研究简报暂不可用
        </div>
        {error}
      </section>
    );
  }

  if (!brief) {
    return null;
  }

  return (
    <section className="rounded-[8px] border border-border bg-white p-4">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-[var(--brand-ink)]">
            <BrainCircuit className="h-4 w-4" aria-hidden="true" />
            LLM 研究简报
          </div>
          <h3 className="text-lg font-bold leading-tight text-[oklch(0.16_0.014_160)]">
            {brief.headline}
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-[oklch(0.42_0.018_160)]">
            {brief.executiveSummary}
          </p>
        </div>
        <div className="flex w-fit shrink-0 items-center gap-2 rounded-full border border-[var(--brand-border)] bg-[var(--brand-soft)] px-3 py-1 text-xs font-semibold text-[var(--brand-ink)]">
          <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
          {modeLabel(brief)}
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        {brief.modules.map((module) => (
          <div key={module.id} className="rounded-[8px] border border-border bg-[oklch(0.992_0.005_85)] p-3">
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-[var(--brand-ink)]">
              {moduleIcon(module)}
              {module.title}
            </div>
            <p className="mb-3 text-xs leading-relaxed text-[oklch(0.44_0.018_160)]">
              {module.summary}
            </p>
            <div className="space-y-2">
              {module.claims.map((claim) => (
                <div key={claim.id} className={`rounded-[8px] border p-3 ${toneClass[claim.tone]}`}>
                  <div className="mb-1 text-sm font-semibold leading-snug">
                    {claim.title}
                  </div>
                  <p className="text-xs leading-relaxed">
                    {claim.body}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {claim.evidenceIds.slice(0, 4).map((id) => (
                      <span key={id} className="rounded-full border border-current/20 bg-white/65 px-2 py-0.5 font-mono text-[10px]">
                        {id}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
              {module.missingData.slice(0, 3).map((item) => (
                <div key={item} className="rounded-[8px] border border-dashed border-border bg-white p-3 text-xs leading-relaxed text-[oklch(0.48_0.018_160)]">
                  {item}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {(brief.uncertainties.length > 0 || brief.warnings.length > 0) && (
        <div className="mt-4 rounded-[8px] border border-[var(--risk-border)] bg-[var(--risk-soft)] p-3">
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-[var(--risk-ink)]">
            <AlertTriangle className="h-4 w-4" aria-hidden="true" />
            不确定性与校验提示
          </div>
          <ul className="space-y-1 text-xs leading-relaxed text-[var(--risk-ink)]">
            {[...brief.uncertainties, ...brief.warnings].slice(0, 6).map((item) => (
              <li key={item}>- {item}</li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
