import { NextRequest } from 'next/server';
import {
  createRouteCacheKey,
  getRouteCacheTtlSeconds,
  jsonResponse,
  readRouteCache,
  writeRouteCache,
} from '@/lib/api/routeCache';
import { getBasicCompanyData } from '@/lib/dataProviders/getBasicCompanyData';
import { getEnhancedEarningsSnapshot } from '@/lib/earnings/enhancedEarningsProvider';
import { getGuidanceData } from '@/lib/earnings/guidanceDataProvider';
import { buildResearchDataLayer } from '@/lib/research/factBuilder';
import { resolveSecurityInput } from '@/lib/security/resolveSecurityInput';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('query')?.trim() ?? '';
  const ttlSeconds = getRouteCacheTtlSeconds('earnings-snapshot');

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
    const cacheKey = createRouteCacheKey('earnings-snapshot', { query: query.toLowerCase() });
    const cached = readRouteCache<{
      ok: true;
      resolution: ReturnType<typeof resolveSecurityInput>;
      data: unknown;
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
    const snapshot = await getEnhancedEarningsSnapshot({ query, security, basicData });
    const guidanceData = await getGuidanceData({
      ticker: security.symbol ?? snapshot.symbol ?? query,
      security,
      basicData,
    });
    const mergedSnapshot = {
      ...snapshot,
      guidance: guidanceData.guidance.length > 0 ? guidanceData.guidance : snapshot.guidance,
      guidanceEvidence: guidanceData.guidanceEvidence.length > 0
        ? guidanceData.guidanceEvidence
        : snapshot.guidanceEvidence,
      guidanceSource: guidanceData.source,
      guidanceConfidence: guidanceData.confidence,
      warnings: [...new Set([...snapshot.warnings, ...guidanceData.warnings])],
    };
    const researchDataLayer = buildResearchDataLayer({
      ticker: security.symbol ?? mergedSnapshot.symbol ?? query,
      basicData,
      earningsSnapshot: mergedSnapshot,
    });
    const data = {
      ...mergedSnapshot,
      researchEvidence: researchDataLayer.evidence,
      facts: researchDataLayer.facts,
      factQuality: researchDataLayer.dataQuality,
      llmResearchInput: researchDataLayer.llmInput,
    };

    const payload = {
      ok: true,
      resolution,
      data,
    } as const;

    writeRouteCache(cacheKey, payload, ttlSeconds);

    return jsonResponse(payload, {
      cacheStatus: 'MISS',
      ttlSeconds,
      visibility: 'cdn',
    });
  } catch (error) {
    console.error('Failed to load earnings snapshot data:', error);
    return jsonResponse(
      {
        ok: false,
        message: 'Failed to load earnings snapshot data.',
      },
      { status: 500, cacheStatus: 'SKIP' }
    );
  }
}
