import { NextRequest } from 'next/server';
import { jsonResponse } from '@/lib/api/routeCache';
import { ingestResearchSourceInputs } from '@/lib/research-report/sourceIngestion';
import type { ResearchSourceInput } from '@/types/research-report';

export const runtime = 'nodejs';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
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
  if (!Array.isArray(value)) {
    return null;
  }

  if (!value.every(isResearchSourceInput)) {
    return null;
  }

  return value;
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json().catch(() => null) as {
      ticker?: unknown;
      generatedAt?: unknown;
      sources?: unknown;
      sourceInputs?: unknown;
    } | null;
    const sourceInputs = readSourceInputs(payload?.sourceInputs ?? payload?.sources);

    if (!sourceInputs) {
      return jsonResponse(
        {
          ok: false,
          message: 'Missing or invalid sourceInputs.',
        },
        { status: 400, cacheStatus: 'SKIP' }
      );
    }

    const ingestion = ingestResearchSourceInputs({
      ticker: typeof payload?.ticker === 'string' ? payload.ticker : undefined,
      generatedAt: typeof payload?.generatedAt === 'string' ? payload.generatedAt : new Date().toISOString(),
      sourceInputs,
    });

    return jsonResponse(
      {
        ok: true,
        ingestion,
      },
      { cacheStatus: 'SKIP' }
    );
  } catch (error) {
    console.error('Failed to ingest research sources:', error);

    return jsonResponse(
      {
        ok: false,
        message: 'Failed to ingest research sources.',
      },
      { status: 500, cacheStatus: 'SKIP' }
    );
  }
}
