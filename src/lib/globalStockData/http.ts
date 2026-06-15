export type ServerFetchResult<T> =
  | {
      ok: true;
      data: T;
      status: number;
    }
  | {
      ok: false;
      error: string;
      status?: number;
    };

interface ServerFetchOptions {
  headers?: HeadersInit;
  timeoutMs?: number;
}

// Server-side only: global stock data providers must be called from server code or API routes.
// Do not import these provider helpers into client components, and never expose provider secrets to the browser.
async function serverFetch(url: string, options: ServerFetchOptions = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? 10_000);

  try {
    const response = await fetch(url, {
      headers: options.headers,
      signal: controller.signal,
    });

    if (!response.ok) {
      return {
        ok: false as const,
        error: `Request failed with status ${response.status}`,
        status: response.status,
      };
    }

    return {
      ok: true as const,
      response,
      status: response.status,
    };
  } catch (error) {
    return {
      ok: false as const,
      error: error instanceof Error ? error.message : 'Request failed.',
    };
  } finally {
    clearTimeout(timeout);
  }
}

export async function serverFetchJson<T>(
  url: string,
  options: ServerFetchOptions = {}
): Promise<ServerFetchResult<T>> {
  const result = await serverFetch(url, options);

  if (!result.ok) {
    return result;
  }

  try {
    return {
      ok: true,
      data: await result.response.json() as T,
      status: result.status,
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Failed to parse JSON response.',
      status: result.status,
    };
  }
}

export async function serverFetchText(
  url: string,
  options: ServerFetchOptions = {}
): Promise<ServerFetchResult<string>> {
  const result = await serverFetch(url, options);

  if (!result.ok) {
    return result;
  }

  try {
    return {
      ok: true,
      data: await result.response.text(),
      status: result.status,
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Failed to read text response.',
      status: result.status,
    };
  }
}
