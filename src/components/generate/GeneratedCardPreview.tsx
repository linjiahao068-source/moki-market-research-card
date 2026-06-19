import { useMemo, useState } from 'react';
import { AlertTriangle, BarChart3, BrainCircuit, CheckCircle2, FileText, Gauge, Loader2, Search, ShieldCheck } from 'lucide-react';
import { StockSymbolBadge } from '@/components/common/StockSymbolBadge';
import { EnhancedEarningsSnapshotPanel } from '@/components/earnings/EnhancedEarningsSnapshotPanel';
import { EnhancedGuidanceComparePanel } from '@/components/earnings/EnhancedGuidanceComparePanel';
import { ResearchBriefPanel } from '@/components/research/ResearchBriefPanel';
import { BuySideReportPanel } from '@/components/research-report/BuySideReportPanel';
import { IntegratedResearchReportPanel } from '@/components/research-report/IntegratedResearchReportPanel';
import { TechnicalDashboardPanel } from '@/components/research-report/TechnicalDashboardPanel';
import { EnhancedBullBaseBearScenariosPanel } from '@/components/scenarios/EnhancedBullBaseBearScenariosPanel';
import {
  SerenityAlphaPanel,
  BayesianValuationPanel,
  GfDmaHealthIndexPanel,
  TamAdjPegPanel,
  BuySideMemoPanel,
  SerenityDataNotice,
  SerenitySkillMemoPanel,
} from '@/components/serenity';
import { SecurityMatchBadge } from '@/components/security/SecurityMatchBadge';
import { SecurityMetadataRow } from '@/components/security/SecurityMetadataRow';
import { BasicCompanyData } from '@/types/basic-data';
import { EarningsSnapshotData } from '@/types/earnings';
import { ResearchCard } from '@/types/research-card';
import type { ResearchReport } from '@/types/research-report';
import { SecurityInputKind, SecurityMarket, SecurityRecord, SecurityResolution } from '@/types/security';
import type { SerenitySkillId } from '@/types/serenity-memo';
import { getBullBaseBearScenarios } from '@/lib/scenarios/providers';
import { generateSerenityBundle, generateSerenityBundleFromRealData } from '@/lib/serenity';
import { ResearchModuleHeader } from './ResearchModuleHeader';

interface GeneratedCardPreviewProps {
  card: ResearchCard | null;
  report?: ResearchReport | null;
  isFallback?: boolean;
  candidates?: SecurityRecord[];
  rawInput?: string;
  basicData?: BasicCompanyData | null;
  earningsSnapshot?: EarningsSnapshotData | null;
  researchReportLoading?: boolean;
  researchReportError?: string;
  technicalDataLoading?: boolean;
  technicalDataError?: string;
  researchBriefLoading?: boolean;
  researchBriefError?: string;
  serenityMemoLoading?: boolean;
  serenityMemoError?: string;
}

function buildCandidateLabel(candidate: SecurityRecord) {
  return [candidate.symbol, candidate.numericCode, candidate.chineseNameHK, candidate.companyName, candidate.market]
    .filter(Boolean)
    .join(' · ');
}

function getPreviewSecurity(card: ResearchCard): SecurityRecord {
  return {
    id: card.slug,
    market: (card.market as SecurityMarket | undefined) ?? 'UNKNOWN',
    symbol: card.ticker,
    numericCode: card.numericCode,
    companyName: card.companyName,
    chineseNameHK: card.chineseName,
  };
}

function getPreviewResolution(card: ResearchCard, isFallback: boolean, rawInput: string): SecurityResolution {
  const inputKind = (card.matchType ?? (isFallback ? 'unknown' : 'symbol')) as SecurityInputKind;
  const normalizedInput = card.queryInput || rawInput || card.ticker;
  const previewSecurity = getPreviewSecurity(card);

  if (isFallback || card.matchStatus === 'unmatched') {
    return {
      status: 'unmatched',
      inputKind,
      rawInput: card.queryInput || rawInput,
      normalizedInput,
      fallbackSecurity: previewSecurity,
    };
  }

  return {
    status: 'matched',
    inputKind,
    matchType: card.matchType ?? 'symbol',
    rawInput: card.queryInput || rawInput,
    normalizedInput,
    security: previewSecurity,
  };
}

