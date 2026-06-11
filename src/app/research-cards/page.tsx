import type { Metadata } from "next";
import Link from 'next/link';
import { ResearchCardPreview } from '@/components/ResearchCardPreview';
import { researchCards } from '@/data/researchCards';

export const metadata: Metadata = {
  title: "研究卡案例｜Moki Market",
  description: "Moki Market 静态研究卡 Demo 列表。",
  openGraph: {
    title: "研究卡案例｜Moki Market",
    description: "Moki Market 静态研究卡 Demo 列表。",
  },
  twitter: {
    title: "研究卡案例｜Moki Market",
    description: "Moki Market 静态研究卡 Demo 列表。",
  },
};

export default function ResearchCardsPage() {
  return (
    <div className="min-h-screen bg-[oklch(0.975_0.008_220)] px-4 py-10">
      <main className="max-w-[900px] mx-auto">
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm text-[oklch(0.45_0.05_220)] hover:text-[oklch(0.35_0.08_220)] hover:bg-white rounded-xl border border-transparent hover:border-[oklch(0.9_0.01_220)] transition-colors mb-6"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            返回首页
          </Link>

          <div className="bg-white rounded-3xl border border-[oklch(0.9_0.01_220)] shadow-[0_8px_40px_-15px_rgba(0,0,0,0.12)] p-6 sm:p-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[oklch(0.35_0.08_220)] via-[oklch(0.55_0.06_220)] to-[oklch(0.35_0.08_220)]"></div>
            <div className="relative">
              <div className="inline-flex items-center gap-2 text-[oklch(0.35_0.08_220)] mb-4">
                <div className="w-10 h-10 rounded-2xl bg-[oklch(0.35_0.08_220)] flex items-center justify-center shadow-[0_4px_12px_-6px_rgba(0,0,0,0.3)]">
                  <span className="text-white font-bold text-sm">M</span>
                </div>
                <span className="text-sm font-semibold tracking-wide">Moki Market</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[oklch(0.25_0.02_220)] mb-3 tracking-tight">
                研究卡案例
              </h1>
              <p className="text-[oklch(0.55_0.03_220)] leading-relaxed max-w-2xl">
                多研究卡 Demo 的统一入口。当前仅保留 ORCL 静态研究卡案例，用于展示信息整理、证据链和下一步研究任务的结构。
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-5">
          {researchCards.map((card) => (
            <ResearchCardPreview key={card.slug} card={card} />
          ))}
        </div>
      </main>
    </div>
  );
}
