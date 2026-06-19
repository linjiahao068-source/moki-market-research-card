import { NextRequest } from 'next/server';
import {
  createRouteCacheKey,
  getRouteCacheTtlSeconds,
  jsonResponse,
  readRouteCache,
  writeRouteCache,
} from '@/lib/api/routeCache';
import { getLlmProviderConfig } from '@/lib/llm/config';
import { generateResearchReportFromCard } from '@/lib/llm/researchReport';
import type { ResearchCard } from '@/types/research-card';
import type { ResearchSourceInput } from '@/types/research-report';

export const runtime = 'nodejs';
export const maxDuration = 120;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isResearchCard(value: unknown): value is ResearchCard {
  return isRecord(value) &&
    typeof value.slug === 'string' &&
    typeof value.ticker === 'string' &&
    typeof value.companyName === 'string' &&
    isRecord(value.summary) &&
    isRecord(value.fundamentals) &&
    isRecord(value.technicalContext) &&
    Array.isArray(value.nextSteps);
}

function isResearchSourceInputFact(value: unknown) {
  return isRecord(value) &&
    typeof value.kind === 'string' &&
    typeof value.label === 'string' &&
    typeof value.unit === 'string';
}

function isResearchSourceInput(value: unknown): value is ResearchSourceInput {
  if (!isRecord(value)) {
    return false;
  }

  const hasSnippets = Array.isArray(value.snippets) &&
    value.snippets.every((item) => typeof item === 'string');
  const hasText = typeof value.text === 'string' && value.text.trim().length > 0;
  const hasFacts = value.facts === undefined ||
    (Array.isArray(value.facts) && value.facts.every(isResearchSourceInputFact));

  return typeof value.title === 'string' &&
    typeof value.sourceLabel === 'string' &&
    typeof value.sourceType === 'string' &&
    hasFacts &&
    (hasText || hasSnippets);
}

function readSourceInputs(value: unknown) {
  if (value === undefined) {
    return undefined;
  }

  if (!Array.isArray(value) || !value.every(isResearchSourceInput)) {
    return null;
  }

  return value;
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json().catch(() => null) as {
      card?: unknown;
      input?: unknown;
      sources?: unknown;
      sourceInputs?: unknown;
    } | null;
    const card = payload?.card ?? payload?.input;
    const sourceInputs = readSourceInputs(payload?.sourceInputs ?? payload?.sources);
    const ttlSeconds = getRouteCacheTtlSeconds('research-report');

    if (!isResearchCard(card) || sourceInputs === null) {
      return jsonResponse(
        {
          ok: false,
          message: sourceInputs === null ? 'Invalid sourceInputs.' : 'Missing or invalid ResearchCard input.',
        },
        { status: 400, cacheStatus: 'SKIP' }
      );
    }

    const reportCard: ResearchCard = sourceInputs?.length
      ? {
          ...card,
          sourceInputs,
        }
      : card;
    const config = getLlmProviderConfig();
    const cacheKey = createRouteCacheKey('research-report', reportCard, [
      'prompt-v0.5.3',
      config.provider,
      config.model ?? 'no-model',
      config.jsonMode ? 'json-mode' : 'text-mode',
    ]);
    const cached = readRouteCache<{
      ok: true;
      report: Awaited<ReturnType<typeof generateResearchReportFromCard>>;
    }>(cacheKey);

    if (cached) {
      return jsonResponse(cached.value, {
        cacheStatus: 'HIT',
        ttlSeconds,
        visibility: 'internal',
        headers: {
          'x-moki-cache-age': String(cached.ageSeconds),
        },
      });
    }

    const report = await generateResearchReportFromCard(reportCard);
    const responsePayload = {
      ok: true,
      report,
    } as const;

    writeRouteCache(cacheKey, responsePayload, ttlSeconds);

    return jsonResponse(responsePayload, {
      cacheStatus: 'MISS',
      ttlSeconds,
      visibility: 'internal',
    });
  } catch (error) {
    console.error('Failed to generate ResearchReport:', error);

    return jsonResponse(
      {
        ok: false,
        message: 'Failed to generate ResearchReport.',
      },
      { status: 500, cacheStatus: 'SKIP' }
    );
  }
}