function getBadgeSymbol(card: ResearchCard) {
  if (card.matchType === 'numericCode' && card.numericCode) {
    return card.numericCode;
  }

  if (card.ticker && !/\p{Script=Han}/u.test(card.ticker)) {
    return card.ticker;
  }

  if (card.numericCode) {
    return card.numericCode;
  }

  if (card.queryInput && !/\p{Script=Han}/u.test(card.queryInput)) {
    return card.queryInput;
  }

  return '--';
}

function hasUsableSerenityData(
  basicData?: BasicCompanyData | null,
  earningsSnapshot?: EarningsSnapshotData | null
) {
  const hasBasicData = !!basicData &&
    basicData.provider !== 'mock' &&
    basicData.coverageStatus !== 'empty' &&
    basicData.coverageStatus !== 'failed';

  const hasEarningsData = !!earningsSnapshot && earningsSnapshot.provider !== 'mock';

  return hasBasicData || hasEarningsData;
}

function tabToSerenitySkill(tab: 'alpha' | 'bayesian' | 'gf-dma' | 'tam-adj-peg' | 'memo'): SerenitySkillId {
  if (tab === 'alpha') {
    return 'serenity_alpha';
  }

  if (tab === 'bayesian') {
    return 'bayesian';
  }

  if (tab === 'gf-dma') {
    return 'gf_dma';
  }

  if (tab === 'tam-adj-peg') {
    return 'tam_adj_peg';
  }

  return 'buy_side_memo';
}

function shortDate(value?: string) {
  if (!value) {
    return undefined;
  }

  return value.slice(0, 10);
}

function uniqueStrings(values: Array<string | undefined>) {
  return Array.from(new Set(values.filter((item): item is string => Boolean(item))));
}

function EmptyModuleState({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-[8px] border border-dashed border-border bg-white p-4 text-sm leading-relaxed text-[oklch(0.46_0.018_160)]">
      <div className="mb-1 font-semibold text-[oklch(0.22_0.018_160)]">{title}</div>
      {body}
    </div>
  );
}

