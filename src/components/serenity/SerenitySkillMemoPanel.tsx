'use client';

import {
  Activity,
  AlertTriangle,
  BrainCircuit,
  CheckCircle2,
  FileText,
  Gauge,
  Loader2,
  Scale,
  Target,
} from 'lucide-react';
import type { SerenityMemo, SerenityMemoObservation, SerenityMemoSkillCard, SerenitySkillId } from '@/types/serenity-memo';

interface SerenitySkillMemoPanelProps {
  memo?: SerenityMemo | null;
  isLoading?: boolean;
  error?: string;
  mode?: 'overview' | 'skill';
  skillId?: SerenitySkillId;
}

const toneClass: Record<SerenityMemoObservation['tone'], string> = {
  positive: 'border-[oklch(0.78_0.12_145)] bg-[oklch(0.98_0.025_145)] text-[oklch(0.32_0.08_145)]',
  neutral: 'border-border bg-white text-[oklch(0.22_0.018_160)]',
  cautious: 'border-[var(--risk-border)] bg-[var(--risk-soft)] text-[var(--risk-ink)]',
  watch: 'border-[var(--brand-border)] bg-[var(--brand-soft)] text-[var(--brand-ink)]',
};

function modeLabel(memo: SerenityMemo) {
  if (memo.generationMode === 'llm') {
    return `LLM · ${memo.provider}${memo.model ? ` · ${memo.model}` : ''}`;
  }

  return `回退 · ${memo.provider}`;
}

function skillIcon(skillId: SerenitySkillId) {
  if (skillId === 'buy_side_memo') {
    return <FileText className="h-4 w-4" aria-hidden="true" />;
  }

  if (skillId === 'serenity_alpha') {
    return <Target className="h-4 w-4" aria-hidden="true" />;
  }

  if (skillId === 'bayesian') {
    return <Scale className="h-4 w-4" aria-hidden="true" />;
  }

  if (skillId === 'gf_dma') {
    return <Activity className="h-4 w-4" aria-hidden="true" />;
  }

  return <Gauge className="h-4 w-4" aria-hidden="true" />;
}

function EvidencePills({ evidenceIds, calculationRefs }: { evidenceIds: string[]; calculationRefs: string[] }) {
  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {evidenceIds.slice(0, 3).map((id) => (
        <span key={id} className="rounded-full border border-current/20 bg-white/70 px-2 py-0.5 font-mono text-[10px]">
          {id}
        </span>
      ))}
      {calculationRefs.slice(0, 2).map((id) => (
        <span key={id} className="rounded-full border border-current/20 bg-white/70 px-2 py-0.5 font-mono text-[10px]">
          calc:{id.slice(0, 12)}
        </span>
      ))}
    </div>
  );
}

function ObservationCard({ observation }: { observation: SerenityMemoObservation }) {
  return (
    <div className={`rounded-[8px] border p-3 ${toneClass[observation.tone]}`}>
      <div className="mb-1 text-sm font-semibold leading-snug">
        {observation.title}
      </div>
      <p className="text-xs leading-relaxed">
        {observation.body}
      </p>
      <EvidencePills evidenceIds={observation.evidenceIds} calculationRefs={observation.calculationRefs} />
    </div>
  );
}

function CompactList({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div>
      <div className="mb-1 text-xs font-semibold text-[var(--brand-ink)]">{title}</div>
      <ul className="space-y-1 text-xs leading-relaxed text-[oklch(0.42_0.018_160)]">
        {items.slice(0, 5).map((item) => (
          <li key={item}>- {item}</li>
        ))}
      </ul>
    </div>
  );
}

function SkillCardDetail({ card }: { card: SerenityMemoSkillCard }) {
  return (
    <section className="rounded-[8px] border border-border bg-white p-4 sm:p-5">
      <div className="mb-4 flex items-start gap-3">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] border border-[var(--brand-border)] bg-[var(--brand-soft)] text-[var(--brand-ink)]">
          {skillIcon(card.id)}
        </div>
        <div className="min-w-0">
          <div className="mb-1 text-xs font-semibold text-[var(--brand-ink)]">
            Serenity Skill Memo
          </div>
          <h3 className="text-lg font-bold leading-tight text-[oklch(0.16_0.014_160)]">
            {card.title}
          </h3>
          <p className="mt-1 text-xs leading-relaxed text-[oklch(0.46_0.018_160)]">
            {card.frameworkQuestion}
          </p>
        </div>
      </div>

      <div className="mb-4 rounded-[8px] border border-[var(--brand-border)] bg-[var(--brand-soft)] p-3 text-sm leading-relaxed text-[var(--brand-ink)]">
        {card.overview}
      </div>

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1.35fr)_minmax(260px,0.65fr)]">
        <div className="space-y-2">
          {card.observations.map((observation) => (
            <ObservationCard key={observation.id} observation={observation} />
          ))}
          {card.observations.length === 0 && (
            <div className="rounded-[8px] border border-dashed border-border bg-[oklch(0.992_0.005_85)] p-3 text-sm leading-relaxed text-[oklch(0.46_0.018_160)]">
              当前 Skill 没有通过证据校验的观察项。
            </div>
          )}
        </div>

        <div className="space-y-3 rounded-[8px] border border-border bg-[oklch(0.992_0.005_85)] p-3">
          <CompactList title="关键变量" items={card.variables} />
          <CompactList title="分歧点" items={card.debates} />
          <CompactList title="后续观察项" items={card.watchItems} />
          <CompactList title="缺失数据" items={card.missingData} />
        </div>
      </div>
    </section>
  );
}

