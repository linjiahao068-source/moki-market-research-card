import type { Metadata } from "next";
import Link from 'next/link';
import { Zap, ChevronLeft, FileText, Search } from 'lucide-react';
import { ResearchCardPreview } from '@/components/ResearchCardPreview';
import { researchCards } from '@/data/researchCards';

export const metadata: Metadata = {
  title: "研究卡样例库｜Moki Market",
  description: "基于 SEC EDGAR filings、财报电话会议和 Yahoo Finance 真实数据生成的研究卡。",
  openGraph: {
    title: "研究卡样例库｜Moki Market",
    description: "基于 SEC EDGAR filings、财报电话会议和 Yahoo Finance 真实数据生成的研究卡。",
  },
  twitter: {
    title: "研究卡样例库｜Moki Market",
    description: "基于 SEC EDGAR filings、财报电话会议和 Yahoo Finance 真实数据生成的研究卡。",
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

        {/* 头部标题区域 */}
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
              {researchCards.length} cards · 真实数据快照
            </div>
          </div>
          <p className="max-w-2xl text-sm leading-relaxed text-[oklch(0.43_0.018_160)] sm:text-base">
            这些是基于 SEC EDGAR filings、财报电话会议和 Yahoo Finance 真实数据生成的研究卡样例。
          </p>
        </section>

        {/* CTA 引导区域 */}
        <section className="mb-5 rounded-[8px] border border-[var(--brand-border)] bg-[var(--brand-soft)] p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <Zap className="h-6 w-6 shrink-0 text-[var(--brand-ink)]" aria-hidden="true" />
              <div>
                <div className="text-sm font-semibold text-[var(--brand-ink)] mb-1">
                  你也可以生成自己的研究卡！
                </div>
                <p className="text-sm leading-relaxed text-[oklch(0.43_0.018_160)] mb-3">
                  输入任意美股股票代码、公司名称或中文名，立即生成针对该股票的研究卡。
                </p>
              </div>
            </div>
            <Link
              href="/generate"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-[8px] border border-transparent bg-[var(--brand)] px-5 text-sm font-semibold text-[oklch(0.14_0.015_160)] shadow-[0_4px_12px_-4px_rgba(0,0,0,0.12)] transition-all hover:scale-[1.02] hover:shadow-[0_6px_16px_-6px_rgba(0,0,0,0.18)] active:scale-[0.98]"
            >
              立即生成你的研究卡
              <Zap className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </section>

        {/* 产品功能说明区域 */}
        <section className="mb-5 grid gap-4 sm:grid-cols-3">
          <div className="rounded-[8px] border border-border bg-white p-4">
            <div className="text-sm font-semibold text-[oklch(0.2_0.018_160)] mb-2">
              真实数据接入
            </div>
            <p className="text-xs leading-relaxed text-[oklch(0.43_0.018_160)]">
              基于 SEC EDGAR filings、财报电话会议、Yahoo Finance、Eastmoney 等多个权威数据源。
            </p>
          </div>
          <div className="rounded-[8px] border border-border bg-white p-4">
            <div className="text-sm font-semibold text-[oklch(0.2_0.018_160)] mb-2">
              Serenity Skills
            </div>
            <p className="text-xs leading-relaxed text-[oklch(0.43_0.018_160)]">
              整合 Serenity Alpha、Bayesian Valuation、GF-DMA Health Index、TAM-Adj PEG 等研究框架。
            </p>
          </div>
          <div className="rounded-[8px] border border-border bg-white p-4">
            <div className="text-sm font-semibold text-[oklch(0.2_0.018_160)] mb-2">
              可复盘可验证
            </div>
            <p className="text-xs leading-relaxed text-[oklch(0.43_0.018_160)]">
              所有研究内容标注数据来源，关键假设明确可验证，方便后续复盘。
            </p>
          </div>
        </section>

        {/* 样例卡展示区域 */}
        <div className="space-y-4">
          {researchCards.map((card) => (
            <div key={card.slug} className="relative">
              {card.isSnapshot && (
                <div className="absolute -top-3 right-5 z-10 inline-flex items-center gap-1 rounded-full border border-[var(--brand-border)] bg-white px-2 py-1 text-xs font-semibold text-[var(--brand-ink)]">
                  真实数据快照
                </div>
              )}
              <ResearchCardPreview card={card} />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
