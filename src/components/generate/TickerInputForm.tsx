'use client';

import { FormEvent, useState, useTransition } from 'react';
import { ArrowRight, Loader2, RotateCcw } from 'lucide-react';
import { SecurityCandidateList } from '@/components/security/SecurityCandidateList';
import {
  cardTypeOptions,
  GenerateCardType,
  generateRealDataResearchCard,
  mockGenerateResearchCard,
} from '@/lib/generateResearchCard/mockGenerateResearchCard';
import { resolveSecurityInput } from '@/lib/security/resolveSecurityInput';
import { BasicCompanyData } from '@/types/basic-data';
import { EarningsSnapshotData } from '@/types/earnings';
import { ResearchCard } from '@/types/research-card';
import { SecurityRecord } from '@/types/security';
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

async function fetchBasicData(query: string): Promise<{ data: BasicCompanyData | null; error: string }> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(`/api/basic-data?query=${encodeURIComponent(query)}`, {
      signal: controller.signal,
    });

    if (!response.ok) {
      return {
        data: null,
        error: '基础数据获取失败，已使用 fallback。',
      };
    }

    const payload = await response.json() as { basicData?: BasicCompanyData };

    return {
      data: payload.basicData ?? null,
      error: payload.basicData ? '' : '基础数据获取失败，已使用 fallback。',
    };
  } catch {
    return {
      data: null,
      error: '基础数据获取失败，已使用 fallback。',
    };
  } finally {
    window.clearTimeout(timeout);
  }
}

async function fetchEarningsSnapshot(query: string): Promise<{ data: EarningsSnapshotData | null; error: string }> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(`/api/earnings-snapshot?query=${encodeURIComponent(query)}`, {
      signal: controller.signal,
    });

    if (!response.ok) {
      return {
        data: null,
        error: '暂未获取到财报快照，仍可查看基础数据面板。',
      };
    }

    const payload = await response.json() as { data?: EarningsSnapshotData };

    return {
      data: payload.data ?? null,
      error: payload.data ? '' : '暂未获取到财报快照，仍可查看基础数据面板。',
    };
  } catch {
    return {
      data: null,
      error: '暂未获取到财报快照，仍可查看基础数据面板。',
    };
  } finally {
    window.clearTimeout(timeout);
  }
}

