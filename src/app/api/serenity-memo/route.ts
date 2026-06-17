import { NextRequest } from 'next/server';
import {
  createRouteCacheKey,
  getRouteCacheTtlSeconds,
  jsonResponse,
  readRouteCache,
  writeRouteCache,
} from '@/lib/api/routeCache';
import { getLlmProviderConfig } from '@/lib/llm/config';
import { generateSerenityMemo } from '@/lib/serenity/llmSerenityMemo';
import { isValidLlmResearchInput } from '@/lib/llm/schemas/researchBrief';

export const runtime = 'nodejs';
export const maxDuration = 90;

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json().catch(() => null) as { llmResearchInput?: unknown; input?: unknown } | null;
    const llmResearchInput = payload?.llmResearchInput ?? payload?.input;
    const ttlSeconds = getRouteCacheTtlSeconds('serenity-memo');

    if (!isValidLlmResearchInput(llmResearchInput)) {
      return jsonResponse(
        {
          ok: false,
          message: 'Missing or invalid llmResearchInput.',
        },
        { status: 400, cacheStatus: 'SKIP' }
      );
    }

    const config = getLlmProviderConfig();
    const cacheKey = createRouteCacheKey('serenity-memo', llmResearchInput, [
      'prompt-v0.3.6',
      config.provider,
      config.model ?? 'no-model',
      config.jsonMode ? 'json-mode' : 'text-mode',
    ]);
    const cached = readRouteCache<{
      ok: true;
      memo: Awaited<ReturnType<typeof generateSerenityMemo>>;
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

    const memo = await generateSerenityMemo(llmResearchInput);
    const responsePayload = {
      ok: true,
      memo,
    } as const;

    writeRouteCache(cacheKey, responsePayload, ttlSeconds);

    return jsonResponse(responsePayload, {
      cacheStatus: 'MISS',
      ttlSeconds,
      visibility: 'internal',
    });
  } catch (error) {
    console.error('Failed to generate Serenity memo:', error);

    return jsonResponse(
      {
        ok: false,
        message: 'Failed to generate Serenity memo.',
      },
      { status: 500, cacheStatus: 'SKIP' }
    );
  }
}
