export const SEC_BASE_URL = 'https://data.sec.gov';
export const SEC_FILES_BASE_URL = 'https://www.sec.gov/files';

function getSecHeaders(accept: string): Record<string, string> {
  return {
    'User-Agent': process.env.SEC_USER_AGENT || 'Moki Market linjiahao068@gmail.com',
    'Accept-Encoding': 'gzip, deflate',
    Accept: accept,
  };
}

// SEC fair access requires declaring a User-Agent and controlling request frequency.
export async function secFetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    headers: getSecHeaders('application/json'),
  });

  if (!response.ok) {
    throw new Error(`SEC request failed with status ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export async function secFetchText(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: getSecHeaders('text/html,application/xhtml+xml,text/plain;q=0.9,*/*;q=0.8'),
  });

  if (!response.ok) {
    throw new Error(`SEC document request failed with status ${response.status}`);
  }

  return response.text();
}
