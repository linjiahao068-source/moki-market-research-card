import { NextRequest } from 'next/server';
import {
  createRouteCacheKey,
  getRouteCacheTtlSeconds,
  jsonResponse,
  readRouteCache,
  writeRouteCache,
} from '@/lib/api/routeCache';
import { buildMarketTechnicalDataSnapshot } from '@/lib/research-report/marketTechnicalDataAdapter';
import { resolveSecurityInput } from '@/lib/security/resolveSecurityInput';
import type { ResearchCard } from '@/types/research-card';
import type { SecurityRecord, SecurityResolution } from '@/types/security';

export const runtime = 'nodejs';
export const maxDuration = 30;

interface TechnicalDataInput {
  ticker: string;
  companyName?: string;
  market?: string;
  numericCode?: string;
  slug?: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isResearchCard(value: unknown): value is ResearchCard {
  return isRecord(value) &&
    typeof value.slug === 'string' &&
    typeof value.ticker === 'string' &&
    typeof value.companyName === 'string';
}

function inputFromSecurity(security: SecurityRecord): TechnicalDataInput {
  return {
    ticker: security.symbol ?? security.numericCode ?? security.companyName,
    companyName: security.companyName,
    market: security.market,
    numericCode: security.numericCode,
    slug: security.id,
  };
}

function inputFromCard(card: ResearchCard): TechnicalDataInput {
  return {
    ticker: card.ticker,
    companyName: card.companyName,
    market: card.market,
    numericCode: card.numericCode,
    slug: card.slug,
  };
}

async function buildCachedTechnicalData(input: TechnicalDataInput, extra: string[]) {
  const ttlSeconds = getRouteCacheTtlSeconds('technical-data');
  const cacheKey = createRouteCacheKey('technical-data', input, [
    'yahoo-chart-v0.5.2-hotfix',
    ...extra,
  ]);
  const cached = readRouteCache<{
    ok: true;
    snapshot: Awaited<ReturnType<typeof buildMarketTechnicalDataSnapshot>>;
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

  const snapshot = await buildMarketTechnicalDataSnapshot(input);
  const payload = {
    ok: true,
    snapshot,
  } as const;

  writeRouteCache(cacheKey, payload, ttlSeconds);

  return jsonResponse(payload, {
    cacheStatus: 'MISS',
    ttlSeconds,
    visibility: 'cdn',
  });
}

function securityFromResolution(resolution: SecurityResolution) {
  if (resolution.status === 'matched') {
    return resolution.security;
  }

  if (resolution.status === 'unmatched') {
    return resolution.fallbackSecurity;
  }

  return null;
}

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('query')?.trim() ?? '';

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

    const security = securityFromResolution(resolution);

    if (!security) {
      return jsonResponse(
        {
          ok: false,
          message: 'Unable to resolve security input.',
          resolution,
        },
        { status: 400, cacheStatus: 'SKIP' }
      );
    }

    return buildCachedTechnicalData(inputFromSecurity(security), [query.toLowerCase()]);
  } catch (error) {
    console.error('Failed to load technical data:', error);

    return jsonResponse(
      {
        ok: false,
        message: 'Failed to load technical data.',
      },
      { status: 500, cacheStatus: 'SKIP' }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json().catch(() => null) as { card?: unknown; input?: unknown } | null;
    const card = payload?.card ?? payload?.input;

    if (!isResearchCard(card)) {
      return jsonResponse(
        {
          ok: false,
          message: 'Missing or invalid ResearchCard input.',
        },
        { status: 400, cacheStatus: 'SKIP' }
      );
    }

    return buildCachedTechnicalData(inputFromCard(card), [card.slug]);
  } catch (error) {
    console.error('Failed to load technical data:', error);

    return jsonResponse(
      {
        ok: false,
        message: 'Failed to load technical data.',
      },
      { status: 500, cacheStatus: 'SKIP' }
    );
  }
}
