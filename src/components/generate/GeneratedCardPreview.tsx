import { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, FileText, Search, ChevronDown, ChevronUp } from 'lucide-react';
import { StockSymbolBadge } from '@/components/common/StockSymbolBadge';
import { EarningsSnapshotPanel } from '@/components/earnings/EarningsSnapshotPanel';
import { GuidanceComparePanel } from '@/components/earnings/GuidanceComparePanel';
import { BullBaseBearScenariosPanel } from '@/components/scenarios/BullBaseBearScenariosPanel';
import {
  SerenityAlphaPanel,
  BayesianValuationPanel,
  GfDmaHealthIndexPanel,
  TamAdjPegPanel,
  BuySideMemoPanel,
  SerenityDataNotice,
} from '@/components/serenity';
import { SecurityMatchBadge } from '@/components/security/SecurityMatchBadge';
import { SecurityMetadataRow } from '@/components/security/SecurityMetadataRow';
import { BasicCompanyData } from '@/types/basic-data';
import { EarningsSnapshotData } from '@/types/earnings';
import { ResearchCard } from '@/types/research-card';
import { SecurityInputKind, SecurityMarket, SecurityRecord, SecurityResolution } from '@/types/security';
import { getBullBaseBearScenarios } from '@/lib/scenarios/providers';
import { generateSerenityBundle } from '@/lib/serenity';

