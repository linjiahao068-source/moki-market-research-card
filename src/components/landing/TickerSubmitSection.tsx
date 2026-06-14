'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { resolveSecurityInput } from '@/lib/security/resolveSecurityInput';

export function TickerSubmitSection() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const resolution = resolveSecurityInput(query);

    if (!resolution.normalizedInput) {
      setError('请输入股票代码、Ticker 或中文名。');
      return;
    }

    if (resolution.inputKind === 'unknown') {
      setError('暂不支持该输入格式。');
      return;
    }

    if (resolution.status === 'ambiguous') {
      setError('匹配到多个证券，请输入更精确的股票代码、Ticker 或中文名。');
      return;
    }

    setError('');
    router.push(`/generate?query=${encodeURIComponent(resolution.normalizedInput)}`);
  }

  return (
    <section className="px-4 py-8 sm:px-6" id="submit-ticker">
      <div className="mx-auto grid w-full max-w-6xl gap-5 rounded-[8px] border border-border bg-white p-5 shadow-[0_12px_40px_-32px_rgba(0,0,0,0.28)] sm:p-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-center">
        <div className="min-w-0">
          <div className="mb-2 text-xs font-semibold text-[var(--brand-ink)]">Security intake</div>
          <h2 className="mb-3 text-2xl font-bold leading-tight text-[oklch(0.16_0.014_160)] sm:text-3xl">
            想看其他股票？
          </h2>
          <p className="max-w-2xl text-sm leading-relaxed text-[oklch(0.45_0.018_160)]">
            输入股票代码 / Ticker / 中文名，例如美股 Ticker、港股数字代码或股票中文名，生成一张 Moki Market 研究卡雏形。
          </p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-[8px] border border-[var(--brand-border)] bg-[var(--brand-soft)] p-4">
          <label htmlFor="landing-query" className="mb-2 block text-sm font-semibold text-[var(--brand-ink)]">
            股票代码 / Ticker / 中文名
          </label>
          <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
            <input
              id="landing-query"
              name="query"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                if (error) {
                  setError('');
                }
              }}
              placeholder="ORCL / 00700 / 腾讯控股"
              className="h-11 min-w-0 flex-1 rounded-[8px] border border-[var(--brand-border)] bg-white px-3 text-base font-semibold tracking-wide text-[oklch(0.18_0.014_160)] outline-none transition-colors placeholder:font-sans placeholder:font-normal placeholder:tracking-normal placeholder:text-[oklch(0.58_0.018_160)] focus:border-[var(--brand-border)] focus:ring-2 focus:ring-white"
            />
            <button
              type="submit"
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-[8px] bg-[var(--brand)] px-4 text-sm font-semibold text-[oklch(0.14_0.015_160)] transition-colors hover:bg-[var(--brand-hover)] sm:w-auto lg:w-full"
            >
              生成研究卡
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
          {error ? (
            <p className="mt-3 rounded-[8px] border border-[var(--risk-border)] bg-[var(--risk-soft)] px-3 py-2 text-sm leading-relaxed text-[var(--risk-ink)]">
              {error}
            </p>
          ) : (
            <p className="mt-3 text-xs leading-relaxed text-[var(--brand-ink)]">
              示例：输入 ORCL、00700 或 腾讯控股会跳转到 /generate?query=...。当前不接真实金融 API。
            </p>
          )}
        </form>
      </div>
    </section>
  );
}
