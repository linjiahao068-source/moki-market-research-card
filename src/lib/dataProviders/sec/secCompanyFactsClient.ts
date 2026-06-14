import { SEC_BASE_URL, secFetchJson } from './secClient';

export type SecCompanyFacts = Record<string, unknown>;

function normalizeCik(cik: string) {
  return cik.padStart(10, '0');
}

export async function fetchSecCompanyFacts(cik: string): Promise<SecCompanyFacts> {
  const normalizedCik = normalizeCik(cik);

  return secFetchJson<SecCompanyFacts>(`${SEC_BASE_URL}/api/xbrl/companyfacts/CIK${normalizedCik}.json`);
}
