import nodemailer, { type Transporter } from 'nodemailer';
import { SessionConfig, MovieScore, Movie } from '@/types';

/**
 * Configure Nodemailer with Gmail SMTP.
 *
 * For Gmail:
 * - SMTP_USER: Your Gmail address (e.g. yourname@gmail.com)
 * - SMTP_PASS: A 16-character Google "App Password" (created at myaccount.google.com/apppasswords)
 * - ADMIN_NOTIFICATION_EMAIL: Your notification inbox (defaults to SMTP_USER if not set)
 */

let cachedTransporter: Transporter | null = null;

export function getMailTransporter(): Transporter | null {
  const user = (process.env.SMTP_USER || process.env.GMAIL_USER || '').trim();
  const rawPass = (process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD || '').trim();
  // Strip any accidental spaces in Google App Passwords (e.g. "abcd efgh ijkl mnop" -> "abcdefghijklmnop")
  const pass = rawPass.replace(/\s+/g, '');

  if (!user || !pass) {
    return null;
  }

  if (!cachedTransporter) {
    const host = process.env.SMTP_HOST || 'smtp.gmail.com';
    const port = Number(process.env.SMTP_PORT) || 465;
    const secure = port === 465;

    console.info(`[Email] Initializing mail transporter via ${host}:${port} (secure: ${secure}) for user: ${user}`);

    cachedTransporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user,
        pass,
      },
    });
  }

  return cachedTransporter;
}

export function getAdminEmail(): string | null {
  const email = (
    process.env.ADMIN_NOTIFICATION_EMAIL ||
    process.env.SMTP_USER ||
    process.env.GMAIL_USER ||
    ''
  ).trim();
  return email || null;
}

function getSenderAddress(): string {
  const user = (process.env.SMTP_USER || process.env.GMAIL_USER || 'notifications@movienight.app').trim();
  const name = process.env.SMTP_FROM_NAME || 'Movie Night';
  return `"${name}" <${user}>`;
}

function getAppOrigin(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '');
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return 'http://localhost:3000';
}

function formatCode(sessionId: string): string {
  const digits = sessionId.replace(/\D/g, '');
  if (digits.length === 8) {
    return `${digits.slice(0, 4)} ${digits.slice(4)}`;
  }
  return sessionId;
}