export function GeneratedCardPreview({
  card,
  report = null,
  isFallback = false,
  candidates = [],
  rawInput = '',
  basicData = null,
  earningsSnapshot = null,
  researchReportLoading = false,
  researchReportError = '',
  technicalDataLoading = false,
  technicalDataError = '',
  researchBriefLoading = false,
  researchBriefError = '',
  serenityMemoLoading = false,
  serenityMemoError = '',
}: GeneratedCardPreviewProps) {
  // 获取 scenarios（用 useMemo 避免重新计算）
  const scenarios = useMemo(() => {
    if (!card) {
      return null;
    }

    if (card.advancedScenarios) {
      return card.advancedScenarios;
    }

    const activeEarningsSnapshot = earningsSnapshot ?? card.enhancedEarnings ?? null;
    let currentPrice: number | null = null;
    if (activeEarningsSnapshot?.currentPrice !== null && activeEarningsSnapshot?.currentPrice !== undefined) {
      currentPrice = activeEarningsSnapshot.currentPrice;
    } else if (basicData?.quote?.price) {
      currentPrice = parseFloat(basicData.quote.price);
    }

    return getBullBaseBearScenarios({
      ticker: card.ticker,
      companyName: card.companyName,
      currency: 'USD',
      currentPrice,
      earningsSnapshot: activeEarningsSnapshot,
      basicData,
    });
  }, [card, basicData, earningsSnapshot]);

  // 获取 Serenity 分析包
  const serenityBundle = useMemo(() => {
    if (!card) {
      return null;
    }

    if (card.serenityAnalysis) {
      return card.serenityAnalysis;
    }

    const activeEarningsSnapshot = earningsSnapshot ?? card.enhancedEarnings ?? null;
    if (hasUsableSerenityData(basicData, activeEarningsSnapshot)) {
      try {
        return generateSerenityBundleFromRealData({
          ticker: card.ticker,
          companyName: card.companyName,
          security: getPreviewSecurity(card),
          basicData: basicData ?? undefined,
          earningsSnapshot: activeEarningsSnapshot ?? undefined,
        });
      } catch {
        return generateSerenityBundle(card.ticker, card.companyName);
      }
    }

    return generateSerenityBundle(card.ticker, card.companyName);
  }, [card, basicData, earningsSnapshot]);

  const [activeSerenityTab, setActiveSerenityTab] = useState<'alpha' | 'bayesian' | 'gf-dma' | 'tam-adj-peg' | 'memo'>('memo');

  if (!card && candidates.length > 0) {
    return (
      <div className="rounded-[8px] border border-[var(--brand-border)] bg-[var(--brand-soft)] p-5">
        <div className="mb-3 inline-flex w-fit items-center gap-2 rounded-full border border-[var(--brand-border)] bg-white px-3 py-1 text-xs font-semibold text-[var(--brand-ink)]">
          需要更精确输入
        </div>
        <h2 className="mb-2 text-xl font-bold leading-tight text-[oklch(0.16_0.014_160)]">
          找到多个候选证券
        </h2>
        <p className="mb-4 text-sm leading-relaxed text-[oklch(0.43_0.018_160)]">
          用户输入：{rawInput || '—'}。请从下面候选项中选择更精确的股票代码、Ticker或中文名后再次生成。
        </p>
        <div className="space-y-2">
          {candidates.map((candidate) => (
            <div key={candidate.id} className="rounded-[8px] border border-[var(--brand-border)] bg-white p-3 text-sm leading-relaxed text-[oklch(0.24_0.016_160)]">
              {buildCandidateLabel(candidate)}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!card) {
    return (
      <div className="rounded-[8px] border border-dashed border-border bg-white p-5 text-sm leading-relaxed text-[oklch(0.48_0.018_160)]">
        输入股票代码、Ticker 或中文名并点击生成后，这里会显示 Executive Investment View。
      </div>
    );
  }

  const keySignals = card.keySignals?.slice(0, 6) ?? card.fundamentals.revenueDrivers.slice(0, 6);
  const risks = (card.risks ?? card.fundamentals.risks).slice(0, 4);
  const badgeSymbol = getBadgeSymbol(card);
  const previewSecurity = getPreviewSecurity(card);
  const previewResolution = getPreviewResolution(card, isFallback, rawInput);
  const activeEarningsSnapshot = earningsSnapshot ?? card.enhancedEarnings ?? null;
  const activeGuidanceMeta = activeEarningsSnapshot as (EarningsSnapshotData & {
    guidanceSource?: string;
  }) | null;
  const realDataAvailable = Boolean(
    card.dataQuality?.realDataAvailable ||
    hasUsableSerenityData(basicData, activeEarningsSnapshot)
  );
  const dataModeLabel = realDataAvailable ? '真实数据' : 'fallback';
  const sourceNote = `${card.sourceNote ?? card.disclaimer} 财报快照中的预测值和指引对比依赖第三方数据或文本抽取，需结合来源复核。`;
  const guidance = card.guidanceData?.guidance ?? activeEarningsSnapshot?.guidance ?? [];
  const guidanceEvidence = card.guidanceData?.guidanceEvidence ?? activeEarningsSnapshot?.guidanceEvidence ?? [];
  const guidanceWarnings = card.guidanceData?.warnings ?? activeEarningsSnapshot?.warnings ?? [];
  const primarySource = card.dataQuality?.sourceSummary ?? (uniqueStrings([
    basicData?.provider,
    activeEarningsSnapshot?.provider,
    guidanceEvidence.length > 0 ? 'guidance evidence' : undefined,
  ]).join(' + ') || dataModeLabel);
  const updatedAt = shortDate(activeEarningsSnapshot?.fetchedAt ?? basicData?.fetchedAt ?? card.generatedAt ?? card.updatedAt);
  const hasResearchBrief = Boolean(card.researchBrief || researchBriefLoading || researchBriefError);
  const hasSerenityMemo = Boolean(card.serenityMemo || serenityMemoLoading || serenityMemoError);
  const scenarioDiagnostics = scenarios?.warnings ?? [];
  const serenityDiagnostics = uniqueStrings([
    ...(card.serenityMemo?.dataLimitations ?? []),
    ...(card.serenityMemo?.warnings ?? []),
    serenityBundle?.dataNotice,
  ]);
  const reportReferenceCount = report?.evidenceReferences.length ?? 0;
  const reportMissingReferenceCount = report?.evidenceLayer.summary.missingReferenceCount ?? 0;
  const reportSourceRecordCount = report?.sourceIngestionState.records.length ?? 0;
  const reportSourceChunkCount = report?.sourceIngestionState.chunks.length ?? 0;
  const reportGenerationState = report?.generationState;
  const reportModeLabel = reportGenerationState?.method === 'llm_research_report_json'
    ? '原生 API'
    : '兼容输入';
  const reportProviderLabel = [
    reportGenerationState?.provider,
    reportGenerationState?.model,
  ].filter(Boolean).join(' / ') || (report?.legacy ? 'legacy-adapter' : 'unknown');
  const reportWarnings = uniqueStrings([
    researchReportError,
    ...(reportGenerationState?.warnings ?? []),
  ]);
  const integratedReport = report?.integratedReport;
  const buySideReport = report?.buySideReport;
  const integratedReviewCount = integratedReport
    ? integratedReport.reviewQueue.length + integratedReport.readiness.evidenceMissingCount
    : 0;
  const buySideReviewCount = buySideReport
    ? buySideReport.generationState.missingReferenceCount + buySideReport.generationState.warnings.length
    : 0;
  const technicalDashboard = report?.technicalDashboard;
  const technicalGapCount = technicalDashboard
    ? technicalDashboard.summary.missingReferenceCount + technicalDashboard.summary.warningCount
    : 0;
  const technicalLiveDataAvailable = Boolean(technicalDashboard?.summary.liveDataAvailable);
  const technicalTitle = technicalLiveDataAvailable
    ? 'Technical Structure Dashboard'
    : 'Technical Structure Dashboard Fallback';
  const technicalDescription = technicalLiveDataAvailable
    ? 'Yahoo chart candlestick view, EMA overlays, volume bars, calculated indicators, benchmark relative strength, key zones, and scenario read-through from the current ResearchReport.'
    : 'Legacy technical-context fallback with adapter readiness, key zones, scenario read-through, and gaps while live K-line data is unavailable.';

  return (
    <article className="overflow-hidden rounded-[8px] border border-border bg-white shadow-[0_12px_40px_-32px_rgba(0,0,0,0.28)]">
      <div className="border-b border-border bg-[oklch(0.992_0.005_85)] p-4 sm:p-5">
        <div className="mb-4 flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <StockSymbolBadge symbol={badgeSymbol} className="flex-shrink-0 rounded-[8px] sm:h-14 sm:w-14" />
            <div className="min-w-0">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-full border border-[var(--brand-border)] bg-[var(--brand-soft)] px-3 py-1 text-xs font-semibold text-[var(--brand-ink)]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--brand-dot)]" />
                  {isFallback || card.isMock ? 'ResearchReport Fallback' : 'ResearchReport Draft'}
                </span>
                <span className="rounded-full border border-border bg-white px-2.5 py-1 text-xs font-medium text-[oklch(0.45_0.018_160)]">
                  资料：{dataModeLabel}
                </span>
              </div>
              <p className="text-sm text-[oklch(0.48_0.018_160)]">{card.companyName}</p>
              <h2 className="mt-1 text-2xl font-bold leading-tight text-[oklch(0.16_0.014_160)]">
                {card.title}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-[oklch(0.43_0.018_160)]">
                {card.subtitle}
              </p>
            </div>
          </div>
        </div>

        <div className="mb-4 rounded-[8px] border border-border bg-white p-3">
          <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-[oklch(0.45_0.018_160)]">
            <div>
              <span className="font-semibold text-[oklch(0.22_0.018_160)]">用户输入：</span>
              {card.queryInput || rawInput || '—'}
            </div>
            <SecurityMatchBadge resolution={previewResolution} />
          </div>
          <SecurityMetadataRow security={previewSecurity} matchType={card.matchType} />
        </div>

        {isFallback && (
          <p className="mb-4 rounded-[8px] border border-[var(--brand-border)] bg-[var(--brand-soft)] p-3 text-xs leading-relaxed text-[var(--brand-ink)]">
            当前输入未匹配到证券主数据，已生成待补齐的通用研究视图。
          </p>
        )}

        {report && (
          <section className="mb-4 rounded-[8px] border border-[var(--brand-border)] bg-[var(--brand-soft)] p-4">
            <div className="mb-3 flex min-w-0 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="mb-1 flex items-center gap-2 text-xs font-semibold text-[var(--brand-ink)]">
                  <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                  ResearchReport 输出契约
                </div>
                <div className="text-sm font-semibold text-[oklch(0.18_0.014_160)]">
                  {report.schemaVersion} / {report.reportType}
                </div>
                <div className="mt-1 text-xs text-[oklch(0.45_0.018_160)]">
                  {reportProviderLabel} / chunks {reportSourceChunkCount}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {researchReportLoading && (
                  <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-[var(--brand-border)] bg-white px-2.5 py-1 text-xs font-semibold text-[var(--brand-ink)]">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                    API 生成中
                  </span>
                )}
                <span className="w-fit rounded-full border border-[var(--brand-border)] bg-white px-2.5 py-1 text-xs font-semibold text-[var(--brand-ink)]">
                  {reportModeLabel}
                </span>
              </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-4">
              <div className="rounded-[8px] border border-[var(--brand-border)] bg-white px-3 py-2">
                <div className="text-[11px] font-semibold text-[oklch(0.48_0.018_160)]">Sections</div>
                <div className="font-mono text-lg font-semibold text-[oklch(0.18_0.014_160)]">
                  {report.sections.length}
                </div>
              </div>
              <div className="rounded-[8px] border border-[var(--brand-border)] bg-white px-3 py-2">
                <div className="text-[11px] font-semibold text-[oklch(0.48_0.018_160)]">References</div>
                <div className="font-mono text-lg font-semibold text-[oklch(0.18_0.014_160)]">
                  {reportReferenceCount}
                </div>
              </div>
              <div className="rounded-[8px] border border-[var(--brand-border)] bg-white px-3 py-2">
                <div className="text-[11px] font-semibold text-[oklch(0.48_0.018_160)]">待补引用</div>
                <div className="font-mono text-lg font-semibold text-[oklch(0.18_0.014_160)]">
                  {reportMissingReferenceCount}
                </div>
              </div>
              <div className="rounded-[8px] border border-[var(--brand-border)] bg-white px-3 py-2">
                <div className="text-[11px] font-semibold text-[oklch(0.48_0.018_160)]">Sources</div>
                <div className="font-mono text-lg font-semibold text-[oklch(0.18_0.014_160)]">
                  {reportSourceRecordCount}
                </div>
              </div>
            </div>
            {reportWarnings.length > 0 && (
              <div className="mt-3 rounded-[8px] border border-[var(--brand-border)] bg-white px-3 py-2 text-xs leading-relaxed text-[var(--brand-ink)]">
                {reportWarnings.slice(0, 2).map((warning) => (
                  <div key={warning}>{warning}</div>
                ))}
              </div>
            )}
          </section>
        )}

        {integratedReport && report && (
          <section className="mb-5">
            <div className="mb-3 rounded-[8px] border border-[var(--brand-border)] bg-white p-4">
              <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="mb-1 text-xs font-semibold text-[var(--brand-ink)]">
                    Primary Output
                  </div>
                  <h3 className="text-lg font-bold leading-tight text-[oklch(0.16_0.014_160)]">
                    Integrated Research Report
                  </h3>
                  <p className="mt-1 text-xs leading-relaxed text-[oklch(0.45_0.018_160)]">
                    Unified readiness, source audit, buy-side thesis, technical K-line state, evidence gaps, and review queue from the current ResearchReport.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full border border-[var(--brand-border)] bg-[var(--brand-soft)] px-2.5 py-1 text-xs font-semibold text-[var(--brand-ink)]">
                    {integratedReport.status}
                  </span>
                  <span className="rounded-full border border-border bg-[oklch(0.992_0.005_85)] px-2.5 py-1 text-xs font-semibold text-[oklch(0.36_0.018_160)]">
                    Review {integratedReviewCount}
                  </span>
                  <span className="rounded-full border border-border bg-[oklch(0.992_0.005_85)] px-2.5 py-1 text-xs font-semibold text-[oklch(0.36_0.018_160)]">
                    K-line {integratedReport.sourceAudit.technicalChartAvailable ? 'on' : 'pending'}
                  </span>
                </div>
              </div>
            </div>
            <IntegratedResearchReportPanel report={report} />
          </section>
        )}

        {buySideReport && report && (
          <section className="mb-5">
            <div className="mb-3 rounded-[8px] border border-[var(--brand-border)] bg-white p-4">
              <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="mb-1 text-xs font-semibold text-[var(--brand-ink)]">
                    Report Pillar
                  </div>
                  <h3 className="text-lg font-bold leading-tight text-[oklch(0.16_0.014_160)]">
                    Buy-Side Research Report
                  </h3>
                  <p className="mt-1 text-xs leading-relaxed text-[oklch(0.45_0.018_160)]">
                    Investment view, key debates, business quality, scenarios, monitoring plan, and source audit from the current ResearchReport.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full border border-[var(--brand-border)] bg-[var(--brand-soft)] px-2.5 py-1 text-xs font-semibold text-[var(--brand-ink)]">
                    {buySideReport.status}
                  </span>
                  <span className="rounded-full border border-border bg-[oklch(0.992_0.005_85)] px-2.5 py-1 text-xs font-semibold text-[oklch(0.36_0.018_160)]">
                    Review {buySideReviewCount}
                  </span>
                </div>
              </div>
            </div>
            <BuySideReportPanel report={report} />
          </section>
        )}

        {technicalDashboard && report && (
          <section className="mb-5">
            <div className="mb-3 rounded-[8px] border border-[var(--brand-border)] bg-white p-4">
              <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="mb-1 text-xs font-semibold text-[var(--brand-ink)]">
                    Technical Structure
                  </div>
                  <h3 className="text-lg font-bold leading-tight text-[oklch(0.16_0.014_160)]">
                    {technicalTitle}
                  </h3>
                  <p className="mt-1 text-xs leading-relaxed text-[oklch(0.45_0.018_160)]">
                    {technicalDescription}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {technicalDataLoading && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--brand-border)] bg-white px-2.5 py-1 text-xs font-semibold text-[var(--brand-ink)]">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                      K-line loading
                    </span>
                  )}
                  <span className="rounded-full border border-[var(--brand-border)] bg-[var(--brand-soft)] px-2.5 py-1 text-xs font-semibold text-[var(--brand-ink)]">
                    {technicalDashboard.status}
                  </span>
                  <span className="rounded-full border border-border bg-[oklch(0.992_0.005_85)] px-2.5 py-1 text-xs font-semibold text-[oklch(0.36_0.018_160)]">
                    Live data {technicalDashboard.summary.liveDataAvailable ? 'on' : 'off'}
                  </span>
                  <span className="rounded-full border border-border bg-[oklch(0.992_0.005_85)] px-2.5 py-1 text-xs font-semibold text-[oklch(0.36_0.018_160)]">
                    Gaps {technicalGapCount}
                  </span>
                </div>
              </div>
              {technicalDataError && (
                <div className="mt-3 rounded-[8px] border border-[var(--risk-border)] bg-[var(--risk-soft)] px-3 py-2 text-xs leading-relaxed text-[var(--risk-ink)]">
                  {technicalDataError}
                </div>
              )}
            </div>
            <TechnicalDashboardPanel report={report} />
          </section>
        )}

        <details className="mb-5 rounded-[8px] border border-border bg-white p-3" open={!buySideReport}>
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-[oklch(0.22_0.018_160)]">
            <span className="inline-flex items-center gap-2">
              <FileText className="h-4 w-4 text-[var(--brand-ink)]" aria-hidden="true" />
              Supporting Research Modules
            </span>
            <span className="rounded-full border border-border bg-muted px-2.5 py-1 text-xs text-[oklch(0.45_0.018_160)]">
              legacy diagnostics
            </span>
          </summary>
          <div className="mt-4">
        <div className="mb-4 grid gap-3 lg:grid-cols-[minmax(0,1.12fr)_minmax(280px,0.88fr)]">
          <section className="rounded-[8px] border border-border bg-white p-4">
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-[var(--brand-ink)]">
              <FileText className="h-4 w-4" aria-hidden="true" />
              决策摘要
            </div>
            <p className="text-sm leading-relaxed text-[oklch(0.2_0.018_160)]">
              {card.summary.oneLine}
            </p>
            <div className="mt-3 border-t border-border pt-3">
              <div className="mb-1 flex items-center gap-2 text-xs font-semibold text-[var(--brand-ink)]">
                <Search className="h-4 w-4" aria-hidden="true" />
                核心问题
              </div>
              <p className="text-base font-semibold leading-relaxed text-[oklch(0.18_0.014_160)]">
                {card.summary.keyQuestion}
              </p>
            </div>
          </section>

          <section className="rounded-[8px] border border-border bg-white p-4">
            <div className="mb-3 text-xs font-semibold text-[var(--brand-ink)]">Bull / Bear 快照</div>
            <div className="space-y-3">
              {card.summary.bullCase && (
                <div className="border-l-2 border-[var(--brand-dot)] pl-3">
                  <div className="mb-1 text-xs font-semibold text-[var(--brand-ink)]">Bull case</div>
                  <p className="text-sm leading-relaxed text-[oklch(0.24_0.016_160)]">
                    {card.summary.bullCase}
                  </p>
                </div>
              )}
              {card.summary.bearCase && (
                <div className="border-l-2 border-[var(--risk-ink)] pl-3">
                  <div className="mb-1 text-xs font-semibold text-[var(--risk-ink)]">Bear case</div>
                  <p className="text-sm leading-relaxed text-[var(--risk-ink)]">
                    {card.summary.bearCase}
                  </p>
                </div>
              )}
            </div>
          </section>
        </div>

        {hasResearchBrief && (
          <details className="mb-5 rounded-[8px] border border-[var(--brand-border)] bg-white p-3">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-[var(--brand-ink)]">
              <span className="inline-flex items-center gap-2">
                <BrainCircuit className="h-4 w-4" aria-hidden="true" />
                ResearchReport 辅助摘要
              </span>
              <span className="rounded-full border border-[var(--brand-border)] bg-[var(--brand-soft)] px-2.5 py-1 text-xs">
                辅助解读
              </span>
            </summary>
            <div className="mt-3">
              <ResearchBriefPanel
                brief={card.researchBrief}
                isLoading={researchBriefLoading}
                error={researchBriefError}
              />
            </div>
          </details>
        )}

        <div className="space-y-5">
          <section className="space-y-3">
            <ResearchModuleHeader
              icon={<BarChart3 className="h-4 w-4" aria-hidden="true" />}
              title="财报快照"
              subtitle="只保留本次财报最需要先看的收入、利润、EPS 与来源提示。"
              source={activeEarningsSnapshot?.provider ?? primarySource}
              generatedBy="数据层"
              updatedAt={updatedAt}
              diagnostics={activeEarningsSnapshot?.warnings ?? []}
            />
            {activeEarningsSnapshot ? (
              <EnhancedEarningsSnapshotPanel data={activeEarningsSnapshot} />
            ) : (
              <EmptyModuleState
                title="暂无财报快照"
                body="当前标的还没有可用的财报数据，仍可查看 ResearchReport 草稿和后续补数提示。"
              />
            )}
          </section>

          <section className="space-y-3">
            <ResearchModuleHeader
              icon={<ShieldCheck className="h-4 w-4" aria-hidden="true" />}
              title="公司指引"
              subtitle="把结构化指引、SEC/Yahoo/FMP 证据和缺失原因放在同一模块。"
              source={card.guidanceData?.source ?? activeGuidanceMeta?.guidanceSource ?? activeEarningsSnapshot?.provider ?? primarySource}
              generatedBy={guidanceEvidence.length > 0 ? '文本抽取' : '数据层'}
              updatedAt={updatedAt}
              diagnostics={guidanceWarnings}
            />
            {activeEarningsSnapshot ? (
              <EnhancedGuidanceComparePanel
                guidance={guidance}
                guidanceEvidence={guidanceEvidence}
                warnings={guidanceWarnings}
                source={card.guidanceData?.source ?? activeGuidanceMeta?.guidanceSource}
              />
            ) : (
              <EmptyModuleState
                title="暂无公司指引"
                body="公司指引依赖财报、新闻稿或 SEC 附件文本；当前尚未取得可展示证据。"
              />
            )}
          </section>

          <section className="space-y-3">
            <ResearchModuleHeader
              icon={<Gauge className="h-4 w-4" aria-hidden="true" />}
              title="买方情景推演"
              subtitle="保留 Bull/Base/Bear 的变量、概率和触发条件，不把情景价格当成投资建议。"
              source={scenarios ? `scenario ${scenarios.dataStatus}` : 'scenario provider'}
              generatedBy={scenarios?.dataStatus === 'placeholder' ? 'fallback' : '规则引擎'}
              updatedAt={updatedAt}
              diagnostics={scenarioDiagnostics}
            />
            <EnhancedBullBaseBearScenariosPanel scenarios={scenarios} />
          </section>

          <section className="space-y-3">
            <ResearchModuleHeader
              icon={<BrainCircuit className="h-4 w-4" aria-hidden="true" />}
              title="Serenity Skill 框架"
              subtitle="统一展示买方备忘录、Alpha、Bayesian、GF-DMA 和 TAM-Adj-PEG 的结构化结论或缺失项。"
              source={card.serenityMemo?.provider ?? primarySource}
              generatedBy={hasSerenityMemo ? 'LLM / fallback' : 'Serenity 规则'}
              updatedAt={shortDate(card.serenityMemo?.generatedAt) ?? updatedAt}
              diagnostics={serenityDiagnostics}
            />
            {serenityBundle?.dataNotice && !card.serenityMemo && (
              <SerenityDataNotice customNotice={serenityBundle.dataNotice} />
            )}
            <div className="flex flex-wrap gap-1">
              {[
                ['memo', '买方备忘录'],
                ['alpha', 'Serenity Alpha'],
                ['bayesian', '贝叶斯估值'],
                ['gf-dma', 'GF-DMA'],
                ['tam-adj-peg', 'TAM-Adj-PEG'],
              ].map(([tab, label]) => (
                <button
                  key={tab}
                  onClick={() => setActiveSerenityTab(tab as 'alpha' | 'bayesian' | 'gf-dma' | 'tam-adj-peg' | 'memo')}
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    activeSerenityTab === tab
                      ? 'bg-[var(--brand-ink)] text-white'
                      : 'border border-border bg-white text-[oklch(0.2_0.016_160)]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="space-y-4">
              {(card.serenityMemo || serenityMemoLoading || serenityMemoError) ? (
                <SerenitySkillMemoPanel
                  memo={card.serenityMemo}
                  isLoading={serenityMemoLoading}
                  error={serenityMemoError}
                  mode={activeSerenityTab === 'memo' ? 'overview' : 'skill'}
                  skillId={tabToSerenitySkill(activeSerenityTab)}
                />
              ) : (
                <>
                  {activeSerenityTab === 'alpha' && (
                    <SerenityAlphaPanel analysis={serenityBundle?.alphaAnalysis} />
                  )}
                  {activeSerenityTab === 'bayesian' && (
                    <BayesianValuationPanel analysis={serenityBundle?.bayesianValuation} />
                  )}
                  {activeSerenityTab === 'gf-dma' && (
                    <GfDmaHealthIndexPanel analysis={serenityBundle?.gfDmaHealthIndex} />
                  )}
                  {activeSerenityTab === 'tam-adj-peg' && (
                    <TamAdjPegPanel analysis={serenityBundle?.tamAdjPeg} />
                  )}
                  {activeSerenityTab === 'memo' && (
                    <BuySideMemoPanel analysis={serenityBundle?.buySideMemo} />
                  )}
                </>
              )}
            </div>
          </section>
        </div>
          </div>
        </details>

        <details className="mt-5 rounded-[8px] border border-border bg-white p-3">
          <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-semibold text-[oklch(0.22_0.018_160)]">
            <CheckCircle2 className="h-4 w-4 text-[var(--brand-ink)]" aria-hidden="true" />
            追踪清单与风险
          </summary>
          <div className="mt-3 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)]">
            <section>
              <div className="mb-2 text-xs font-semibold text-[var(--brand-ink)]">Key signals</div>
              <div className="flex flex-wrap gap-2">
                {keySignals.map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-[var(--brand-border)] bg-[var(--brand-soft)] px-3 py-1.5 text-sm font-medium leading-relaxed text-[var(--brand-ink)]"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </section>

            <section>
              <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-[var(--risk-ink)]">
                <AlertTriangle className="h-4 w-4" aria-hidden="true" />
                Risks to watch
              </div>
              <div className="space-y-2">
                {risks.map((item) => (
                  <div key={item} className="border-l-2 border-[var(--risk-ink)] pl-3 text-sm leading-relaxed text-[var(--risk-ink)]">
                    {item}
                  </div>
                ))}
              </div>
            </section>
          </div>
        </details>
      </div>

      <p className="border-t border-border p-4 text-xs leading-relaxed text-[oklch(0.5_0.018_160)] sm:p-5">
        {sourceNote}
      </p>
    </article>
  );
}