export function TickerInputForm({ initialQuery = '' }: TickerInputFormProps) {
  const defaultCardType = cardTypeOptions[0].value;
  const [query, setQuery] = useState(initialQuery);
  const [cardType, setCardType] = useState<GenerateCardType>(defaultCardType);
  const [error, setError] = useState('');
  const [basicDataError, setBasicDataError] = useState('');
  const [earningsSnapshotError, setEarningsSnapshotError] = useState('');
  const [candidates, setCandidates] = useState<SecurityRecord[]>([]);
  const [basicData, setBasicData] = useState<BasicCompanyData | null>(null);
  const [earningsSnapshot, setEarningsSnapshot] = useState<EarningsSnapshotData | null>(null);
  const [generated, setGenerated] = useState<GeneratedState | null>(() => resolveInitialCard(initialQuery, defaultCardType));
  const [isPending, startTransition] = useTransition();
  const [isBasicDataLoading, setIsBasicDataLoading] = useState(false);
  const [isEarningsSnapshotLoading, setIsEarningsSnapshotLoading] = useState(false);

  async function handleCandidateSelect(candidate: SecurityRecord) {
    const candidateInput = buildCandidateInput(candidate);
    setQuery(candidateInput);
    setError('');
    setBasicDataError('');
    setEarningsSnapshotError('');
    setCandidates([]);
    setBasicData(null);
    setEarningsSnapshot(null);
    setIsBasicDataLoading(true);
    const basicDataResult = await fetchBasicData(candidateInput);
    setBasicData(basicDataResult.data);
    setBasicDataError(basicDataResult.error);
    setIsBasicDataLoading(false);
    setIsEarningsSnapshotLoading(true);
    const earningsSnapshotResult = await fetchEarningsSnapshot(candidateInput);
    setEarningsSnapshot(earningsSnapshotResult.data);
    setEarningsSnapshotError(earningsSnapshotResult.error);
    setIsEarningsSnapshotLoading(false);

    const result = generateRealDataResearchCard({
      rawInput: candidateInput,
      cardType,
      selectedSecurity: candidate,
      basicData: basicDataResult.data ?? undefined,
      earningsSnapshotData: earningsSnapshotResult.data ?? undefined,
    });

    if (!result.ok) {
      setError(result.error);
      setCandidates(result.resolution.candidates);
      setGenerated(null);
      return;
    }

    startTransition(() => {
      setGenerated({
        card: result.card,
        isFallback: result.resolution.status === 'unmatched',
      });
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
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

    setError('');
    setBasicDataError('');
    setEarningsSnapshotError('');
    setCandidates([]);
    setBasicData(null);
    setEarningsSnapshot(null);
    setIsBasicDataLoading(true);
    const basicDataResult = await fetchBasicData(query);
    setBasicData(basicDataResult.data);
    setBasicDataError(basicDataResult.error);
    setIsBasicDataLoading(false);
    setIsEarningsSnapshotLoading(true);
    const earningsSnapshotResult = await fetchEarningsSnapshot(query);
    setEarningsSnapshot(earningsSnapshotResult.data);
    setEarningsSnapshotError(earningsSnapshotResult.error);
    setIsEarningsSnapshotLoading(false);

    const result = generateRealDataResearchCard({
      rawInput: query,
      cardType,
      basicData: basicDataResult.data ?? undefined,
      earningsSnapshotData: earningsSnapshotResult.data ?? undefined,
    });

    if (!result.ok) {
      setError(result.error);
      setCandidates(result.resolution.candidates);
      setGenerated(null);
      return;
    }

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
            支持股票代码 / Ticker / 中文名，包括英文 Ticker、数字股票代码和证券主数据中的中文名。中文名仅精确匹配，不做模糊搜索。
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
            disabled={isPending || isBasicDataLoading || isEarningsSnapshotLoading}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-[8px] bg-[var(--brand)] px-5 text-sm font-semibold text-[oklch(0.14_0.015_160)] transition-colors hover:bg-[var(--brand-hover)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending || isBasicDataLoading || isEarningsSnapshotLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                {isBasicDataLoading ? '正在获取基础数据...' : isEarningsSnapshotLoading ? '正在整理单季度财报快照...' : '生成中'}
              </>
            ) : (
              <>
                生成研究卡
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setError('');
              setBasicDataError('');
              setEarningsSnapshotError('');
              setCandidates([]);
              setBasicData(null);
              setEarningsSnapshot(null);
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

      <div className="space-y-4">
        {isBasicDataLoading && (
          <div className="rounded-[8px] border border-[var(--brand-border)] bg-[var(--brand-soft)] p-4 text-sm font-semibold text-[var(--brand-ink)]">
            正在获取基础数据...
          </div>
        )}
        {basicDataError && (
          <div className="rounded-[8px] border border-[var(--brand-border)] bg-[var(--brand-soft)] p-4 text-sm leading-relaxed text-[var(--brand-ink)]">
            {basicDataError}
          </div>
        )}
        {isEarningsSnapshotLoading && (
          <div className="rounded-[8px] border border-[var(--brand-border)] bg-[var(--brand-soft)] p-4 text-sm font-semibold text-[var(--brand-ink)]">
            正在整理单季度财报快照...
          </div>
        )}
        {earningsSnapshotError && (
          <div className="rounded-[8px] border border-[var(--brand-border)] bg-[var(--brand-soft)] p-4 text-sm leading-relaxed text-[var(--brand-ink)]">
            {earningsSnapshotError}
          </div>
        )}
        <GeneratedCardPreview
          card={generated?.card ?? null}
          isFallback={generated?.isFallback}
          candidates={candidates}
          rawInput={query}
          basicData={basicData}
          earningsSnapshot={earningsSnapshot}
        />
      </div>
    </div>
  );
}
