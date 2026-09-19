import { NextResponse } from 'next/server';
import { toggleVote, setVoterVotes } from '@/lib/storage';
import { broadcaster } from '@/lib/broadcaster';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { voterId, movieId, movieIds, rank1MovieId, rank2MovieId, rank3MovieId } = body;

    if (!voterId) {
      return NextResponse.json({ error: 'voterId is required' }, { status: 400 });
    }

    let data;

    // Toggle a single movie vote
    if (movieId) {
      data = toggleVote(voterId, movieId);
    } else if (Array.isArray(movieIds)) {
      // Set full array of movie votes
      data = setVoterVotes(voterId, movieIds);
    } else {
      // Support legacy rank format if received
      const legacyIds: string[] = [rank1MovieId, rank2MovieId, rank3MovieId].filter(Boolean);
      data = setVoterVotes(voterId, legacyIds);
    }

    // Broadcast updated session state to all connected devices in real time
    broadcaster.broadcast(data);

    return NextResponse.json(data);
  } catch (error) {
    console.error('Failed to submit vote:', error);
    return NextResponse.json({ error: 'Failed to record vote' }, { status: 500 });
  }
}
