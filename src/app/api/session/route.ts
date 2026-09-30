import { NextResponse } from 'next/server';
import { MovieSuggestionError } from '@/lib/db';
import { SessionResponse } from '@/types';
import {
  computeSessionResponse,
  resetSessionVotes,
  updateSessionConfig,
  listSessions,
  createSession,
  addVoterToSession,
  launchSession,
  addCustomMovie,
  getHostPastVoters,
} from '@/lib/storage';
import { broadcaster } from '@/lib/broadcaster';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'list') {
      const sessions = await listSessions();
      return NextResponse.json({ sessions });
    }

    if (action === 'past-voters') {
      const hostEmail = searchParams.get('hostEmail');
      const hostUserId = searchParams.get('hostUserId');
      const voters = await getHostPastVoters(hostUserId, hostEmail);
      return NextResponse.json({ voters });
    }

    const sessionId = searchParams.get('sessionId') || 'session-main';
    const data = await computeSessionResponse(sessionId);
    if (data.expired) {
      return NextResponse.json(data, { status: 404 });
    }
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
    const sessionId = body.sessionId || 'session-main';
    let effectiveSessionId = sessionId;
    let data;
    let newVoter = null;
    let createdMovie = null;
    const hostActions = ['update-config', 'launch', 'reset', 'lock', 'unlock', 'pause', 'resume', 'delete'];
    if (hostActions.includes(action)) {
      const current = await computeSessionResponse(sessionId);
      if (current && current.session) {
        const { creatorUserId, creatorEmail } = current.session;
        const { hostUserId, hostEmail } = body;
        const matchesUserId = Boolean(creatorUserId && hostUserId && creatorUserId === hostUserId);
        const matchesEmail = Boolean(
          creatorEmail && hostEmail && creatorEmail.toLowerCase() === hostEmail.toLowerCase()
        );
        if (!matchesUserId && !matchesEmail) {
          return NextResponse.json(
            { error: 'Forbidden: Only the authenticated host matching this session can edit or configure it.' },
            { status: 403 }
          );
        }
      }
    }

    if (action === 'create') {
      const { title, creator, initialMovieIds } = body;
      if (!creator || (!creator.userId && !creator.email)) {
        return NextResponse.json(
          { error: 'Forbidden: Sessions can only be created by authenticated users.' },
          { status: 403 }
        );
      }
      data = await createSession(title, body.sessionId, creator, initialMovieIds);
      effectiveSessionId = data.session.sessionId;
    } else if (action === 'join-voter') {
      const { name, avatar, color, userId, email } = body;
      if (!name || !name.trim()) {
        return NextResponse.json({ error: 'Name is required' }, { status: 400 });
      }
      const result = await addVoterToSession(sessionId, name, avatar || '🍿', color, userId || null, email || null);
      newVoter = result.voter;
      data = result.sessionResponse;
      effectiveSessionId = data.session.sessionId;
    } else if (action === 'launch') {
      const current = await computeSessionResponse(sessionId);
      if (!current?.session?.activeMovieIds || current.session.activeMovieIds.length === 0) {
        return NextResponse.json(
          { error: 'Cannot start voting: at least 1 movie must be selected in the lineup.' },
          { status: 400 }
        );
      }
      data = await launchSession(sessionId);
      effectiveSessionId = data.session.sessionId;
    } else if (action === 'pause') {
      const { pauseSession } = await import('@/lib/storage');
      data = await pauseSession(sessionId);
      effectiveSessionId = data.session.sessionId;
    } else if (action === 'resume') {
      const { resumeSession } = await import('@/lib/storage');
      data = await resumeSession(sessionId);
      effectiveSessionId = data.session.sessionId;
    } else if (action === 'delete') {
      const { deleteSession } = await import('@/lib/storage');
      await deleteSession(sessionId);
      const expiredPayload: SessionResponse = {
        session: null as any,
        expired: true,
        error: 'Session not found or expired',
        turnout: { totalVoters: 0, votedCount: 0, pendingVoters: [], votedVoters: [] },
      };
      broadcaster.broadcast(sessionId, expiredPayload);
      return NextResponse.json({ success: true, deleted: true });
    } else if (action === 'add-custom-movie') {
      createdMovie = await addCustomMovie(sessionId, body.movie);
      data = await computeSessionResponse(sessionId);
      effectiveSessionId = data.session.sessionId;
    } else if (action === 'reset') {
      data = await resetSessionVotes(sessionId);
    } else if (action === 'lock') {
      let winnerId = body.winnerMovieId || null;
      if (!winnerId) {
        const currentData = await computeSessionResponse(sessionId);
        if (currentData.leaderboard && currentData.leaderboard.length > 0 && currentData.leaderboard[0].votes > 0) {
          winnerId = currentData.leaderboard[0].movie.id;
        }
      }
      data = await updateSessionConfig(sessionId, {
        status: 'locked',
        winnerMovieId: winnerId,
      });
    } else if (action === 'unlock') {
      data = await updateSessionConfig(sessionId, {
        status: 'voting',
        winnerMovieId: null,
      });
    } else if (action === 'update-config') {
      const {
        activeMovieIds,
        activeGenres,
        voters,
        sessionTitle,
        maxVotesPerVoter,
        isPublic,
        deadlockRule,
        voteWeightMode,
        ageRatingLimit,
        yearFilter,
        minYear,
        maxYear,
        genreFilter,
        streamingFilter,
        movieAdditionMode,
        maxSuggestionsPerVoter,
        status,
        isAiCurated,
        aiPrompt,
        aiMovieIds,
      } = body;
      data = await updateSessionConfig(sessionId, {
        activeMovieIds,
        activeGenres,
        voters,
        sessionTitle,
        maxVotesPerVoter,
        isPublic,
        deadlockRule,
        ...(voteWeightMode !== undefined ? { voteWeightMode } : {}),
        ageRatingLimit,
        yearFilter,
        minYear,
        maxYear,
        genreFilter,
        streamingFilter,
        movieAdditionMode,
        maxSuggestionsPerVoter,
        status,
        isAiCurated,
        aiPrompt,
        aiMovieIds,
      });
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // Broadcast change to all connected devices in this session
    broadcaster.broadcast(effectiveSessionId, data);

    return NextResponse.json({
      ...data,
      ...(newVoter ? { voter: newVoter } : {}),
      ...(createdMovie ? { movie: createdMovie } : {}),
    });
  } catch (error) {
    if (error instanceof MovieSuggestionError) return NextResponse.json({ error: error.message }, { status: 400 });
    console.error('Failed to update session:', error);
    return NextResponse.json({ error: 'Failed to update session' }, { status: 500 });
  }
}