interface GeneratedCardPreviewProps {
  card: ResearchCard | null;
  isFallback?: boolean;
  candidates?: SecurityRecord[];
  rawInput?: string;
  basicData?: BasicCompanyData | null;
  earningsSnapshot?: EarningsSnapshotData | null;
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

export function GeneratedCardPreview({
  card,
  isFallback = false,
  candidates = [],
  rawInput = '',
  basicData = null,
  earningsSnapshot = null,
}: GeneratedCardPreviewProps) {
  // 获取 scenarios（用 useMemo 避免重新计算）
  const scenarios = useMemo(() => {
    if (!card) {
      return null;
    }

    let currentPrice: number | null = null;
    if (earningsSnapshot?.currentPrice !== null && earningsSnapshot?.currentPrice !== undefined) {
      currentPrice = earningsSnapshot.currentPrice;
    } else if (basicData?.quote?.price) {
      currentPrice = parseFloat(basicData.quote.price);
    }

    return getBullBaseBearScenarios({
      ticker: card.ticker,
      companyName: card.companyName,
      currency: 'USD',
      currentPrice,
      earningsSnapshot,
      basicData,
    });
  }, [card, basicData, earningsSnapshot]);

  // 获取 Serenity 分析包
  const serenityBundle = useMemo(() => {
    if (!card) {
      return null;
    }
    return generateSerenityBundle(card.ticker, card.companyName);
  }, [card]);

  // Serenity 面板展开状态
  const [showSerenity, setShowSerenity] = useState(false);
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
        输入股票代码、Ticker或中文名并点击生成后，这里会显示 mock 研究卡预览。
      </div>
    );
  }

  const keySignals = card.keySignals?.slice(0, 6) ?? card.fundamentals.revenueDrivers.slice(0, 6);
  const risks = (card.risks ?? card.fundamentals.risks).slice(0, 4);
  const badgeSymbol = getBadgeSymbol(card);
  const previewSecurity = getPreviewSecurity(card);
  const previewResolution = getPreviewResolution(card, isFallback, rawInput);
  const dataModeLabel = basicData && basicData.provider !== 'mock' ? '真实基础数据' : 'mock fallback';
  const sourceNote = `${card.sourceNote ?? card.disclaimer} 财报快照中的预测值和指引对比依赖第三方数据或文本抽取，需结合来源复核。`;

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
                  {isFallback ? 'Mock Fallback' : card.isMock ? 'Mock Preview' : 'Research Card'}
                </span>
                <span className="rounded-full border border-border bg-white px-2.5 py-1 font-mono text-xs text-[oklch(0.45_0.018_160)]">
                  {card.cardType}
                </span>
                <span className="rounded-full border border-border bg-white px-2.5 py-1 text-xs font-medium text-[oklch(0.45_0.018_160)]">
                  数据模式：{dataModeLabel}
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
            当前输入未匹配到 mock 主数据，已生成通用研究卡雏形。
          </p>
        )}

        {earningsSnapshot && (
          <div className="mb-4 space-y-4">
            <EarningsSnapshotPanel data={earningsSnapshot} />
            <GuidanceComparePanel
              guidance={earningsSnapshot.guidance}
              warnings={earningsSnapshot.warnings}
              evidence={earningsSnapshot.guidanceEvidence}
            />
          </div>
        )}

        {/* Scenarios Panel */}
        <div className="mb-4">
          <BullBaseBearScenariosPanel scenarios={scenarios} />
        </div>

        {/* Serenity Skills Analysis (可折叠) */}
        {serenityBundle && (
          <div className="mb-4">
            <button
              onClick={() => setShowSerenity(!showSerenity)}
              className="flex w-full items-center justify-between rounded-[8px] border border-[var(--brand-border)] bg-[var(--brand-soft)] p-3 text-left"
            >
              <div>
                <div className="text-xs font-semibold text-[var(--brand-ink)]">
                  Serenity Skills
                </div>
                <div className="text-sm text-[oklch(0.2_0.016_160)]">
                  买方研究框架分析（Alpha、Bayesian、GF-DMA、TAM-Adj-PEG）
                </div>
              </div>
              {showSerenity ? (
                <ChevronUp className="h-4 w-4 text-[var(--brand-ink)]" />
              ) : (
                <ChevronDown className="h-4 w-4 text-[var(--brand-ink)]" />
              )}
            </button>

            {showSerenity && (
              <div className="mt-2 space-y-2">
                {/* 数据状态提示 */}
                {serenityBundle?.dataNotice && (
                  <SerenityDataNotice customNotice={serenityBundle.dataNotice} />
                )}
                {/* 标签切换 */}
                <div className="flex flex-wrap gap-1">
                  <button
                    onClick={() => setActiveSerenityTab('memo')}
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      activeSerenityTab === 'memo'
                        ? 'bg-[var(--brand-ink)] text-white'
                        : 'bg-white border border-border text-[oklch(0.2_0.016_160)]'
                    }`}
                  >
                    买方备忘录
                  </button>
                  <button
                    onClick={() => setActiveSerenityTab('alpha')}
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      activeSerenityTab === 'alpha'
                        ? 'bg-[var(--brand-ink)] text-white'
                        : 'bg-white border border-border text-[oklch(0.2_0.016_160)]'
                    }`}
                  >
                    Serenity Alpha
                  </button>
                  <button
                    onClick={() => setActiveSerenityTab('bayesian')}
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      activeSerenityTab === 'bayesian'
                        ? 'bg-[var(--brand-ink)] text-white'
                        : 'bg-white border border-border text-[oklch(0.2_0.016_160)]'
                    }`}
                  >
                    贝叶斯估值
                  </button>
                  <button
                    onClick={() => setActiveSerenityTab('gf-dma')}
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      activeSerenityTab === 'gf-dma'
                        ? 'bg-[var(--brand-ink)] text-white'
                        : 'bg-white border border-border text-[oklch(0.2_0.016_160)]'
                    }`}
                  >
                    GF-DMA 健康指数
                  </button>
                  <button
                    onClick={() => setActiveSerenityTab('tam-adj-peg')}
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      activeSerenityTab === 'tam-adj-peg'
                        ? 'bg-[var(--brand-ink)] text-white'
                        : 'bg-white border border-border text-[oklch(0.2_0.016_160)]'
                    }`}
                  >
                    TAM-Adj-PEG
                  </button>
                </div>

                {/* 内容区域 */}
                <div className="space-y-4">
                  {activeSerenityTab === 'alpha' && (
                    <SerenityAlphaPanel analysis={serenityBundle.alphaAnalysis} />
                  )}
                  {activeSerenityTab === 'bayesian' && (
                    <BayesianValuationPanel analysis={serenityBundle.bayesianValuation} />
                  )}
                  {activeSerenityTab === 'gf-dma' && (
                    <GfDmaHealthIndexPanel analysis={serenityBundle.gfDmaHealthIndex} />
                  )}
                  {activeSerenityTab === 'tam-adj-peg' && (
                    <TamAdjPegPanel analysis={serenityBundle.tamAdjPeg} />
                  )}
                  {activeSerenityTab === 'memo' && (
                    <BuySideMemoPanel analysis={serenityBundle.buySideMemo} />
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="rounded-[8px] border-l-2 border-[var(--brand-dot)] bg-white p-4">
          <div className="mb-1 text-xs font-semibold text-[var(--brand-ink)]">一句话摘要</div>
          <p className="text-sm leading-relaxed text-[oklch(0.2_0.018_160)]">
            {card.summary.oneLine}
          </p>
        </div>
      </div>

      <div className="grid gap-4 p-4 sm:p-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <section className="rounded-[8px] border border-border bg-white p-4">
          <div className="mb-3 flex items-center gap-2 text-xs font-semibold text-[var(--brand-ink)]">
            <Search className="h-4 w-4" aria-hidden="true" />
            核心问题
          </div>
          <p className="text-base font-semibold leading-relaxed text-[oklch(0.18_0.014_160)]">
            {card.summary.keyQuestion}
          </p>
        </section>

        <section className="rounded-[8px] border border-border bg-white p-4">
          <div className="mb-3 flex items-center gap-2 text-xs font-semibold text-[var(--brand-ink)]">
            <FileText className="h-4 w-4" aria-hidden="true" />
            Bull/Bear
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            {card.summary.bullCase && (
              <div className="rounded-[8px] border border-border bg-[oklch(0.992_0.005_85)] p-3">
                <div className="mb-1 text-xs font-semibold text-[var(--brand-ink)]">Bull case</div>
                <p className="text-sm leading-relaxed text-[oklch(0.24_0.016_160)]">
                  {card.summary.bullCase}
                </p>
              </div>
            )}
            {card.summary.bearCase && (
              <div className="rounded-[8px] border border-[var(--risk-border)] bg-[var(--risk-soft)] p-3">
                <div className="mb-1 text-xs font-semibold text-[var(--risk-ink)]">Bear case</div>
                <p className="text-sm leading-relaxed text-[var(--risk-ink)]">
                  {card.summary.bearCase}
                </p>
              </div>
            )}
          </div>
        </section>
      </div>

      <div className="grid gap-4 border-t border-border p-4 sm:p-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)]">
        <section className="rounded-[8px] border border-border bg-[oklch(0.992_0.005_85)] p-4">
          <div className="mb-3 flex items-center gap-2 text-xs font-semibold text-[var(--brand-ink)]">
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            Key signals
          </div>
          <div className="flex flex-wrap gap-2">
            {keySignals.map((item) => (
              <span
                key={item}
                className="rounded-full border border-[var(--brand-border)] bg-white px-3 py-1.5 text-sm font-medium leading-relaxed text-[var(--brand-ink)]"
              >
                {item}
              </span>
            ))}
          </div>
        </section>

        <section className="rounded-[8px] border border-[var(--risk-border)] bg-[var(--risk-soft)] p-4">
          <div className="mb-3 flex items-center gap-2 text-xs font-semibold text-[var(--risk-ink)]">
            <AlertTriangle className="h-4 w-4" aria-hidden="true" />
            Risks to watch
          </div>
          <div className="space-y-2">
            {risks.map((item) => (
              <div key={item} className="rounded-[8px] border border-[var(--risk-border)] bg-white/55 p-3 text-sm leading-relaxed text-[var(--risk-ink)]">
                {item}
              </div>
            ))}
          </div>
        </section>
      </div>

      <p className="border-t border-border p-4 text-xs leading-relaxed text-[oklch(0.5_0.018_160)] sm:p-5">
        {sourceNote}
      </p>
    </article>
  );
}
