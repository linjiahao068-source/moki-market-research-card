import type { Metadata } from "next";
import Link from 'next/link';
import { ChevronLeft, FileText, Search } from 'lucide-react';
import { ResearchCardPreview } from '@/components/ResearchCardPreview';
import { researchCards } from '@/data/researchCards';

export const metadata: Metadata = {
  title: "研究卡样例库｜Moki Market",
  description: "把 X 舆情、英文新闻、财报线索和市场波动整理成可复盘的研究卡。",
  openGraph: {
    title: "研究卡样例库｜Moki Market",
    description: "把 X 舆情、英文新闻、财报线索和市场波动整理成可复盘的研究卡。",
  },
  twitter: {
    title: "研究卡样例库｜Moki Market",
    description: "把 X 舆情、英文新闻、财报线索和市场波动整理成可复盘的研究卡。",
  },
};

export default function ResearchCardsPage() {
  return (
    <main className="min-h-screen bg-background px-4 py-5 sm:px-6 sm:py-8">
      <div className="mx-auto w-full max-w-[940px]">
        <Link
          href="/"
          className="mb-5 inline-flex h-9 items-center gap-2 rounded-[8px] border border-transparent px-3 text-sm font-medium text-[oklch(0.42_0.018_160)] transition-colors hover:border-border hover:bg-white hover:text-[oklch(0.2_0.018_160)]"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          返回首页
        </Link>

        <section className="mb-5 rounded-[8px] border border-border bg-white p-5 shadow-[0_12px_40px_-32px_rgba(0,0,0,0.28)] sm:p-6">
          <div className="mb-4 flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[8px] bg-[var(--brand)]">
                <FileText className="h-5 w-5 text-[oklch(0.14_0.015_160)]" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-[var(--brand-ink)]">
                  Moki Market
                </div>
                <h1 className="text-2xl font-bold leading-tight text-[oklch(0.16_0.014_160)] sm:text-3xl">
                  研究卡样例库
                </h1>
              </div>
            </div>
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[var(--brand-border)] bg-[var(--brand-soft)] px-3 py-1 text-xs font-semibold text-[var(--brand-ink)]">
              <Search className="h-3.5 w-3.5" aria-hidden="true" />
              {researchCards.length} cards
            </div>
          </div>
          <p className="max-w-2xl text-sm leading-relaxed text-[oklch(0.43_0.018_160)] sm:text-base">
            把 X 舆情、英文新闻、财报线索和市场波动整理成可复盘的研究卡。
          </p>
        </section>

        <div className="space-y-4">
          {researchCards.map((card) => (
            <ResearchCardPreview key={card.slug} card={card} />
          ))}
        </div>
      </div>
    </main>
  );
}
