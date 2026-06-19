'use client';

import { FormEvent, useState, useTransition } from 'react';
import { ArrowRight, Loader2, RotateCcw } from 'lucide-react';
import { SecurityCandidateList } from '@/components/security/SecurityCandidateList';
import {
  DEFAULT_GENERATE_CARD_TYPE,
  generateRealDataResearchCard,
  mockGenerateResearchCard,
} from '@/lib/generateResearchCard/mockGenerateResearchCard';
import { attachTechnicalDataSnapshotToReport } from '@/lib/research-report/attachTechnicalDataSnapshot';
import { buildResearchReportFromCard } from '@/lib/research-report/fromResearchCard';
import { resolveSecurityInput } from '@/lib/security/resolveSecurityInput';
import type { BasicCompanyData } from '@/types/basic-data';
import type { EarningsSnapshotData } from '@/types/earnings';
import type { LLMResearchInput } from '@/types/evidence';
import type { ResearchBrief } from '@/types/research-brief';
import type { ResearchCard } from '@/types/research-card';
import type {
  ResearchReport,
  ResearchSourceInput,
  ResearchSourceInputType,
  TechnicalDataSnapshot,
} from '@/types/research-report';
import type { SecurityRecord } from '@/types/security';
import type { SerenityMemo } from '@/types/serenity-memo';
import { GeneratedCardPreview } from './GeneratedCardPreview';

interface TickerInputFormProps {
  initialQuery?: string;
}

interface GeneratedState {
  card: ResearchCard;
  report: ResearchReport;
  isFallback: boolean;
}

function buildGeneratedState(card: ResearchCard, isFallback: boolean): GeneratedState {
  return {
    card,
    report: buildResearchReportFromCard(card),
    isFallback,
  };
}

function buildReportForCardUpdate(current: GeneratedState, card: ResearchCard) {
  if (current.report.generationState?.method === 'llm_research_report_json') {
    return current.report;
  }

  const report = buildResearchReportFromCard(card);

  if (current.report.generationState && current.report.generationState.provider !== 'legacy-adapter') {
    return {
      ...report,
      generationState: current.report.generationState,
    };
  }

  return report;
}

function resolveInitialCard(initialQuery: string): GeneratedState | null {
  const result = mockGenerateResearchCard({ rawInput: initialQuery, cardType: DEFAULT_GENERATE_CARD_TYPE });

  if (!result.ok) {
    return null;
  }

  return buildGeneratedState(result.card, result.resolution.status === 'unmatched');
}

function buildCandidateInput(candidate: SecurityRecord) {
  return candidate.symbol ?? candidate.numericCode ?? candidate.chineseNameHK ?? candidate.companyName;
}

function buildManualSourceInputs({
  query,
  sourceText,
  sourceTitle,
  sourceType,
}: {
  query: string;
  sourceText: string;
  sourceTitle: string;
  sourceType: ResearchSourceInputType;
}): ResearchSourceInput[] {
  const text = sourceText.trim();

  if (!text) {
    return [];
  }

  const now = new Date().toISOString();
  const title = sourceTitle.trim() || `${query || 'Manual'} source excerpt`;

  return [
    {
      title,
      sourceLabel: title,
      sourceType,
      fetchedAt: now,
      text,
    },
  ];
}

function attachSourceInputs(card: ResearchCard, sourceInputs: ResearchSourceInput[]) {
  return sourceInputs.length > 0
    ? {
        ...card,
        sourceInputs,
      }
    : card;
}

async function fetchBasicData(query: string): Promise<{ data: BasicCompanyData | null; error: string }> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 8000);

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
  const timeout = window.setTimeout(() => controller.abort(), 25000);

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

async function fetchResearchBrief(input?: LLMResearchInput): Promise<{ brief: ResearchBrief | null; error: string }> {
  if (!input) {
    return {
      brief: null,
      error: 'LLM Research Brief 缺少 facts/evidence 输入。',
    };
  }

  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 135000);

  try {
    const response = await fetch('/api/research-brief', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ llmResearchInput: input }),
      signal: controller.signal,
    });

    if (!response.ok) {
      return {
        brief: null,
        error: 'LLM 辅助摘要生成失败，已保留基础 ResearchReport 草稿。',
      };
    }

    const payload = await response.json() as { brief?: ResearchBrief };

    return {
      brief: payload.brief ?? null,
      error: payload.brief ? '' : 'LLM Research Brief 暂无可展示结果。',
    };
  } catch {
    return {
      brief: null,
      error: 'LLM 辅助摘要请求超时或失败，已保留基础 ResearchReport 草稿。',
    };
  } finally {
    window.clearTimeout(timeout);
  }
}

