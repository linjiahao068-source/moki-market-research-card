import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { TickerInputForm } from '@/components/generate/TickerInputForm';

export const metadata: Metadata = {
  title: 'Buy-Side Research Report - Moki Market',
  description: 'Generate a source-backed buy-side research report draft from a ticker and optional source excerpts.',
  openGraph: {
    title: 'Buy-Side Research Report - Moki Market',
    description: 'Generate a source-backed buy-side research report draft from a ticker and optional source excerpts.',
  },
  twitter: {
    title: 'Buy-Side Research Report - Moki Market',
    description: 'Generate a source-backed buy-side research report draft from a ticker and optional source excerpts.',
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
          Back
        </Link>

        <section className="mb-5 rounded-[8px] border border-border bg-white p-5 shadow-[0_12px_40px_-32px_rgba(0,0,0,0.28)] sm:p-6">
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(300px,0.78fr)] lg:items-end">
            <div className="min-w-0">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[var(--brand-border)] bg-[var(--brand-soft)] px-3 py-1 text-xs font-semibold text-[var(--brand-ink)]">
                Buy-Side Report UI
              </div>
              <h1 className="mb-3 text-3xl font-bold leading-tight text-[oklch(0.16_0.014_160)] sm:text-4xl">
                Buy-Side Research Report
              </h1>
              <p className="max-w-3xl text-sm leading-relaxed text-[oklch(0.43_0.018_160)] sm:text-base">
                Input a ticker and optional source excerpt to generate an investment view, key debates, business quality, scenario lanes, monitoring plan, and source audit.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              {['Investment View', 'Business Quality', 'Technical Structure', 'Source Audit'].map((item) => (
                <div key={item} className="rounded-[8px] border border-border bg-[oklch(0.992_0.005_85)] px-3 py-2 font-semibold text-[oklch(0.24_0.016_160)]">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>

        <TickerInputForm initialQuery={initialQuery} />
      </div>
    </main>
  );
}
