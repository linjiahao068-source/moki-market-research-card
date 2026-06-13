export interface MockCompanyProfile {
  ticker: string;
  companyName: string;
  theme: string;
}

export const mockCompanyProfiles: MockCompanyProfile[] = [
  {
    ticker: 'ORCL',
    companyName: 'Oracle',
    theme: 'AI cloud infrastructure',
  },
  {
    ticker: 'NVDA',
    companyName: 'NVIDIA',
    theme: 'AI accelerator and GPU ecosystem',
  },
  {
    ticker: 'TSLA',
    companyName: 'Tesla',
    theme: 'EV, robotaxi and AI narrative',
  },
  {
    ticker: 'SNOW',
    companyName: 'Snowflake',
    theme: 'AI data cloud and software valuation',
  },
  {
    ticker: 'MDB',
    companyName: 'MongoDB',
    theme: 'developer database and AI application backend',
  },
];

export function getMockCompanyProfile(ticker: string): MockCompanyProfile {
  const normalizedTicker = ticker.trim().toUpperCase();
  const profile = mockCompanyProfiles.find((item) => item.ticker === normalizedTicker);

  return profile ?? {
    ticker: normalizedTicker,
    companyName: `${normalizedTicker} Company`,
    theme: 'general US stock research context',
  };
}