/** Sample fallback movies with valid TMDB CDN posters for previews and initial session emails */
export const SAMPLE_EMAIL_MOVIES: Movie[] = [
  {
    id: 'sample-1',
    title: 'Dune: Part Two',
    year: 2024,
    genre: 'Sci-Fi / Adventure',
    genreEmoji: '🚀',
    director: 'Denis Villeneuve',
    cast: ['Timothée Chalamet', 'Zendaya'],
    synopsis: 'Paul Atreides unites with the Fremen while seeking revenge against the conspirators who destroyed his family.',
    posterUrl: 'https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg',
    tmdbRating: 8.2,
    imdbRating: 8.5,
    imdbId: 'tt15239678',
    imdbUrl: 'https://www.imdb.com/title/tt15239678',
    youtubeTrailerId: 'Way9Dexny3w',
  },
  {
    id: 'sample-2',
    title: 'Oppenheimer',
    year: 2023,
    genre: 'Drama / History',
    genreEmoji: '💥',
    director: 'Christopher Nolan',
    cast: ['Cillian Murphy', 'Emily Blunt'],
    synopsis: 'The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb.',
    posterUrl: 'https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg',
    tmdbRating: 8.1,
    imdbRating: 8.9,
    imdbId: 'tt15398776',
    imdbUrl: 'https://www.imdb.com/title/tt15398776',
    youtubeTrailerId: 'uYPbbksJxIg',
  },
  {
    id: 'sample-3',
    title: 'Interstellar',
    year: 2014,
    genre: 'Sci-Fi / Space',
    genreEmoji: '🚀',
    director: 'Christopher Nolan',
    cast: ['Matthew McConaughey', 'Anne Hathaway'],
    synopsis: 'A team of explorers travel through a wormhole in space in an attempt to ensure humanity\'s survival.',
    posterUrl: 'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
    tmdbRating: 8.4,
    imdbRating: 8.7,
    imdbId: 'tt0816692',
    imdbUrl: 'https://www.imdb.com/title/tt0816692',
    youtubeTrailerId: 'zSWdZVtXT7E',
  },
  {
    id: 'sample-4',
    title: 'The Dark Knight',
    year: 2008,
    genre: 'Action / Crime',
    genreEmoji: '🦇',
    director: 'Christopher Nolan',
    cast: ['Christian Bale', 'Heath Ledger'],
    synopsis: 'When the menace known as the Joker wreaks havoc and chaos on Gotham, Batman must accept one of the greatest psychological and physical tests.',
    posterUrl: 'https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg',
    tmdbRating: 8.5,
    imdbRating: 9.0,
    imdbId: 'tt0468569',
    imdbUrl: 'https://www.imdb.com/title/tt0468569',
    youtubeTrailerId: 'EXeTwQWrcwY',
  },
  {
    id: 'sample-5',
    title: 'Across the Spider-Verse',
    year: 2023,
    genre: 'Animation / Action',
    genreEmoji: '🕷️',
    director: 'Joaquim Dos Santos',
    cast: ['Shameik Moore', 'Hailee Steinfeld'],
    synopsis: 'Miles Morales catapults across the Multiverse, where he encounters a team of Spider-People charged with protecting its existence.',
    posterUrl: 'https://image.tmdb.org/t/p/w500/8Vt6mWEReuy4Of61Lnj5Xj704m8.jpg',
    tmdbRating: 8.4,
    imdbRating: 8.6,
    imdbId: 'tt9362722',
    imdbUrl: 'https://www.imdb.com/title/tt9362722',
    youtubeTrailerId: 'cqGjhVJWtEg',
  },
  {
    id: 'sample-6',
    title: 'Inception',
    year: 2010,
    genre: 'Sci-Fi / Thriller',
    genreEmoji: '🌀',
    director: 'Christopher Nolan',
    cast: ['Leonardo DiCaprio', 'Joseph Gordon-Levitt'],
    synopsis: 'A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea.',
    posterUrl: 'https://image.tmdb.org/t/p/w500/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg',
    tmdbRating: 8.4,
    imdbRating: 8.8,
    imdbId: 'tt1375666',
    imdbUrl: 'https://www.imdb.com/title/tt1375666',
    youtubeTrailerId: 'YoHD9XEInc0',
  },
];

/**
 * Send email notification when a session is launched (created and voting opened).
 * Recipients: Host (if known) + Admin (you).
 */