function OverviewCard({ card }: { card: SerenityMemoSkillCard }) {
  const firstObservation = card.observations[0];

  return (
    <div className="rounded-[8px] border border-border bg-[oklch(0.992_0.005_85)] p-3">
      <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-[var(--brand-ink)]">
        {skillIcon(card.id)}
        {card.title}
      </div>
      <p className="mb-3 text-xs leading-relaxed text-[oklch(0.44_0.018_160)]">
        {card.overview}
      </p>
      {firstObservation ? (
        <div className="border-t border-border pt-2">
          <div className="mb-1 text-sm font-semibold leading-snug text-[oklch(0.22_0.018_160)]">
            {firstObservation.title}
          </div>
          <p className="text-xs leading-relaxed text-[oklch(0.42_0.018_160)]">
            {firstObservation.body}
          </p>
          <EvidencePills evidenceIds={firstObservation.evidenceIds} calculationRefs={firstObservation.calculationRefs} />
        </div>
      ) : (
        <div className="border-t border-dashed border-border pt-2 text-xs leading-relaxed text-[oklch(0.48_0.018_160)]">
          {card.missingData[0] ?? '当前证据不足，暂不生成观察项。'}
        </div>
      )}
    </div>
  );
}

export function SerenitySkillMemoPanel({
  memo,
  isLoading = false,
  error = '',
  mode = 'overview',
  skillId,
}: SerenitySkillMemoPanelProps) {
  if (isLoading) {
    return (
      <section className="rounded-[8px] border border-[var(--brand-border)] bg-[var(--brand-soft)] p-4">
        <div className="flex items-center gap-3 text-sm font-semibold text-[var(--brand-ink)]">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          正在生成 Serenity Skill Memo...
        </div>
      </section>
    );
  }

  if (!memo && !error) {
    return null;
  }

  if (!memo && error) {
    return (
      <section className="rounded-[8px] border border-[var(--risk-border)] bg-[var(--risk-soft)] p-4 text-sm leading-relaxed text-[var(--risk-ink)]">
        <div className="mb-1 flex items-center gap-2 font-semibold">
          <AlertTriangle className="h-4 w-4" aria-hidden="true" />
          Serenity Skill Memo 暂不可用
        </div>
        {error}
      </section>
    );
  }

  if (!memo) {
    return null;
  }

  const activeCard = skillId ? memo.skillCards.find((card) => card.id === skillId) : undefined;

  if (mode === 'skill' && activeCard) {
    return <SkillCardDetail card={activeCard} />;
  }

  return (
    <section className="rounded-[8px] border border-border bg-white p-4">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-[var(--brand-ink)]">
            <BrainCircuit className="h-4 w-4" aria-hidden="true" />
            Serenity Skill Memo
          </div>
          <h3 className="text-lg font-bold leading-tight text-[oklch(0.16_0.014_160)]">
            {memo.headline}
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-[oklch(0.42_0.018_160)]">
            {memo.executiveSummary}
          </p>
        </div>
        <div className="flex w-fit shrink-0 items-center gap-2 rounded-full border border-[var(--brand-border)] bg-[var(--brand-soft)] px-3 py-1 text-xs font-semibold text-[var(--brand-ink)]">
          <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
          {modeLabel(memo)}
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        {memo.skillCards.map((card) => (
          <OverviewCard key={card.id} card={card} />
        ))}
      </div>

      {(memo.crossSkillTensions.length > 0 || memo.watchItems.length > 0 || memo.dataLimitations.length > 0 || memo.warnings.length > 0) && (
        <div className="mt-4 grid gap-3 lg:grid-cols-3">
          <div className="rounded-[8px] border border-border bg-white p-3">
            <CompactList title="跨 Skill 分歧" items={memo.crossSkillTensions} />
          </div>
          <div className="rounded-[8px] border border-border bg-white p-3">
            <CompactList title="统一观察项" items={memo.watchItems} />
          </div>
          <div className="rounded-[8px] border border-[var(--risk-border)] bg-[var(--risk-soft)] p-3">
            <div className="mb-1 flex items-center gap-2 text-xs font-semibold text-[var(--risk-ink)]">
              <AlertTriangle className="h-4 w-4" aria-hidden="true" />
              限制与校验提示
            </div>
            <ul className="space-y-1 text-xs leading-relaxed text-[var(--risk-ink)]">
              {[...memo.dataLimitations, ...memo.warnings].slice(0, 6).map((item) => (
                <li key={item}>- {item}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </section>
  );
}
