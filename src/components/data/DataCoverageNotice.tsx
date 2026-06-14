import { DataCoverageStatus } from '@/types/basic-data';

interface DataCoverageNoticeProps {
  coverageStatus: DataCoverageStatus;
}

const coverageCopy: Record<DataCoverageStatus, { label: string; description: string; className: string }> = {
  full: {
    label: '覆盖较完整',
    description: '基础数据字段较完整，仍需结合来源复核。',
    className: 'border-[oklch(0.82_0.055_150)] bg-[oklch(0.97_0.025_150)] text-[oklch(0.32_0.075_150)]',
  },
  partial: {
    label: '部分覆盖',
    description: '仅获取到部分基础数据，请注意字段缺失。',
    className: 'border-[var(--brand-border)] bg-[var(--brand-soft)] text-[var(--brand-ink)]',
  },
  empty: {
    label: '暂无覆盖',
    description: '未获取到可用基础数据，当前仅保留结构占位。',
    className: 'border-border bg-muted text-[oklch(0.45_0.018_160)]',
  },
  failed: {
    label: '获取失败',
    description: '基础数据获取失败，页面应回退到 mock 或显示缺失状态。',
    className: 'border-[var(--risk-border)] bg-[var(--risk-soft)] text-[var(--risk-ink)]',
  },
};

export function DataCoverageNotice({ coverageStatus }: DataCoverageNoticeProps) {
  const copy = coverageCopy[coverageStatus];

  return (
    <div className={`rounded-[8px] border p-3 text-sm leading-relaxed ${copy.className}`}>
      <div className="font-semibold">{copy.label}</div>
      <p className="mt-1 text-xs leading-relaxed">{copy.description}</p>
    </div>
  );
}
