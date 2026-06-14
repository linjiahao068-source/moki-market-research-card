import { SecurityMarket, SecurityRecord } from '@/types/security';

export function getSecurityDisplayCode(security: SecurityRecord): string {
  return security.symbol ?? security.numericCode ?? security.chineseNameHK ?? security.companyName ?? '--';
}

export function getSecurityDisplayName(security: SecurityRecord): string {
  return security.companyName ?? security.englishName ?? security.chineseNameHK ?? '--';
}

export function getSecurityChineseName(security: SecurityRecord): string | undefined {
  return security.chineseNameHK;
}

export function getMarketLabel(market: SecurityMarket): string {
  const labels: Record<SecurityMarket, string> = {
    US: '美股',
    HK: '港股',
    CN_A: 'A股',
    UNKNOWN: '未识别市场',
  };

  return labels[market];
}
