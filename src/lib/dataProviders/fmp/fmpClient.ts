const FMP_BASE_URL = 'https://financialmodelingprep.com/stable';

function getFmpApiKey() {
  return process.env.FMP_API_KEY;
}

export function hasFmpApiKey() {
  return Boolean(getFmpApiKey());
}

export async function fmpFetchJson<T>(path: string, params: Record<string, string>): Promise<T> {
  const apiKey = getFmpApiKey();

  if (!apiKey) {
    throw new Error('FMP_API_KEY is not configured.');
  }

  const url = new URL(`${FMP_BASE_URL}${path}`);

  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });
  url.searchParams.set('apikey', apiKey);

  const response = await fetch(url.toString(), {
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`FMP request failed with status ${response.status}`);
  }

  return response.json() as Promise<T>;
}
