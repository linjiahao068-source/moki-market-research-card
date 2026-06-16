/**
 * Serenity Skills - 数据状态提示组件
 *
 * 明确标识数据为 Mock/Placeholder，防止误解。
 */

import { SERENITY_DATA_NOTICE } from '@/lib/serenity/mockData';

interface SerenityDataNoticeProps {
  customNotice?: string;
}

export function SerenityDataNotice({ customNotice }: SerenityDataNoticeProps) {
  return (
    <div className="rounded-[8px] border border-[var(--risk-border)] bg-[var(--risk-soft)] p-3 text-xs leading-relaxed text-[var(--risk-ink)]">
      <div className="font-semibold mb-1">⚠️ 数据说明</div>
      {customNotice || SERENITY_DATA_NOTICE}
    </div>
  );
}
