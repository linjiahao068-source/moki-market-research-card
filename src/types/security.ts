export type SecurityMarket = 'US' | 'HK' | 'CN_A' | 'UNKNOWN';

export type SecurityInputKind = 'symbol' | 'numericCode' | 'chineseName' | 'unknown';

export interface SecurityRecord {
  id: string;
  market: SecurityMarket;
  symbol?: string;
  numericCode?: string;
  codeVariants?: string[];
  companyName: string;
  englishName?: string;
  chineseNameHK?: string;
  chineseAliases?: string[];
  theme?: string;
}

export type SecurityResolution =
  | {
      status: 'matched';
      inputKind: SecurityInputKind;
      matchType: 'symbol' | 'numericCode' | 'chineseName';
      rawInput: string;
      normalizedInput: string;
      security: SecurityRecord;
    }
  | {
      status: 'unmatched';
      inputKind: SecurityInputKind;
      rawInput: string;
      normalizedInput: string;
      fallbackSecurity: SecurityRecord;
    }
  | {
      status: 'ambiguous';
      inputKind: SecurityInputKind;
      rawInput: string;
      normalizedInput: string;
      candidates: SecurityRecord[];
    };
