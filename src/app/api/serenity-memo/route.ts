import { NextRequest, NextResponse } from 'next/server';
import { generateSerenityMemo } from '@/lib/serenity/llmSerenityMemo';
import { isValidLlmResearchInput } from '@/lib/llm/schemas/researchBrief';

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json().catch(() => null) as { llmResearchInput?: unknown; input?: unknown } | null;
    const llmResearchInput = payload?.llmResearchInput ?? payload?.input;

    if (!isValidLlmResearchInput(llmResearchInput)) {
      return NextResponse.json(
        {
          ok: false,
          message: 'Missing or invalid llmResearchInput.',
        },
        { status: 400 }
      );
    }

    const memo = await generateSerenityMemo(llmResearchInput);

    return NextResponse.json({
      ok: true,
      memo,
    });
  } catch (error) {
    console.error('Failed to generate Serenity memo:', error);

    return NextResponse.json(
      {
        ok: false,
        message: 'Failed to generate Serenity memo.',
      },
      { status: 500 }
    );
  }
}
