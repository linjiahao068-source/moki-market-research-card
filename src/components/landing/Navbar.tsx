import Link from 'next/link';

export function Navbar() {
  return (
    <header className="sticky top-0 z-10 border-b border-border/70 bg-background/95 backdrop-blur">
      <nav className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/" className="flex min-w-0 items-center gap-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] bg-[var(--brand)]">
            <span className="text-sm font-bold text-[oklch(0.14_0.015_160)]">M</span>
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold text-[oklch(0.18_0.014_160)]">Moki Market</div>
            <div className="hidden text-[11px] text-[oklch(0.5_0.018_160)] sm:block">
              Research cards for Chinese US stock users
            </div>
          </div>
        </Link>

        <div className="hidden items-center gap-5 text-sm font-medium text-[oklch(0.42_0.018_160)] md:flex">
          <a href="#anxiety" className="transition-colors hover:text-[var(--brand-ink)]">今日焦虑</a>
          <a href="#samples" className="transition-colors hover:text-[var(--brand-ink)]">样例研究卡</a>
          <a href="#method" className="transition-colors hover:text-[var(--brand-ink)]">方法与边界</a>
          <a href="#waitlist" className="transition-colors hover:text-[var(--brand-ink)]">Waitlist</a>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Link
            href="/research-cards"
            className="hidden h-9 items-center justify-center rounded-[8px] border border-border bg-white px-3 text-sm font-semibold text-[oklch(0.22_0.018_160)] transition-colors hover:bg-muted sm:inline-flex"
          >
            查看样例
          </Link>
          <Link
            href="/generate"
            className="inline-flex h-9 items-center justify-center rounded-[8px] bg-[var(--brand)] px-3 text-sm font-semibold text-[oklch(0.14_0.015_160)] transition-colors hover:bg-[var(--brand-hover)]"
          >
            提交股票
          </Link>
        </div>
      </nav>
    </header>
  );
}
