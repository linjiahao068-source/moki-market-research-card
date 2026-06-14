import { NextRequest, NextResponse } from 'next/server';
import { getBasicCompanyData } from '@/lib/dataProviders/getBasicCompanyData';
import { resolveSecurityInput } from '@/lib/security/resolveSecurityInput';

// This API route requires a server/serverless Next.js deployment.
// It cannot be used directly with Next static export output: 'export'.
export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('query')?.trim() ?? '';

  if (!query) {
    return NextResponse.json(
      {
        error: 'Missing query parameter.',
      },
      { status: 400 }
    );
  }

  try {
    const resolution = resolveSecurityInput(query);

    if (resolution.status === 'ambiguous') {
      return NextResponse.json(
        {
          resolution,
          candidates: resolution.candidates,
        },
        { status: 409 }
      );
    }

    const security = resolution.status === 'matched' ? resolution.security : resolution.fallbackSecurity;
    const basicData = await getBasicCompanyData(security);

    return NextResponse.json({
      resolution,
      basicData,
    });
  } catch {
    return NextResponse.json(
      {
        error: 'Failed to load basic company data.',
      },
      { status: 500 }
    );
  }
}
