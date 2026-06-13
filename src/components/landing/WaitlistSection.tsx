import { Mail } from 'lucide-react';

export function WaitlistSection() {
  return (
    <section className="px-4 py-8 sm:px-6" id="waitlist">
      <div className="mx-auto grid w-full max-w-6xl gap-5 rounded-[8px] border border-border bg-[oklch(0.18_0.014_160)] p-5 text-white shadow-[0_16px_46px_-34px_rgba(0,0,0,0.45)] sm:p-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-center">
        <div className="min-w-0">
          <div className="mb-2 text-xs font-semibold text-[var(--brand)]">Waitlist</div>
          <h2 className="mb-3 text-2xl font-bold leading-tight sm:text-3xl">
            想参与下一批内测？
          </h2>
          <p className="max-w-2xl text-sm leading-relaxed text-[oklch(0.83_0.01_85)]">
            先留下邮箱或使用场景。当前版本不接数据库，点击按钮会通过邮件发送到项目维护者。
          </p>
        </div>

        <form
          action="mailto:linjiahao068@gmail.com"
          method="post"
          encType="text/plain"
          className="rounded-[8px] border border-white/10 bg-white/5 p-4"
        >
          <label htmlFor="waitlist-email" className="mb-2 block text-sm font-semibold text-white">
            Email
          </label>
          <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
            <input
              id="waitlist-email"
              name="email"
              type="email"
              placeholder="you@example.com"
              className="h-11 min-w-0 flex-1 rounded-[8px] border border-white/10 bg-white px-3 text-sm text-[oklch(0.18_0.014_160)] outline-none transition-colors placeholder:text-[oklch(0.58_0.018_160)] focus:border-[var(--brand-border)] focus:ring-2 focus:ring-[var(--brand-soft)]"
            />
            <button
              type="submit"
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-[8px] bg-[var(--brand)] px-4 text-sm font-semibold text-[oklch(0.14_0.015_160)] transition-colors hover:bg-[var(--brand-hover)] sm:w-auto lg:w-full"
            >
              <Mail className="h-4 w-4" aria-hidden="true" />
              加入 waitlist
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
