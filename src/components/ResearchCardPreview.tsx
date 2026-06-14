import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { StockSymbolBadge } from '@/components/common/StockSymbolBadge';
import { ResearchCard } from '@/types/research-card';

interface ResearchCardPreviewProps {
  card: ResearchCard;
}

export function ResearchCardPreview({ card }: ResearchCardPreviewProps) {
  return (
    <article className="group rounded-[8px] border border-border bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-colors hover:border-[oklch(0.74_0.13_72)] sm:p-5">
      <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <StockSymbolBadge
            symbol={card.ticker || card.companyName.slice(0, 4)}
            className="flex-shrink-0 rounded-[8px] sm:h-14 sm:w-14"
          />
          <div className="min-w-0">
            <div className="mb-1 truncate text-sm text-[oklch(0.48_0.018_160)]">
              {card.companyName}
            </div>
            <h2 className="max-w-full break-words text-lg font-semibold leading-snug text-[oklch(0.18_0.014_160)] sm:text-xl">
              {card.title}
            </h2>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--brand-border)] bg-[var(--brand-soft)] px-2.5 py-1 text-xs text-[var(--brand-ink)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--brand-dot)]"></span>
            {card.isMock ? 'Sample / Mock' : 'Research Card'}
          </div>
          <div className="rounded-full border border-border bg-muted px-2.5 py-1 font-mono text-xs text-[oklch(0.47_0.018_160)]">
            {card.updatedAt}
          </div>
        </div>
      </div>

      <p className="mb-4 text-sm leading-relaxed text-[oklch(0.43_0.018_160)]">
        {card.subtitle}
      </p>

      <div className="mb-4 border-l-2 border-[var(--brand-dot)] pl-3">
        <div className="mb-1 text-xs font-semibold text-[var(--brand-ink)]">
          一句话摘要
        </div>
        <p className="text-sm leading-relaxed text-[oklch(0.22_0.018_160)]">
          {card.summary.oneLine}
        </p>
      </div>

      <div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-muted px-2.5 py-1 text-xs text-[oklch(0.45_0.018_160)]">
            {card.cardType}
          </span>
          <span className="rounded-full bg-muted px-2.5 py-1 text-xs text-[oklch(0.45_0.018_160)]">
            热度 {card.sentiment.heatLevel}/10
          </span>
        </div>

        <Link
          href={`/research-card/${card.slug}`}
          className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-[8px] bg-[var(--brand)] px-4 text-sm font-semibold text-[oklch(0.14_0.015_160)] transition-colors hover:bg-[var(--brand-hover)] sm:w-auto"
        >
          查看研究卡
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}
