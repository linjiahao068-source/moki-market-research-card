import { NextRequest, NextResponse } from 'next/server';
import { generateResearchBrief } from '@/lib/llm/researchBrief';
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

    const brief = await generateResearchBrief(llmResearchInput);

    return NextResponse.json({
      ok: true,
      brief,
    });
  } catch (error) {
    console.error('Failed to generate research brief:', error);

    return NextResponse.json(
      {
        ok: false,
        message: 'Failed to generate research brief.',
      },
      { status: 500 }
    );
  }
}
