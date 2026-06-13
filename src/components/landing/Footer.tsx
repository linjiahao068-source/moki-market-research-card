import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t border-border px-4 py-8 sm:px-6">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 text-sm text-[oklch(0.48_0.018_160)] md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <div className="mb-2 flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-[8px] bg-[var(--brand)]">
              <span className="text-xs font-bold text-[oklch(0.14_0.015_160)]">M</span>
            </div>
            <span className="font-semibold text-[oklch(0.18_0.014_160)]">Moki Market</span>
          </div>
          <p className="text-xs leading-relaxed">
            仅供信息整理、研究辅助和教育参考，不构成投资建议。V0.2.3 mock prototype.
          </p>
        </div>
        <div className="flex flex-wrap gap-3 text-xs font-medium">
          <Link href="/generate" className="hover:text-[var(--brand-ink)]">生成页</Link>
          <Link href="/research-cards" className="hover:text-[var(--brand-ink)]">样例库</Link>
          <Link href="/research-card" className="hover:text-[var(--brand-ink)]">默认研究卡</Link>
        </div>
      </div>
    </footer>
  );
}
