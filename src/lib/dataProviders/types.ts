import { BasicCompanyData, DataProviderName } from '@/types/basic-data';

export interface BasicDataProviderInput {
  symbol?: string;
  cik?: string;
  market?: string;
  companyName?: string;
  numericCode?: string;
}

export interface BasicDataProviderResult {
  ok: boolean;
  data?: BasicCompanyData;
  error?: string;
}

export interface BasicDataProvider {
  name: DataProviderName;
  supports(input: BasicDataProviderInput): boolean;
  fetchBasicData(input: BasicDataProviderInput): Promise<BasicDataProviderResult>;
}