async function fetchResearchReport(card: ResearchCard): Promise<{ report: ResearchReport | null; error: string }> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 135000);

  try {
    const response = await fetch('/api/research-report', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ card }),
      signal: controller.signal,
    });

    if (!response.ok) {
      return {
        report: null,
        error: 'ResearchReport API 生成失败，已保留兼容报告。',
      };
    }

    const payload = await response.json() as { report?: ResearchReport };

    return {
      report: payload.report ?? null,
      error: payload.report ? '' : 'ResearchReport API 暂无可展示结果，已保留兼容报告。',
    };
  } catch {
    return {
      report: null,
      error: 'ResearchReport API 请求超时或失败，已保留兼容报告。',
    };
  } finally {
    window.clearTimeout(timeout);
  }
}

async function fetchTechnicalData(card: ResearchCard): Promise<{ snapshot: TechnicalDataSnapshot | null; error: string }> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch('/api/technical-data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ card }),
      signal: controller.signal,
    });

    if (!response.ok) {
      return {
        snapshot: null,
        error: 'Technical data adapter request failed; dashboard kept legacy fallback.',
      };
    }

    const payload = await response.json() as { snapshot?: TechnicalDataSnapshot };
    const snapshot = payload.snapshot ?? null;

    return {
      snapshot,
      error: snapshot?.status === 'unavailable'
        ? snapshot.warnings[0] ?? 'Technical data adapter returned no usable live data.'
        : '',
    };
  } catch {
    return {
      snapshot: null,
      error: 'Technical data adapter timed out; dashboard kept legacy fallback.',
    };
  } finally {
    window.clearTimeout(timeout);
  }
}

async function fetchSerenityMemo(input?: LLMResearchInput): Promise<{ memo: SerenityMemo | null; error: string }> {
  if (!input) {
    return {
      memo: null,
      error: 'Serenity Skill Memo 缺少 facts/evidence 输入。',
    };
  }

  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 135000);

  try {
    const response = await fetch('/api/serenity-memo', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ llmResearchInput: input }),
      signal: controller.signal,
    });

    if (!response.ok) {
      return {
        memo: null,
        error: 'Serenity Skill Memo 生成失败，已保留基础 ResearchReport 草稿。',
      };
    }

    const payload = await response.json() as { memo?: SerenityMemo };

    return {
      memo: payload.memo ?? null,
      error: payload.memo ? '' : 'Serenity Skill Memo 暂无可展示结果。',
    };
  } catch {
    return {
      memo: null,
      error: 'Serenity Skill Memo 请求超时或失败，已保留基础 ResearchReport 草稿。',
    };
  } finally {
    window.clearTimeout(timeout);
  }
}

