import { NextResponse } from 'next/server';
import { computeSessionResponse, resetSessionVotes, updateSessionConfig } from '@/lib/storage';
import { broadcaster } from '@/lib/broadcaster';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    const data = computeSessionResponse();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Failed to get session:', error);
    return NextResponse.json({ error: 'Failed to retrieve session' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action } = body;
    let data;

    if (action === 'reset') {
      data = resetSessionVotes();
    } else if (action === 'lock') {
      data = updateSessionConfig({
        status: 'locked',
        winnerMovieId: body.winnerMovieId || null,
      });
    } else if (action === 'unlock') {
      data = updateSessionConfig({
        status: 'voting',
        winnerMovieId: null,
      });
    } else if (action === 'update-config') {
      const { activeMovieIds, activeGenres, voters, sessionTitle } = body;
      data = updateSessionConfig({
        activeMovieIds,
        activeGenres,
        voters,
        sessionTitle,
      });
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // Broadcast change to all connected devices in real time
    broadcaster.broadcast(data);

    return NextResponse.json(data);
  } catch (error) {
    console.error('Failed to update session:', error);
    return NextResponse.json({ error: 'Failed to update session' }, { status: 500 });
  }
}
