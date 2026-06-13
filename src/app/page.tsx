import Link from 'next/link';
import { ArrowRight, FileText, Search, TrendingUp } from 'lucide-react';
import { DEFAULT_RESEARCH_CARD_SLUG, getAllResearchCards } from '@/data/researchCards';

export default function Home() {
  const cards = getAllResearchCards();
  const sampleTickers = cards.map((card) => card.ticker).join(' / ');
  const defaultResearchCardHref = `/research-card/${DEFAULT_RESEARCH_CARD_SLUG}`;

  return (
    <main className="min-h-screen bg-background px-4 py-5 sm:px-6 sm:py-10">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <header className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-[8px] bg-[var(--brand)]">
              <span className="text-sm font-bold text-[oklch(0.14_0.015_160)]">M</span>
            </div>
            <span className="text-sm font-semibold text-[oklch(0.18_0.014_160)]">
              Moki Market
            </span>
          </div>
          <span className="rounded-full border border-[var(--brand-border)] bg-white px-3 py-1 text-xs font-medium text-[var(--brand-ink)]">
            Research beta
          </span>
        </header>

        <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-stretch">
          <div className="rounded-[8px] border border-border bg-white p-5 shadow-[0_12px_40px_-32px_rgba(0,0,0,0.28)] sm:p-7">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-[var(--brand-soft)] px-3 py-1 text-xs font-semibold text-[var(--brand-ink)]">
              <Search className="h-3.5 w-3.5" aria-hidden="true" />
              AI 时代中文美股研究卡
            </div>
            <h1 className="mb-4 text-3xl font-bold leading-tight text-[oklch(0.16_0.014_160)] sm:text-5xl">
              把市场噪音整理成可复盘的研究线索。
            </h1>
            <p className="max-w-2xl text-base leading-relaxed text-[oklch(0.42_0.018_160)] sm:text-lg">
              把 X 舆情、英文新闻、财报线索、AI 产业链变化和市场波动，整理成可读、可追踪、可复盘的研究卡。
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/research-cards"
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-[8px] bg-[var(--brand)] px-5 text-sm font-semibold text-[oklch(0.14_0.015_160)] transition-colors hover:bg-[var(--brand-hover)] sm:w-auto"
              >
                查看全部研究卡
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link
                href={defaultResearchCardHref}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-[8px] border border-border bg-white px-5 text-sm font-semibold text-[oklch(0.22_0.018_160)] transition-colors hover:bg-muted sm:w-auto"
              >
                查看默认案例
              </Link>
            </div>
          </div>

          <aside className="rounded-[8px] border border-border bg-[oklch(0.18_0.014_160)] p-5 text-white shadow-[0_12px_40px_-32px_rgba(0,0,0,0.45)]">
            <div className="mb-5 flex items-center gap-2 text-sm font-semibold">
              <TrendingUp className="h-4 w-4 text-[var(--brand)]" aria-hidden="true" />
              当前样例
            </div>
            <div className="mb-5 text-3xl font-bold tracking-tight">
              {cards.length}
              <span className="ml-2 text-sm font-medium text-[oklch(0.78_0.02_160)]">cards live</span>
            </div>
            <div className="rounded-[8px] border border-white/10 bg-white/5 p-4">
              <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-[var(--brand)]">
                <FileText className="h-3.5 w-3.5" aria-hidden="true" />
                Tickers
              </div>
              <p className="font-mono text-sm leading-relaxed text-[oklch(0.9_0.01_85)]">
                {sampleTickers}
              </p>
            </div>
          </aside>
        </section>

        <p className="max-w-3xl text-xs leading-relaxed text-[oklch(0.48_0.018_160)]">
          仅供信息整理、研究辅助和教育参考，不构成投资建议。
        </p>
      </div>
    </main>
  );
}
