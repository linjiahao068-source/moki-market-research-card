import { SecurityResolution } from '@/types/security';

interface SecurityMatchBadgeProps {
  resolution: SecurityResolution;
}

const badgeStyles = {
  matched: 'border-[oklch(0.82_0.055_150)] bg-[oklch(0.97_0.025_150)] text-[oklch(0.32_0.075_150)]',
  unmatched: 'border-[var(--brand-border)] bg-[var(--brand-soft)] text-[var(--brand-ink)]',
  ambiguous: 'border-[oklch(0.82_0.055_235)] bg-[oklch(0.97_0.025_235)] text-[oklch(0.34_0.075_235)]',
};

const badgeLabels = {
  matched: '已匹配主数据',
  unmatched: '未匹配，使用通用视图',
  ambiguous: '多个候选，请选择',
};

export function SecurityMatchBadge({ resolution }: SecurityMatchBadgeProps) {
  return (
    <span
      className={`inline-flex w-fit max-w-full items-center rounded-full border px-3 py-1 text-xs font-semibold leading-relaxed ${badgeStyles[resolution.status]}`}
    >
      {badgeLabels[resolution.status]}
    </span>
  );
}
