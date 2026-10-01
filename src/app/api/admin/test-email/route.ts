import { NextResponse } from 'next/server';
import {
  getMailTransporter,
  getAdminEmail,
  sendSessionLaunchedEmail,
  sendSessionWinnerCrownedEmail,
  SAMPLE_EMAIL_MOVIES,
} from '@/lib/email';
import { computeSessionResponse, listSessions } from '@/lib/storage';
import { SessionConfig } from '@/types';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const targetEmail = searchParams.get('to') || getAdminEmail();
    const mode = searchParams.get('mode') || 'launched';
    const reqSessionId = searchParams.get('sessionId');

    if (!targetEmail) {
      return NextResponse.json({
        ok: false,
        error: 'No target email provided or ADMIN_NOTIFICATION_EMAIL not configured',
        config: {
          hasSmtpUser: Boolean(process.env.SMTP_USER || process.env.GMAIL_USER),
          hasSmtpPass: Boolean(process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD),
          smtpHost: process.env.SMTP_HOST || 'smtp.gmail.com',
          smtpPort: process.env.SMTP_PORT || '465',
        },
      }, { status: 400 });
    }

    const transporter = getMailTransporter();
    if (!transporter) {
      return NextResponse.json({
        ok: false,
        error: 'SMTP credentials missing on server. Check SMTP_USER and SMTP_PASS environment variables.',
        config: {
          hasSmtpUser: Boolean(process.env.SMTP_USER || process.env.GMAIL_USER),
          hasSmtpPass: Boolean(process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD),
          smtpHost: process.env.SMTP_HOST || 'smtp.gmail.com',
          smtpPort: process.env.SMTP_PORT || '465',
        },
      }, { status: 500 });
    }

    // Verify SMTP connection
    console.info(`[Email Diagnostic] Verifying SMTP connection to ${process.env.SMTP_HOST || 'smtp.gmail.com'}...`);
    await transporter.verify();
    console.info('[Email Diagnostic] SMTP connection verified successfully!');

    // Find a real session or build a rich mock session
    let sessionData = reqSessionId ? await computeSessionResponse(reqSessionId).catch(() => null) : null;
    if (!sessionData) {
      const allSessions = await listSessions().catch(() => []);
      if (allSessions && allSessions.length > 0) {
        sessionData = await computeSessionResponse(allSessions[0].sessionId).catch(() => null);
      }
    }

    let session: SessionConfig;
    let contenders = SAMPLE_EMAIL_MOVIES;

    if (sessionData && sessionData.session) {
      session = sessionData.session;
      if (sessionData.allAvailableMovies && sessionData.allAvailableMovies.length > 0) {
        const activeSet = new Set(session.activeMovieIds || []);
        const filtered = sessionData.allAvailableMovies.filter((m) => activeSet.has(m.id));
        contenders = filtered.length > 0 ? filtered : sessionData.allAvailableMovies.slice(0, 6);
      }
    } else {
      session = {
        sessionId: '84920147',
        sessionTitle: 'Weekend Sci-Fi & Blockbuster Night',
        activeMovieIds: SAMPLE_EMAIL_MOVIES.map((m) => m.id),
        activeGenres: ['Sci-Fi', 'Action'],
        voters: [],
        ballots: {},
        status: 'voting',
        maxVotesPerVoter: 3,
        isPublic: true,
        deadlockRule: 'random',
        voteWeightMode: 'ranked',
        ageRatingLimit: 'ALL',
        yearFilter: 'ALL',
        genreFilter: [],
        streamingFilter: [],
        movieAdditionMode: 'voter_suggestions',
        maxSuggestionsPerVoter: 2,
        creatorName: 'Brian',
        creatorEmail: targetEmail,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }

    if (mode === 'crowned') {
      const winner = contenders[0] || SAMPLE_EMAIL_MOVIES[0];
      const leaderboard = contenders.slice(0, 3).map((m, idx) => ({
        movie: m,
        votes: 8 - idx * 2,
        points: 8 - idx * 2,
        totalVoters: 6,
        voterNames: ['Brian', 'Suzi', 'Michelle'],
      }));

      await sendSessionWinnerCrownedEmail({
        session,
        winnerMovie: winner,
        leaderboard,
      });

      return NextResponse.json({
        ok: true,
        mode: 'crowned',
        message: `Rich winner crowned email sent to ${targetEmail}`,
        sessionTitle: session.sessionTitle,
        winnerTitle: winner.title,
      });
    }

    // Default: send rich session launched template
    await sendSessionLaunchedEmail({
      session,
      contenders,
    });

    return NextResponse.json({
      ok: true,
      mode: 'launched',
      message: `Rich session launched email sent to ${targetEmail}`,
      sessionTitle: session.sessionTitle,
      movieCount: contenders.length,
      sampleMovies: contenders.slice(0, 6).map((m) => ({ title: m.title, year: m.year, rating: m.tmdbRating })),
    });
  } catch (error: any) {
    console.error('[Email Diagnostic] Test email failed:', error);
    return NextResponse.json({
      ok: false,
      error: error?.message || 'Failed to send test email',
      code: error?.code,
      command: error?.command,
      stack: process.env.NODE_ENV === 'development' ? error?.stack : undefined,
    }, { status: 500 });
  }
}
