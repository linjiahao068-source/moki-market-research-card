import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { TickerInputForm } from '@/components/generate/TickerInputForm';

export const metadata: Metadata = {
  title: '生成 Moki Market 研究卡｜Moki Market',
  description: 'V0.2.3 mock 生成模式，用于产品体验验证，不构成投资建议。',
  openGraph: {
    title: '生成 Moki Market 研究卡｜Moki Market',
    description: '输入股票代码、Ticker 或中文名，选择卡片类型，生成本地 mock 研究卡预览。',
  },
  twitter: {
    title: '生成 Moki Market 研究卡｜Moki Market',
    description: '输入股票代码、Ticker 或中文名，选择卡片类型，生成本地 mock 研究卡预览。',
  },
};

interface GeneratePageProps {
  searchParams?: Promise<{
    query?: string;
    ticker?: string;
  }>;
}

export default async function GeneratePage({ searchParams }: GeneratePageProps) {
  const params = searchParams ? await searchParams : undefined;
  const initialQuery = params?.query ?? params?.ticker ?? '';

  return (
    <main className="min-h-screen bg-background px-4 py-5 sm:px-6 sm:py-8">
      <div className="mx-auto w-full max-w-[1180px]">
        <Link
          href="/"
          className="mb-5 inline-flex h-9 items-center gap-2 rounded-[8px] border border-transparent px-3 text-sm font-medium text-[oklch(0.42_0.018_160)] transition-colors hover:border-border hover:bg-white hover:text-[oklch(0.2_0.018_160)]"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          返回首页
        </Link>

        <section className="mb-5 rounded-[8px] border border-border bg-white p-5 shadow-[0_12px_40px_-32px_rgba(0,0,0,0.28)] sm:p-6">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[var(--brand-border)] bg-[var(--brand-soft)] px-3 py-1 text-xs font-semibold text-[var(--brand-ink)]">
            V0.2.3 mock 生成模式
          </div>
          <h1 className="mb-3 text-3xl font-bold leading-tight text-[oklch(0.16_0.014_160)] sm:text-4xl">
            生成 Moki Market 研究卡
          </h1>
          <p className="max-w-3xl text-sm leading-relaxed text-[oklch(0.43_0.018_160)] sm:text-base">
            当前为 V0.2.3 mock 生成模式。你可以输入股票代码 / Ticker / 中文名，例如美股 Ticker、港股数字代码或已收录的股票中文名。结果仅用于产品体验验证，不构成投资建议。
          </p>
        </section>

        <TickerInputForm initialQuery={initialQuery} />
      </div>
    </main>
  );
}