export async function sendSessionLaunchedEmail({
  session,
  contenders,
}: {
  session: SessionConfig;
  contenders?: Movie[];
}): Promise<void> {
  const transporter = getMailTransporter();
  if (!transporter) {
    console.info('[Email] SMTP credentials not configured. Skipping session launch email.');
    return;
  }

  try {
    const adminEmail = getAdminEmail();
    const hostEmail = session.creatorEmail?.trim();

    const recipientSet = new Set<string>();
    if (adminEmail) recipientSet.add(adminEmail.toLowerCase());
    if (hostEmail) recipientSet.add(hostEmail.toLowerCase());

    const recipients = Array.from(recipientSet);
    if (recipients.length === 0) {
      console.info('[Email] No recipients found for session launched email.');
      return;
    }

    const origin = getAppOrigin();
    const sessionUrl = `${origin}/s/${encodeURIComponent(session.sessionId)}`;
    const liveUrl = `${origin}/s/${encodeURIComponent(session.sessionId)}/live`;
    const formattedCode = formatCode(session.sessionId);
    const sessionTitle = session.sessionTitle || `Movie Night ${session.sessionId}`;
    const hostName = session.creatorName || hostEmail?.split('@')[0] || 'A Host';
    const hostAvatar = session.creatorAvatar || '🎬';

    // Retrieve full movie lineup if not passed directly
    let movieContenders = contenders && contenders.length > 0 ? contenders : [];
    if (movieContenders.length === 0) {
      try {
        const { computeSessionResponse } = await import('@/lib/storage');
        const sessionData = await computeSessionResponse(session.sessionId);
        if (sessionData && sessionData.allAvailableMovies) {
          const activeIds = new Set(session.activeMovieIds || []);
          movieContenders = sessionData.allAvailableMovies.filter((m) => activeIds.has(m.id));
          if (movieContenders.length === 0) {
            movieContenders = sessionData.allAvailableMovies.slice(0, 6);
          }
        }
      } catch (err) {
        console.warn('[Email] Could not load movie contenders for email:', err);
      }
    }

    if (movieContenders.length === 0) {
      movieContenders = SAMPLE_EMAIL_MOVIES;
    }

    const movieCount = session.activeMovieIds?.length || movieContenders.length;

    // Rules breakdown
    const votesRule = session.maxVotesPerVoter ? `Up to ${session.maxVotesPerVoter} votes/person` : 'Unlimited votes';
    const weightRule = session.voteWeightMode === 'ranked' ? 'First-choice tiebreaker' : 'Equal weighting';
    const privacyRule = session.isPublic === false ? 'Secret ballot' : 'Live podium';
    const rulesSummary = `${votesRule} • ${weightRule} • ${privacyRule}`;

    // One-sentence introduction
    const oneSentenceIntro = session.aiPrompt
      ? `You've been invited to vote on tonight's lineup based on the theme &ldquo;${session.aiPrompt}&rdquo;.`
      : `You've been invited to vote and help choose tonight's feature film from our contender lineup!`;

    // Social share links
    const shareText = `🍿 Cast your vote on our living room movie ballot for "${sessionTitle}"! Code: ${formattedCode}`;
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(`${shareText}\n\n${sessionUrl}`)}`;
    const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(sessionUrl)}&text=${encodeURIComponent(shareText)}`;
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(sessionUrl)}`;

    // Build movie poster grid (up to 6 posters in rows of 3)
    const displayMovies = movieContenders.slice(0, 6);
    const movieRows: Movie[][] = [];
    for (let i = 0; i < displayMovies.length; i += 3) {
      movieRows.push(displayMovies.slice(i, i + 3));
    }

    const movieGridHtml = movieRows
      .map((row) => `
        <tr>
          ${row
            .map((m) => {
              const poster = m.posterUrl?.startsWith('http')
                ? m.posterUrl
                : `${origin}${m.posterUrl || '/movie-placeholder.svg'}`;
              const rating =
                m.tmdbRating != null
                  ? m.tmdbRating.toFixed(1)
                  : m.imdbRating != null
                  ? m.imdbRating.toFixed(1)
                  : null;
              const genre = m.genre || (m as any).genres?.[0] || '';

              return `
              <td width="33.33%" valign="top" style="padding: 6px; box-sizing: border-box;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #080b12; border: 1px solid #1e293b; border-radius: 14px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.4);">
                  <tr>
                    <td style="padding: 0;">
                      <a href="${sessionUrl}" target="_blank" style="text-decoration: none; display: block;">
                        <img src="${poster}" alt="${m.title}" width="160" style="width: 100%; height: auto; display: block; border-top-left-radius: 13px; border-top-right-radius: 13px; aspect-ratio: 2/3; object-fit: cover;" />
                      </a>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 8px 12px;">
                      <div style="color: #ffffff; font-size: 13px; font-weight: 800; line-height: 1.3; margin-bottom: 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                        ${m.title}
                      </div>
                      <div style="font-size: 11px; color: #94a3b8; font-weight: 600;">
                        <span>${m.year || ''}</span>
                        ${rating ? `<span style="color: #f59e0b; margin-left: 6px; font-weight: 700;">★ ${rating}</span>` : ''}
                      </div>
                      ${genre ? `<div style="font-size: 10px; color: #64748b; margin-top: 4px; text-transform: uppercase; font-weight: 700; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${genre}</div>` : ''}
                    </td>
                  </tr>
                </table>
              </td>
            `;
            })
            .join('')}
          ${row.length < 3 ? `<td width="${(3 - row.length) * 33.33}%"></td>` : ''}
        </tr>
      `)
      .join('');

    const extraMoviesNotice =
      movieCount > 6
        ? `
      <tr>
        <td colspan="3" style="text-align: center; padding-top: 8px; color: #94a3b8; font-size: 12px; font-weight: 700;">
          + ${movieCount - 6} more contender movies waiting on the ballot!
        </td>
      </tr>
    `
        : '';

    console.info(`[Email] Sending rich session launched notification for session ${session.sessionId} to: ${recipients.join(', ')}`);

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>🍿 Voting Started: ${sessionTitle}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #080b12; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f8fafc; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #080b12; padding: 36px 12px;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table role="presentation" width="100%" style="max-width: 620px; background-color: #0f172a; border: 1px solid #1e293b; border-radius: 24px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);">
          
          <!-- Top Brand Header Banner -->
          <tr>
            <td style="padding: 32px 28px 24px; background: linear-gradient(180deg, rgba(245, 158, 11, 0.22) 0%, rgba(15, 23, 42, 0) 100%); text-align: center;">
              
              <!-- Popcorn Brand Badge -->
              <div style="display: inline-block; width: 64px; height: 64px; line-height: 64px; border-radius: 20px; background: linear-gradient(135deg, #f59e0b, #dc2626); font-size: 32px; box-shadow: 0 10px 25px rgba(245, 158, 11, 0.4); text-align: center;">
                🍿
              </div>

              <!-- Brand Name -->
              <div style="color: #ffffff; font-size: 14px; font-weight: 900; letter-spacing: 1px; text-transform: uppercase; margin-top: 12px;">
                MovieNight
              </div>

              <!-- Status Badge -->
              <div style="margin-top: 8px;">
                <span style="display: inline-block; background-color: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.35); font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; padding: 4px 12px; border-radius: 9999px;">
                  🟢 Voting Is Live
                </span>
              </div>

              <!-- Main Title -->
              <h1 style="color: #ffffff; font-size: 26px; font-weight: 900; margin: 14px 0 6px; letter-spacing: -0.5px; line-height: 1.25;">
                Cast Your Vote for <br />
                <span style="color: #fbbf24;">${sessionTitle}</span>
              </h1>

              <!-- One-Sentence Introduction -->
              <p style="color: #cbd5e1; font-size: 15px; margin: 8px 0 0; line-height: 1.5; font-weight: 500;">
                ${oneSentenceIntro}
              </p>
            </td>
          </tr>

          <!-- Content Body -->
          <tr>
            <td style="padding: 0 28px 28px;">

              <!-- Explanation: What is this voting session for? -->
              <div style="background: linear-gradient(135deg, rgba(245, 158, 11, 0.08), rgba(15, 23, 42, 0.8)); border: 1px solid rgba(245, 158, 11, 0.25); border-left: 4px solid #f59e0b; border-radius: 14px; padding: 16px 18px; margin-bottom: 22px; text-align: left;">
                <div style="font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.8px; color: #fbbf24; margin-bottom: 4px;">
                  🎬 What is this voting session for?
                </div>
                <div style="color: #cbd5e1; font-size: 13px; line-height: 1.55;">
                  MovieNight eliminates endless living room streaming debate. Everyone joins the ballot directly from their phone, casts their votes, and our real-time podium crowns the group winner before movie time!
                </div>
              </div>

              <!-- Session Details Card -->
              <div style="background-color: #080b12; border: 1px solid #1e293b; border-radius: 16px; padding: 18px 20px; margin-bottom: 26px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                  <tr>
                    <td style="color: #94a3b8; font-size: 13px; padding-bottom: 12px; font-weight: 600;">Session Code:</td>
                    <td style="text-align: right; padding-bottom: 12px;">
                      <span style="font-family: monospace; font-size: 16px; font-weight: 900; color: #fbbf24; background: rgba(245, 158, 11, 0.15); border: 1px solid rgba(245, 158, 11, 0.35); padding: 4px 12px; border-radius: 8px; letter-spacing: 1px;">
                        ${formattedCode}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td style="color: #94a3b8; font-size: 13px; padding-bottom: 12px; font-weight: 600;">Hosted By:</td>
                    <td style="color: #ffffff; font-size: 14px; font-weight: 700; text-align: right; padding-bottom: 12px;">
                      <span style="margin-right: 4px;">${hostAvatar}</span> ${hostName}
                    </td>
                  </tr>
                  <tr>
                    <td style="color: #94a3b8; font-size: 13px; padding-bottom: 12px; font-weight: 600;">Voting Rules:</td>
                    <td style="color: #e2e8f0; font-size: 13px; font-weight: 600; text-align: right; padding-bottom: 12px;">
                      ${rulesSummary}
                    </td>
                  </tr>
                  <tr>
                    <td style="color: #94a3b8; font-size: 13px; font-weight: 600;">Contender Lineup:</td>
                    <td style="color: #ffffff; font-size: 14px; font-weight: 800; text-align: right;">
                      ${movieCount} Movies
                    </td>
                  </tr>
                </table>
              </div>

              <!-- Movie Posters Selection Showcase -->
              <div style="margin-bottom: 26px;">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
                  <span style="color: #ffffff; font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.8px;">
                    🍿 Contenders Lineup Showcase (${movieCount})
                  </span>
                </div>

                <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                  ${movieGridHtml}
                  ${extraMoviesNotice}
                </table>
              </div>

              <!-- Primary & Secondary Action Buttons -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 24px;">
                <tr>
                  <td align="center" style="padding-bottom: 10px;">
                    <a href="${sessionUrl}" target="_blank" style="display: block; width: 100%; box-sizing: border-box; background: linear-gradient(135deg, #f59e0b, #d97706); color: #080b12; font-size: 15px; font-weight: 900; text-decoration: none; padding: 15px 24px; border-radius: 14px; text-align: center; box-shadow: 0 10px 25px rgba(245, 158, 11, 0.35);">
                      🗳️ Open Ballot &amp; Cast Votes &rarr;
                    </a>
                  </td>
                </tr>
                <tr>
                  <td align="center">
                    <a href="${liveUrl}" target="_blank" style="display: block; width: 100%; box-sizing: border-box; background-color: #1e293b; color: #cbd5e1; font-size: 13px; font-weight: 700; text-decoration: none; padding: 12px 24px; border-radius: 14px; text-align: center; border: 1px solid #334155;">
                      📊 View Real-Time Live Podium &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Share Box Section -->
              <div style="background-color: #080b12; border: 1px solid #1e293b; border-radius: 16px; padding: 18px 20px; text-align: center;">
                <div style="color: #cbd5e1; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 8px;">
                  📤 Share Invite With Friends
                </div>

                <!-- 1-Click Social Share Row -->
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                  <tr>
                    <td align="center" style="padding-bottom: 12px;">
                      <table role="presentation" cellspacing="0" cellpadding="0">
                        <tr>
                          <td style="padding: 0 4px;">
                            <a href="${whatsappUrl}" target="_blank" style="display: inline-block; background-color: #064e3b; border: 1px solid #059669; color: #34d399; font-size: 12px; font-weight: 800; text-decoration: none; padding: 8px 14px; border-radius: 10px;">
                              💬 WhatsApp
                            </a>
                          </td>
                          <td style="padding: 0 4px;">
                            <a href="${telegramUrl}" target="_blank" style="display: inline-block; background-color: #082f49; border: 1px solid #0284c7; color: #38bdf8; font-size: 12px; font-weight: 800; text-decoration: none; padding: 8px 14px; border-radius: 10px;">
                              ✈️ Telegram
                            </a>
                          </td>
                          <td style="padding: 0 4px;">
                            <a href="${twitterUrl}" target="_blank" style="display: inline-block; background-color: #020617; border: 1px solid #475569; color: #f8fafc; font-size: 12px; font-weight: 800; text-decoration: none; padding: 8px 14px; border-radius: 10px;">
                              𝕏 Share
                            </a>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>

                <!-- Direct URL Box -->
                <div style="background-color: #0c101c; border: 1px dashed #334155; border-radius: 10px; padding: 10px 14px; text-align: center;">
                  <span style="color: #64748b; font-size: 11px; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px; display: block; margin-bottom: 2px;">Direct Session Link:</span>
                  <a href="${sessionUrl}" target="_blank" style="color: #fbbf24; font-size: 12px; font-family: monospace; font-weight: 700; text-decoration: underline; word-break: break-all;">
                    ${sessionUrl}
                  </a>
                </div>
              </div>

            </td>
          </tr>

          <!-- Card Footer -->
          <tr>
            <td style="padding: 20px 28px; border-top: 1px solid #1e293b; background-color: #0a0f1d; text-align: center; color: #64748b; font-size: 12px;">
              MovieNight &bull; Instant living room movie poll &bull; Session ${formattedCode}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    const info = await transporter.sendMail({
      from: getSenderAddress(),
      to: recipients.join(', '),
      subject: `🍿 Voting Live: ${sessionTitle} (Code: ${formattedCode})`,
      html,
    });
    console.info(`[Email] Session launched notification sent successfully. MessageId: ${info.messageId}`);
  } catch (err) {
    console.error('[Email] Failed to send session launched notification:', err);
  }
}

