'use client';

import { FormEvent, useState, useTransition } from 'react';
import { ArrowRight, Loader2, RotateCcw } from 'lucide-react';
import {
  cardTypeOptions,
  GenerateCardType,
  mockGenerateResearchCard,
} from '@/lib/generateResearchCard/mockGenerateResearchCard';
import { resolveSecurityInput } from '@/lib/security/resolveSecurityInput';
import { ResearchCard } from '@/types/research-card';
import { SecurityRecord } from '@/types/security';
import { SecurityCandidateList } from '@/components/security/SecurityCandidateList';
import { CardTypeSelector } from './CardTypeSelector';
import { GeneratedCardPreview } from './GeneratedCardPreview';

interface TickerInputFormProps {
  initialQuery?: string;
}

interface GeneratedState {
  card: ResearchCard;
  isFallback: boolean;
}

function resolveInitialCard(initialQuery: string, cardType: GenerateCardType): GeneratedState | null {
  const result = mockGenerateResearchCard({ rawInput: initialQuery, cardType });

  if (!result.ok) {
    return null;
  }

  return {
    card: result.card,
    isFallback: result.resolution.status === 'unmatched',
  };
}

function buildCandidateInput(candidate: SecurityRecord) {
  return candidate.symbol ?? candidate.numericCode ?? candidate.chineseNameHK ?? candidate.companyName;
}

export function TickerInputForm({ initialQuery = '' }: TickerInputFormProps) {
  const defaultCardType = cardTypeOptions[0].value;
  const [query, setQuery] = useState(initialQuery);
  const [cardType, setCardType] = useState<GenerateCardType>(defaultCardType);
  const [error, setError] = useState('');
  const [candidates, setCandidates] = useState<SecurityRecord[]>([]);
  const [generated, setGenerated] = useState<GeneratedState | null>(() => resolveInitialCard(initialQuery, defaultCardType));
  const [isPending, startTransition] = useTransition();

  function handleCandidateSelect(candidate: SecurityRecord) {
    const candidateInput = buildCandidateInput(candidate);
    const result = mockGenerateResearchCard({ rawInput: candidateInput, cardType, selectedSecurity: candidate });

    if (!result.ok) {
      setError(result.error);
      setCandidates(result.resolution.candidates);
      setGenerated(null);
      return;
    }

    setQuery(candidateInput);
    setError('');
    setCandidates([]);
    startTransition(() => {
      setGenerated({
        card: result.card,
        isFallback: result.resolution.status === 'unmatched',
      });
    });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const resolution = resolveSecurityInput(query);

    if (!resolution.normalizedInput) {
      setError('请输入股票代码、Ticker 或中文名。');
      setCandidates([]);
      setGenerated(null);
      return;
    }

    if (resolution.inputKind === 'unknown') {
      setError('暂不支持该输入格式。');
      setCandidates([]);
      setGenerated(null);
      return;
    }

    if (resolution.status === 'ambiguous') {
      setError('匹配到多个证券，请选择候选项，或输入更精确的股票代码、Ticker 或中文名。');
      setCandidates(resolution.candidates);
      setGenerated(null);
      return;
    }

    const result = mockGenerateResearchCard({ rawInput: query, cardType });

    if (!result.ok) {
      setError(result.error);
      setCandidates(result.resolution.candidates);
      setGenerated(null);
      return;
    }

    setError('');
    setCandidates([]);
    startTransition(() => {
      setGenerated({
        card: result.card,
        isFallback: result.resolution.status === 'unmatched',
      });
    });
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[380px_minmax(0,1fr)] lg:items-start">
      <form
        onSubmit={handleSubmit}
        className="rounded-[8px] border border-border bg-white p-4 shadow-[0_12px_40px_-32px_rgba(0,0,0,0.28)] sm:p-5"
      >
        <div className="mb-5">
          <label htmlFor="security-query" className="mb-2 block text-sm font-semibold text-[oklch(0.18_0.014_160)]">
            股票代码 / Ticker / 中文名
          </label>
          <input
            id="security-query"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              if (error) {
                setError('');
              }
              if (candidates.length) {
                setCandidates([]);
              }
            }}
            placeholder="ORCL / 00700 / 腾讯控股"
            className="h-11 w-full rounded-[8px] border border-border bg-white px-3 text-base font-semibold tracking-wide text-[oklch(0.18_0.014_160)] outline-none transition-colors placeholder:font-sans placeholder:font-normal placeholder:tracking-normal placeholder:text-[oklch(0.58_0.018_160)] focus:border-[var(--brand-border)] focus:ring-2 focus:ring-[var(--brand-soft)]"
          />
          <p className="mt-2 text-xs leading-relaxed text-[oklch(0.48_0.018_160)]">
            支持股票代码 / Ticker / 中文名，包括英文 Ticker、数字股票代码和 mock security master 中的中文名。中文名仅精确匹配，不做模糊搜索。
          </p>
          {error && (
            <div className="mt-3 rounded-[8px] border border-[var(--risk-border)] bg-[var(--risk-soft)] px-3 py-2 text-sm leading-relaxed text-[var(--risk-ink)]">
              <p>{error}</p>
              {candidates.length > 0 && (
                <div className="mt-3">
                  <SecurityCandidateList candidates={candidates} onSelect={handleCandidateSelect} />
                </div>
              )}
            </div>
          )}
        </div>

        <div className="mb-5">
          <div className="mb-3 text-sm font-semibold text-[oklch(0.18_0.014_160)]">
            卡片类型
          </div>
          <CardTypeSelector value={cardType} onChange={setCardType} />
        </div>

        <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-[8px] bg-[var(--brand)] px-5 text-sm font-semibold text-[oklch(0.14_0.015_160)] transition-colors hover:bg-[var(--brand-hover)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                生成中
              </>
            ) : (
              <>
                生成 mock 研究卡
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setError('');
              setCandidates([]);
              setGenerated(null);
              setCardType(defaultCardType);
            }}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-[8px] border border-border bg-white px-5 text-sm font-semibold text-[oklch(0.22_0.018_160)] transition-colors hover:bg-muted"
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            清空
          </button>
        </div>
      </form>

      <GeneratedCardPreview
        card={generated?.card ?? null}
        isFallback={generated?.isFallback}
        candidates={candidates}
        rawInput={query}
      />
    </div>
  );
}
