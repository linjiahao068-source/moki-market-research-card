import { Evidence } from '@/types/research-card';

interface EvidenceItemProps {
  evidence: Evidence;
}

export function EvidenceItem({ evidence }: EvidenceItemProps) {
  return (
    <div className="relative pl-6 pb-5 last:pb-0 sm:pl-8">
      {/* 时间线 */}
      <div className="absolute left-2 top-2 bottom-0 w-px bg-[oklch(0.88_0.02_85)]"></div>
      <div className="absolute left-0 top-1 flex h-4 w-4 items-center justify-center rounded-full border border-[oklch(0.74_0.14_72)] bg-white">
        <span className="h-1.5 w-1.5 rounded-full bg-[var(--brand-dot)]"></span>
      </div>

      {/* 内容卡片 */}
      <div className="rounded-[8px] border border-border bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-colors hover:border-[oklch(0.76_0.11_72)]">
        <div className="mb-3 flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <span className="min-w-0 text-sm font-semibold text-[oklch(0.22_0.035_155)]">
              {evidence.sourceLabel}
            </span>
            <span className="rounded-full border border-border bg-muted px-2 py-0.5 font-mono text-[10px] text-[oklch(0.45_0.02_160)]">
              {evidence.sourceType}
            </span>
          </div>
          <span className="font-mono text-xs text-[oklch(0.5_0.018_160)] sm:ml-auto">
            {evidence.timestamp}
          </span>
        </div>
        <div className="text-sm leading-relaxed text-[oklch(0.2_0.016_160)]">
          {evidence.summary}
        </div>
      </div>
    </div>
  );
}
