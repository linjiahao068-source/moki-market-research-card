import Link from 'next/link';
import { ArrowRight, ExternalLink } from 'lucide-react';
import { ResearchCardPreview } from '@/components/ResearchCardPreview';
import { getAllResearchCards } from '@/data/researchCards';

export function SampleCardsSection() {
  const cards = getAllResearchCards().slice(0, 3);

  return (
    <section className="px-4 py-8 sm:px-6" id="samples">
      <div className="mx-auto w-full max-w-6xl">
        <div className="mb-5 flex min-w-0 flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <div className="mb-2 text-xs font-semibold text-[var(--brand-ink)]">Live demos</div>
            <h2 className="text-2xl font-bold leading-tight text-[oklch(0.16_0.014_160)] sm:text-3xl">
              点进真实 Demo，看一张研究卡如何组织信息。
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[oklch(0.45_0.018_160)]">
              这里直接使用现有 researchCards 数据。每张样例卡都可以进入详情页，查看摘要、舆情、基本面、事件、证据链和下一步研究。
            </p>
          </div>
          <Link
            href="/research-cards"
            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-[8px] border border-border bg-white px-4 text-sm font-semibold text-[oklch(0.22_0.018_160)] transition-colors hover:bg-muted sm:w-auto"
          >
            打开样例库
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        <div className="space-y-4">
          {cards.map((card) => (
            <ResearchCardPreview key={card.slug} card={card} />
          ))}
        </div>

        <Link
          href="/research-cards"
          className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-[8px] bg-[var(--brand)] px-4 text-sm font-semibold text-[oklch(0.14_0.015_160)] transition-colors hover:bg-[var(--brand-hover)] sm:w-auto"
        >
          查看更多 Demo
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}
