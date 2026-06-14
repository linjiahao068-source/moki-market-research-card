import { NextRequest, NextResponse } from 'next/server';
import { getEarningsSnapshotData } from '@/lib/earnings/getEarningsSnapshotData';

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
    const data = await getEarningsSnapshotData({ query });

    return NextResponse.json({
      ok: true,
      data,
    });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        message: 'Failed to load earnings snapshot data.',
      },
      { status: 500 }
    );
  }
}