/**
 * Send email notification when a session is crowned / voting closed.
 * Recipients: All participants with known email + Host + Admin (you).
 */
export async function sendSessionWinnerCrownedEmail({
  session,
  winnerMovie,
  leaderboard = [],
}: {
  session: SessionConfig;
  winnerMovie: Movie | null;
  leaderboard?: MovieScore[];
}): Promise<void> {
  const transporter = getMailTransporter();
  if (!transporter) {
    console.info('[Email] SMTP credentials not configured. Skipping crowned winner email.');
    return;
  }

  try {
    const adminEmail = getAdminEmail();
    const hostEmail = session.creatorEmail?.trim();

    const recipientSet = new Set<string>();
    if (adminEmail) recipientSet.add(adminEmail.toLowerCase());
    if (hostEmail) recipientSet.add(hostEmail.toLowerCase());

    // Add all session voters who have registered email addresses
    if (Array.isArray(session.voters)) {
      for (const voter of session.voters) {
        if (voter.email && voter.email.includes('@')) {
          recipientSet.add(voter.email.trim().toLowerCase());
        }
      }
    }

    const recipients = Array.from(recipientSet);
    if (recipients.length === 0) {
      console.info('[Email] No recipients found for crowned winner email.');
      return;
    }

    const origin = getAppOrigin();
    const sessionUrl = `${origin}/s/${encodeURIComponent(session.sessionId)}`;
    const liveUrl = `${origin}/s/${encodeURIComponent(session.sessionId)}/live`;
    const formattedCode = formatCode(session.sessionId);
    const sessionTitle = session.sessionTitle || `Movie Night ${session.sessionId}`;

    const winnerTitle = winnerMovie?.title || 'Winning Film';
    const winnerYear = winnerMovie?.year ? `(${winnerMovie.year})` : '';
    const winnerRating =
      winnerMovie?.tmdbRating != null
        ? `${winnerMovie.tmdbRating.toFixed(1)} TMDB`
        : winnerMovie?.imdbRating != null
        ? `${winnerMovie.imdbRating.toFixed(1)} IMDb`
        : '';
    const winnerPoster = winnerMovie?.posterUrl?.startsWith('http')
      ? winnerMovie.posterUrl
      : `${origin}${winnerMovie?.posterUrl || '/movie-placeholder.svg'}`;

    // Social share links
    const shareText = `🏆 The winner has been crowned for "${sessionTitle}"! "${winnerTitle}" won! Check out the results:`;
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(`${shareText}\n\n${liveUrl}`)}`;
    const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(liveUrl)}&text=${encodeURIComponent(shareText)}`;
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(liveUrl)}`;

    console.info(`[Email] Sending winner crowned notification for session ${session.sessionId} to: ${recipients.join(', ')}`);

    const topContendersHtml = leaderboard
      .slice(0, 3)
      .map((item, idx) => {
        const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉';
        return `
          <tr style="border-bottom: 1px solid #1e293b;">
            <td style="padding: 10px 12px; font-size: 16px;">${medal}</td>
            <td style="padding: 10px 12px; color: #ffffff; font-weight: 700; font-size: 14px;">${item.movie.title}</td>
            <td style="padding: 10px 12px; color: #f59e0b; font-weight: 800; font-size: 14px; text-align: right;">${item.votes} vote${item.votes === 1 ? '' : 's'}</td>
          </tr>
        `;
      })
      .join('');

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>🏆 The Winner Has Been Crowned: ${winnerTitle}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #080b12; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f8fafc; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #080b12; padding: 36px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 620px; background-color: #0f172a; border: 1px solid #1e293b; border-radius: 24px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.7);">
          <!-- Crown Header -->
          <tr>
            <td style="padding: 32px 28px 20px; background: linear-gradient(180deg, rgba(234, 179, 8, 0.22) 0%, rgba(15, 23, 42, 0) 100%); text-align: center;">
              <div style="display: inline-block; width: 68px; height: 68px; line-height: 68px; border-radius: 22px; background: linear-gradient(135deg, #eab308, #ca8a04); font-size: 36px; box-shadow: 0 10px 30px rgba(234, 179, 8, 0.4);">
                👑
              </div>
              <div style="color: #fbbf24; font-size: 13px; font-weight: 900; letter-spacing: 1px; text-transform: uppercase; margin-top: 12px;">
                Final Results Are In
              </div>
              <h1 style="color: #ffffff; font-size: 28px; font-weight: 900; margin: 12px 0 6px; letter-spacing: -0.5px;">
                The Winner Is Crowned!
              </h1>
              <p style="color: #cbd5e1; font-size: 14px; margin: 0;">
                Official group outcome for <strong>${sessionTitle}</strong>
              </p>
            </td>
          </tr>

          <!-- Winner Spotlight Card -->
          <tr>
            <td style="padding: 0 28px 24px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: linear-gradient(135deg, rgba(234, 179, 8, 0.15), rgba(15, 23, 42, 0.8)); border: 2px solid #eab308; border-radius: 20px; overflow: hidden; padding: 20px;">
                <tr>
                  <td width="120" valign="top" style="padding-right: 18px;">
                    <img src="${winnerPoster}" alt="${winnerTitle}" width="120" style="width: 120px; border-radius: 12px; display: block; box-shadow: 0 10px 20px rgba(0,0,0,0.6);" />
                  </td>
                  <td valign="middle">
                    <span style="display: inline-block; background-color: #eab308; color: #080b12; font-size: 11px; font-weight: 900; text-transform: uppercase; padding: 4px 10px; border-radius: 9999px; letter-spacing: 0.5px; margin-bottom: 8px;">
                      🥇 1st Place Winner
                    </span>
                    <h2 style="color: #ffffff; font-size: 24px; font-weight: 900; margin: 0 0 6px; line-height: 1.2;">
                      ${winnerTitle} <span style="font-size: 16px; color: #94a3b8; font-weight: 500;">${winnerYear}</span>
                    </h2>
                    ${winnerRating ? `<p style="color: #facc15; font-size: 13px; font-weight: 700; margin: 0 0 10px;">⭐ ${winnerRating}</p>` : ''}
                    ${winnerMovie?.synopsis ? `<p style="color: #94a3b8; font-size: 12px; margin: 0; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;">${winnerMovie.synopsis}</p>` : ''}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Leaderboard Podium Strip -->
          ${
            topContendersHtml
              ? `
          <tr>
            <td style="padding: 0 28px 24px;">
              <div style="background-color: #080b12; border: 1px solid #1e293b; border-radius: 16px; padding: 16px;">
                <div style="color: #94a3b8; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px;">
                  Final Podium Standings
                </div>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                  ${topContendersHtml}
                </table>
              </div>
            </td>
          </tr>
          `
              : ''
          }

          <!-- View Live Podium Action & Share -->
          <tr>
            <td style="padding: 0 28px 28px; text-align: center;">
              <a href="${liveUrl}" target="_blank" style="display: block; width: 100%; box-sizing: border-box; background: linear-gradient(135deg, #eab308, #ca8a04); color: #080b12; font-size: 15px; font-weight: 900; text-decoration: none; padding: 15px 24px; border-radius: 14px; text-align: center; box-shadow: 0 10px 25px rgba(234, 179, 8, 0.35); margin-bottom: 16px;">
                🏆 View Official Live Podium Results &rarr;
              </a>

              <!-- Share Outcome Row -->
              <div style="background-color: #080b12; border: 1px solid #1e293b; border-radius: 14px; padding: 14px; text-align: center;">
                <div style="color: #94a3b8; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 8px;">
                  Share Results
                </div>
                <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 0 auto;">
                  <tr>
                    <td style="padding: 0 4px;">
                      <a href="${whatsappUrl}" target="_blank" style="display: inline-block; background-color: #064e3b; border: 1px solid #059669; color: #34d399; font-size: 12px; font-weight: 800; text-decoration: none; padding: 7px 12px; border-radius: 8px;">
                        💬 WhatsApp
                      </a>
                    </td>
                    <td style="padding: 0 4px;">
                      <a href="${telegramUrl}" target="_blank" style="display: inline-block; background-color: #082f49; border: 1px solid #0284c7; color: #38bdf8; font-size: 12px; font-weight: 800; text-decoration: none; padding: 7px 12px; border-radius: 8px;">
                        ✈️ Telegram
                      </a>
                    </td>
                    <td style="padding: 0 4px;">
                      <a href="${twitterUrl}" target="_blank" style="display: inline-block; background-color: #020617; border: 1px solid #475569; color: #f8fafc; font-size: 12px; font-weight: 800; text-decoration: none; padding: 7px 12px; border-radius: 8px;">
                        𝕏 Share
                      </a>
                    </td>
                  </tr>
                </table>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 28px; border-top: 1px solid #1e293b; background-color: #0a0f1d; text-align: center; color: #64748b; font-size: 12px;">
              MovieNight &bull; Session ${formattedCode} &bull; Thanks for voting!
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    const info = await transporter.sendMail({
      from: getSenderAddress(),
      to: recipients.join(', '),
      subject: `🏆 The Winner Is Crowned: ${winnerTitle} - ${sessionTitle}`,
      html,
    });
    console.info(`[Email] Winner crowned notification sent successfully. MessageId: ${info.messageId}`);
  } catch (err) {
    console.error('[Email] Failed to send crowned winner notification:', err);
  }
}
