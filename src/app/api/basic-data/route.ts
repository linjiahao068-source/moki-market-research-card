import { NextRequest } from 'next/server';
import {
  createRouteCacheKey,
  getRouteCacheTtlSeconds,
  jsonResponse,
  readRouteCache,
  writeRouteCache,
} from '@/lib/api/routeCache';
import { getBasicCompanyData } from '@/lib/dataProviders/getBasicCompanyData';
import { resolveSecurityInput } from '@/lib/security/resolveSecurityInput';

export const runtime = 'nodejs';
export const maxDuration = 30;

// This API route requires a server/serverless Next.js deployment.
// It cannot be used directly with Next static export output: 'export'.
export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('query')?.trim() ?? '';
  const ttlSeconds = getRouteCacheTtlSeconds('basic-data');

  if (!query) {
    return jsonResponse(
      {
        ok: false,
        message: 'Missing query parameter.',
      },
      { status: 400, cacheStatus: 'SKIP' }
    );
  }

  try {
    const cacheKey = createRouteCacheKey('basic-data', { query: query.toLowerCase() });
    const cached = readRouteCache<{
      resolution: ReturnType<typeof resolveSecurityInput>;
      basicData: Awaited<ReturnType<typeof getBasicCompanyData>>;
    }>(cacheKey);

    if (cached) {
      return jsonResponse(cached.value, {
        cacheStatus: 'HIT',
        ttlSeconds,
        visibility: 'cdn',
        headers: {
          'x-moki-cache-age': String(cached.ageSeconds),
        },
      });
    }

    const resolution = resolveSecurityInput(query);

    if (resolution.status === 'ambiguous') {
      return jsonResponse(
        {
          ok: false,
          message: 'Ambiguous security input.',
          resolution,
          candidates: resolution.candidates,
        },
        { status: 409, cacheStatus: 'SKIP' }
      );
    }

    const security = resolution.status === 'matched' ? resolution.security : resolution.fallbackSecurity;
    const basicData = await getBasicCompanyData(security);
    const payload = {
      ok: true,
      resolution,
      basicData,
    } as const;

    writeRouteCache(cacheKey, payload, ttlSeconds);

    return jsonResponse(payload, {
      cacheStatus: 'MISS',
      ttlSeconds,
      visibility: 'cdn',
    });
  } catch {
    return jsonResponse(
      {
        ok: false,
        message: 'Failed to load basic company data.',
      },
      { status: 500, cacheStatus: 'SKIP' }
    );
  }
}