export function TickerInputForm({ initialQuery = '' }: TickerInputFormProps) {
  const [query, setQuery] = useState(initialQuery);
  const [sourceText, setSourceText] = useState('');
  const [sourceTitle, setSourceTitle] = useState('');
  const [sourceType, setSourceType] = useState<ResearchSourceInputType>('manual_note');
  const [error, setError] = useState('');
  const [basicDataError, setBasicDataError] = useState('');
  const [earningsSnapshotError, setEarningsSnapshotError] = useState('');
  const [candidates, setCandidates] = useState<SecurityRecord[]>([]);
  const [basicData, setBasicData] = useState<BasicCompanyData | null>(null);
  const [earningsSnapshot, setEarningsSnapshot] = useState<EarningsSnapshotData | null>(null);
  const [generated, setGenerated] = useState<GeneratedState | null>(() => resolveInitialCard(initialQuery));
  const [isPending, startTransition] = useTransition();
  const [isBasicDataLoading, setIsBasicDataLoading] = useState(false);
  const [isEarningsSnapshotLoading, setIsEarningsSnapshotLoading] = useState(false);
  const [isResearchReportLoading, setIsResearchReportLoading] = useState(false);
  const [researchReportError, setResearchReportError] = useState('');
  const [isTechnicalDataLoading, setIsTechnicalDataLoading] = useState(false);
  const [technicalDataError, setTechnicalDataError] = useState('');
  const [isResearchBriefLoading, setIsResearchBriefLoading] = useState(false);
  const [researchBriefError, setResearchBriefError] = useState('');
  const [isSerenityMemoLoading, setIsSerenityMemoLoading] = useState(false);
  const [serenityMemoError, setSerenityMemoError] = useState('');

  async function attachResearchReport(card: ResearchCard) {
    setResearchReportError('');
    setIsResearchReportLoading(true);
    const result = await fetchResearchReport(card);
    setIsResearchReportLoading(false);

    if (result.error) {
      setResearchReportError(result.error);
    }

    if (!result.report) {
      return;
    }

    setGenerated((current) => {
      if (!current || current.card.slug !== card.slug) {
        return current;
      }

      const nextReport = current.card.technicalDataSnapshot
        ? attachTechnicalDataSnapshotToReport(result.report ?? current.report, current.card.technicalDataSnapshot)
        : result.report ?? current.report;

      return {
        ...current,
        report: nextReport,
      };
    });
  }

  async function attachTechnicalData(card: ResearchCard) {
    setTechnicalDataError('');
    setIsTechnicalDataLoading(true);
    const result = await fetchTechnicalData(card);
    setIsTechnicalDataLoading(false);

    if (result.error) {
      setTechnicalDataError(result.error);
    }

    if (!result.snapshot) {
      return;
    }

    const snapshot = result.snapshot;

    setGenerated((current) => {
      if (!current || current.card.slug !== card.slug) {
        return current;
      }

      const nextCard = {
        ...current.card,
        technicalDataSnapshot: snapshot,
      };
      const baseReport = current.report.generationState?.method === 'llm_research_report_json'
        ? current.report
        : buildReportForCardUpdate(current, nextCard);

      return {
        ...current,
        card: nextCard,
        report: attachTechnicalDataSnapshotToReport(baseReport, snapshot),
      };
    });
  }

  async function attachResearchBrief(card: ResearchCard) {
    setResearchBriefError('');
    setIsResearchBriefLoading(true);
    const result = await fetchResearchBrief(card.llmResearchInput);
    setIsResearchBriefLoading(false);

    if (result.error) {
      setResearchBriefError(result.error);
    }

    if (!result.brief) {
      return;
    }

    setGenerated((current) => {
      if (!current || current.card.slug !== card.slug) {
        return current;
      }

      const nextCard = {
        ...current.card,
        researchBrief: result.brief ?? undefined,
      };

      return {
        ...current,
        card: nextCard,
        report: buildReportForCardUpdate(current, nextCard),
      };
    });
  }

  async function attachSerenityMemo(card: ResearchCard) {
    setSerenityMemoError('');
    setIsSerenityMemoLoading(true);
    const result = await fetchSerenityMemo(card.llmResearchInput);
    setIsSerenityMemoLoading(false);

    if (result.error) {
      setSerenityMemoError(result.error);
    }

    if (!result.memo) {
      return;
    }

    setGenerated((current) => {
      if (!current || current.card.slug !== card.slug) {
        return current;
      }

      const nextCard = {
        ...current.card,
        serenityMemo: result.memo ?? undefined,
      };

      return {
        ...current,
        card: nextCard,
        report: buildReportForCardUpdate(current, nextCard),
      };
    });
  }

  function attachGeneratedAnalysis(card: ResearchCard) {
    void attachTechnicalData(card);
    void attachResearchReport(card);
    void attachResearchBrief(card);
    void attachSerenityMemo(card);
  }

  async function handleCandidateSelect(candidate: SecurityRecord) {
    const candidateInput = buildCandidateInput(candidate);
    setQuery(candidateInput);
    setError('');
    setBasicDataError('');
    setEarningsSnapshotError('');
    setResearchReportError('');
    setTechnicalDataError('');
    setResearchBriefError('');
    setSerenityMemoError('');
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
      cardType: DEFAULT_GENERATE_CARD_TYPE,
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

    const sourceInputs = buildManualSourceInputs({
      query: candidateInput,
      sourceText,
      sourceTitle,
      sourceType,
    });
    const cardWithSources = attachSourceInputs(result.card, sourceInputs);

    startTransition(() => {
      setGenerated(buildGeneratedState(cardWithSources, result.resolution.status === 'unmatched'));
    });
    attachGeneratedAnalysis(cardWithSources);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const resolution = resolveSecurityInput(query);

    if (!resolution.normalizedInput) {
      setError('请输入股票代码、Ticker 或中文名。');
      setCandidates([]);
      setGenerated(null);
      setResearchReportError('');
      setTechnicalDataError('');
      setResearchBriefError('');
      setSerenityMemoError('');
      return;
    }

    if (resolution.inputKind === 'unknown') {
      setError('暂不支持该输入格式。');
      setCandidates([]);
      setGenerated(null);
      setResearchReportError('');
      setTechnicalDataError('');
      setResearchBriefError('');
      setSerenityMemoError('');
      return;
    }

    if (resolution.status === 'ambiguous') {
      setError('匹配到多个证券，请选择候选项，或输入更精确的股票代码、Ticker 或中文名。');
      setCandidates(resolution.candidates);
      setGenerated(null);
      setResearchReportError('');
      setTechnicalDataError('');
      setResearchBriefError('');
      setSerenityMemoError('');
      return;
    }

    setError('');
    setBasicDataError('');
    setEarningsSnapshotError('');
    setResearchReportError('');
    setTechnicalDataError('');
    setResearchBriefError('');
    setSerenityMemoError('');
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
      cardType: DEFAULT_GENERATE_CARD_TYPE,
      basicData: basicDataResult.data ?? undefined,
      earningsSnapshotData: earningsSnapshotResult.data ?? undefined,
    });

    if (!result.ok) {
      setError(result.error);
      setCandidates(result.resolution.candidates);
      setGenerated(null);
      return;
    }

    const sourceInputs = buildManualSourceInputs({
      query,
      sourceText,
      sourceTitle,
      sourceType,
    });
    const cardWithSources = attachSourceInputs(result.card, sourceInputs);

    startTransition(() => {
      setGenerated(buildGeneratedState(cardWithSources, result.resolution.status === 'unmatched'));
    });
    attachGeneratedAnalysis(cardWithSources);
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

        <div className="mb-5 rounded-[8px] border border-[var(--brand-border)] bg-[var(--brand-soft)] p-3">
          <div className="text-xs font-semibold text-[var(--brand-ink)]">输出结构</div>
          <div className="mt-1 text-sm font-semibold text-[oklch(0.18_0.014_160)]">
            ResearchReport Schema
          </div>
          <p className="mt-1 text-xs leading-relaxed text-[oklch(0.43_0.018_160)]">
            固定输出执行摘要、财报与指引、买方情景、监控项和 References；旧 ResearchCard 结构仅作为缺失数据时的兼容输入。
          </p>
        </div>

        <div className="mb-5 rounded-[8px] border border-border bg-[oklch(0.985_0.004_95)] p-3">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <div className="text-xs font-semibold text-[var(--brand-ink)]">Source Ingestion</div>
              <div className="mt-1 text-sm font-semibold text-[oklch(0.18_0.014_160)]">来源摘录</div>
            </div>
            <span className="rounded-full border border-[var(--brand-border)] bg-white px-2.5 py-1 text-[11px] font-semibold text-[var(--brand-ink)]">
              v0.4.9
            </span>
          </div>
          <div className="grid gap-2">
            <input
              value={sourceTitle}
              onChange={(event) => setSourceTitle(event.target.value)}
              placeholder="10-Q / earnings transcript / news"
              className="h-10 w-full rounded-[8px] border border-border bg-white px-3 text-sm font-medium text-[oklch(0.18_0.014_160)] outline-none transition-colors placeholder:font-normal placeholder:text-[oklch(0.58_0.018_160)] focus:border-[var(--brand-border)] focus:ring-2 focus:ring-[var(--brand-soft)]"
            />
            <select
              value={sourceType}
              onChange={(event) => setSourceType(event.target.value as ResearchSourceInputType)}
              className="h-10 w-full rounded-[8px] border border-border bg-white px-3 text-sm font-medium text-[oklch(0.18_0.014_160)] outline-none transition-colors focus:border-[var(--brand-border)] focus:ring-2 focus:ring-[var(--brand-soft)]"
            >
              <option value="manual_note">Manual note</option>
              <option value="company_filing">Company filing</option>
              <option value="earnings_transcript">Earnings transcript</option>
              <option value="news">News</option>
              <option value="data_provider">Data provider</option>
              <option value="other">Other</option>
            </select>
            <textarea
              value={sourceText}
              onChange={(event) => setSourceText(event.target.value)}
              placeholder="Paste source excerpt"
              rows={5}
              className="min-h-28 w-full resize-y rounded-[8px] border border-border bg-white px-3 py-2 text-sm leading-relaxed text-[oklch(0.18_0.014_160)] outline-none transition-colors placeholder:text-[oklch(0.58_0.018_160)] focus:border-[var(--brand-border)] focus:ring-2 focus:ring-[var(--brand-soft)]"
            />
          </div>
          <div className="mt-2 text-xs font-medium text-[oklch(0.48_0.018_160)]">
            {sourceText.trim() ? `${sourceText.trim().length} chars queued` : 'Optional'}
          </div>
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
                生成执行视图
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setSourceText('');
              setSourceTitle('');
              setSourceType('manual_note');
              setError('');
              setBasicDataError('');
              setEarningsSnapshotError('');
              setResearchReportError('');
              setTechnicalDataError('');
              setResearchBriefError('');
              setSerenityMemoError('');
              setCandidates([]);
              setBasicData(null);
              setEarningsSnapshot(null);
              setGenerated(null);
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
          report={generated?.report ?? null}
          isFallback={generated?.isFallback}
          candidates={candidates}
          rawInput={query}
          basicData={basicData}
          earningsSnapshot={earningsSnapshot}
          researchBriefLoading={isResearchBriefLoading}
          researchBriefError={researchBriefError}
          researchReportLoading={isResearchReportLoading}
          researchReportError={researchReportError}
          technicalDataLoading={isTechnicalDataLoading}
          technicalDataError={technicalDataError}
          serenityMemoLoading={isSerenityMemoLoading}
          serenityMemoError={serenityMemoError}
        />
      </div>
    </div>
  );
}
