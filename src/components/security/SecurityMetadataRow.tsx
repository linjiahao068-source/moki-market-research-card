import { SecurityRecord } from '@/types/security';
import { getMarketLabel } from '@/lib/security/formatSecurityDisplay';

interface SecurityMetadataRowProps {
  security: SecurityRecord;
  matchType?: 'symbol' | 'numericCode' | 'chineseName';
}

function getMatchTypeLabel(matchType?: SecurityMetadataRowProps['matchType']) {
  if (matchType === 'numericCode') {
    return '数字代码';
  }

  if (matchType === 'chineseName') {
    return '中文名';
  }

  if (matchType === 'symbol') {
    return 'Ticker';
  }

  return '—';
}

export function SecurityMetadataRow({ security, matchType }: SecurityMetadataRowProps) {
  const items = [
    ['市场', getMarketLabel(security.market)],
    ['Symbol', security.symbol],
    ['数字代码', security.numericCode],
    ['中文名', security.chineseNameHK],
    ['匹配方式', getMatchTypeLabel(matchType)],
  ].filter((item): item is [string, string] => Boolean(item[1]));

  return (
    <div className="flex flex-wrap gap-2 text-xs text-[oklch(0.45_0.018_160)]">
      {items.map(([label, value]) => (
        <span key={label} className="rounded-full border border-border bg-white px-2.5 py-1 leading-relaxed">
          <span className="font-semibold text-[oklch(0.22_0.018_160)]">{label}：</span>
          {value}
        </span>
      ))}
    </div>
  );
}
