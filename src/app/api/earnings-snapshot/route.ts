import { NextRequest, NextResponse } from 'next/server';
import { getBasicCompanyData } from '@/lib/dataProviders/getBasicCompanyData';
import { getEnhancedEarningsSnapshot } from '@/lib/earnings/enhancedEarningsProvider';
import { getGuidanceData } from '@/lib/earnings/guidanceDataProvider';
import { resolveSecurityInput } from '@/lib/security/resolveSecurityInput';

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('query')?.trim() ?? '';

  if (!query) {
    return NextResponse.json(
      {
        ok: false,
        message: 'Missing query parameter.',
      },
      { status: 400 }
    );
  }

  try {
    const resolution = resolveSecurityInput(query);

    if (resolution.status === 'ambiguous') {
      return NextResponse.json(
        {
          ok: false,
          message: 'Ambiguous security input.',
          resolution,
          candidates: resolution.candidates,
        },
        { status: 409 }
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
    const data = {
      ...snapshot,
      guidance: guidanceData.guidance.length > 0 ? guidanceData.guidance : snapshot.guidance,
      guidanceEvidence: guidanceData.guidanceEvidence.length > 0
        ? guidanceData.guidanceEvidence
        : snapshot.guidanceEvidence,
      guidanceSource: guidanceData.source,
      guidanceConfidence: guidanceData.confidence,
      warnings: [...new Set([...snapshot.warnings, ...guidanceData.warnings])],
    };

    return NextResponse.json({
      ok: true,
      resolution,
      data,
    });
  } catch (error) {
    console.error('Failed to load earnings snapshot data:', error);
    return NextResponse.json(
      {
        ok: false,
        message: 'Failed to load earnings snapshot data.',
      },
      { status: 500 }
    );
  }
}
