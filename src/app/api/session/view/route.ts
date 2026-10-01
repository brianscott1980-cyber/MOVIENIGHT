import { NextResponse } from 'next/server';
import { recordSessionView } from '@/lib/storage';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { sessionId, visitorId, voterId, voterName, avatar } = body;

    if (!sessionId) {
      return NextResponse.json({ ok: false, error: 'Missing sessionId' }, { status: 400 });
    }

    // Fire and forget - never block or wait on view logging
    void recordSessionView(sessionId, { visitorId, voterId, voterName, avatar });

    return NextResponse.json({ ok: true });
  } catch (err) {
    // Non-blocking failure
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
