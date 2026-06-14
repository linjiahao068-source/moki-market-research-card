import { AlertTriangle, CheckCircle2, FileText, Search } from 'lucide-react';
import { StockSymbolBadge } from '@/components/common/StockSymbolBadge';
import { ResearchCard } from '@/types/research-card';
import { SecurityRecord } from '@/types/security';

interface GeneratedCardPreviewProps {
  card: ResearchCard | null;
  isFallback?: boolean;
  candidates?: SecurityRecord[];
  rawInput?: string;
}

function getMatchStatusLabel(card: ResearchCard, isFallback: boolean) {
  if (isFallback || card.matchStatus === 'unmatched') {
    return '未匹配主数据，使用通用 mock 卡';
  }

  return '已匹配 mock 主数据';
}

function getMatchTypeLabel(matchType?: ResearchCard['matchType']) {
  if (matchType === 'numericCode') {
    return '数字代码';
  }

  if (matchType === 'chineseName') {
    return '中文名';
  }

  if (matchType === 'symbol') {
    return 'Ticker';
  }

  return '通用输入';
}

function buildCandidateLabel(candidate: SecurityRecord) {
  return [candidate.symbol, candidate.numericCode, candidate.chineseNameHK, candidate.companyName, candidate.market]
    .filter(Boolean)
    .join(' · ');
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
}: GeneratedCardPreviewProps) {
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
          用户输入：{rawInput || '—'}。请从下面候选项中选择更精确的股票代码、Ticker 或中文名后再次生成。
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
        输入股票代码、Ticker 或中文名并点击生成后，这里会显示 mock 研究卡预览。
      </div>
    );
  }

  const keySignals = card.keySignals?.slice(0, 6) ?? card.fundamentals.revenueDrivers.slice(0, 6);
  const risks = (card.risks ?? card.fundamentals.risks).slice(0, 4);
  const statusLabel = getMatchStatusLabel(card, isFallback);
  const matchTypeLabel = getMatchTypeLabel(card.matchType);
  const badgeSymbol = getBadgeSymbol(card);

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

        <div className="mb-4 grid gap-2 rounded-[8px] border border-border bg-white p-3 text-xs text-[oklch(0.45_0.018_160)] sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <span className="font-semibold text-[oklch(0.22_0.018_160)]">用户输入：</span>
            {card.queryInput || rawInput || '—'}
          </div>
          <div>
            <span className="font-semibold text-[oklch(0.22_0.018_160)]">匹配状态：</span>
            {statusLabel}
          </div>
          <div>
            <span className="font-semibold text-[oklch(0.22_0.018_160)]">匹配方式：</span>
            {matchTypeLabel}
          </div>
          <div>
            <span className="font-semibold text-[oklch(0.22_0.018_160)]">symbol：</span>
            {card.ticker || '—'}
          </div>
          <div>
            <span className="font-semibold text-[oklch(0.22_0.018_160)]">numericCode：</span>
            {card.numericCode || '—'}
          </div>
          <div>
            <span className="font-semibold text-[oklch(0.22_0.018_160)]">中文名：</span>
            {card.chineseName || '—'}
          </div>
          <div>
            <span className="font-semibold text-[oklch(0.22_0.018_160)]">market：</span>
            {card.market || 'UNKNOWN'}
          </div>
        </div>

        {isFallback && (
          <p className="mb-4 rounded-[8px] border border-[var(--brand-border)] bg-[var(--brand-soft)] p-3 text-xs leading-relaxed text-[var(--brand-ink)]">
            当前证券未匹配到 mock 主数据，已按输入生成通用研究卡雏形。
          </p>
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
            Bull / Bear
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
        {card.sourceNote ?? card.disclaimer}
      </p>
    </article>
  );
}
