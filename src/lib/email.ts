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

/**
 * Send email notification when a session is launched (created and voting opened).
 * Recipients: Host (if known) + Admin (you).
 */
export async function sendSessionLaunchedEmail({
  session,
}: {
  session: SessionConfig;
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
    const movieCount = session.activeMovieIds?.length || 0;

    console.info(`[Email] Sending session launched notification for session ${session.sessionId} to: ${recipients.join(', ')}`);

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>🍿 Voting Started: ${sessionTitle}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #080b12; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f8fafc;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #080b12; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 600px; background-color: #0f172a; border: 1px solid #334155; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.5);">
          <!-- Header Banner -->
          <tr>
            <td style="padding: 32px 32px 24px; background: linear-gradient(180deg, rgba(245, 158, 11, 0.2) 0%, rgba(15, 23, 42, 0) 100%); text-align: center;">
              <div style="display: inline-block; width: 64px; height: 64px; line-height: 64px; border-radius: 20px; background: linear-gradient(135deg, #f59e0b, #dc2626); font-size: 32px; box-shadow: 0 10px 25px rgba(245, 158, 11, 0.4);">
                🍿
              </div>
              <h1 style="color: #ffffff; font-size: 26px; font-weight: 900; margin: 16px 0 8px; letter-spacing: -0.5px;">
                Voting Is Now Live!
              </h1>
              <p style="color: #cbd5e1; font-size: 15px; margin: 0;">
                A new Movie Night session was just launched by <strong>${hostName}</strong>.
              </p>
            </td>
          </tr>

          <!-- Session Details Card -->
          <tr>
            <td style="padding: 0 32px 28px;">
              <div style="background-color: #080b12; border: 1px solid #1e293b; border-radius: 16px; padding: 24px; margin-bottom: 24px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                  <tr>
                    <td style="color: #94a3b8; font-size: 13px; padding-bottom: 12px;">Session Title:</td>
                    <td style="color: #ffffff; font-size: 16px; font-weight: 800; text-align: right; padding-bottom: 12px;">${sessionTitle}</td>
                  </tr>
                  <tr>
                    <td style="color: #94a3b8; font-size: 13px; padding-bottom: 12px;">Session Code:</td>
                    <td style="color: #fbbf24; font-size: 18px; font-family: monospace; font-weight: 900; text-align: right; padding-bottom: 12px; letter-spacing: 1px;">${formattedCode}</td>
                  </tr>
                  <tr>
                    <td style="color: #94a3b8; font-size: 13px;">Contenders:</td>
                    <td style="color: #ffffff; font-size: 14px; font-weight: 700; text-align: right;">${movieCount} Movies in Lineup</td>
                  </tr>
                </table>
              </div>

              <!-- Action Buttons -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="padding-bottom: 12px;">
                    <a href="${sessionUrl}" target="_blank" style="display: block; width: 100%; box-sizing: border-box; background: linear-gradient(135deg, #f59e0b, #d97706); color: #080b12; font-size: 15px; font-weight: 900; text-decoration: none; padding: 14px 24px; border-radius: 14px; text-align: center; box-shadow: 0 10px 25px rgba(245, 158, 11, 0.3);">
                      🗳️ Open Ballot &amp; Cast Votes &rarr;
                    </a>
                  </td>
                </tr>
                <tr>
                  <td align="center">
                    <a href="${liveUrl}" target="_blank" style="display: block; width: 100%; box-sizing: border-box; background-color: #1e293b; color: #cbd5e1; font-size: 13px; font-weight: 700; text-decoration: none; padding: 12px 24px; border-radius: 14px; text-align: center; border: 1px solid #334155;">
                      📊 View Real-Time Podium &rarr;
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 32px; border-top: 1px solid #1e293b; background-color: #0a0f1d; text-align: center; color: #64748b; font-size: 12px;">
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
    const liveUrl = `${origin}/s/${encodeURIComponent(session.sessionId)}/live`;
    const sessionTitle = session.sessionTitle || `Movie Night ${session.sessionId}`;
    const formattedCode = formatCode(session.sessionId);

    const winnerTitle = winnerMovie?.title || 'Winning Film';
    const winnerYear = winnerMovie?.year ? `(${winnerMovie.year})` : '';
    const winnerRating =
      winnerMovie?.tmdbRating != null
        ? `${winnerMovie.tmdbRating.toFixed(1)} TMDB`
        : winnerMovie?.imdbRating != null
        ? `${winnerMovie.imdbRating.toFixed(1)} IMDb`
        : '';
    const winnerPoster = winnerMovie?.posterUrl || `${origin}/movie-placeholder.svg`;

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
<html>
<head>
  <meta charset="utf-8">
  <title>🏆 The Winner Has Been Crowned: ${winnerTitle}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #080b12; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f8fafc;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #080b12; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 600px; background-color: #0f172a; border: 1px solid #334155; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.5);">
          <!-- Crown Header -->
          <tr>
            <td style="padding: 32px 32px 20px; background: linear-gradient(180deg, rgba(234, 179, 8, 0.2) 0%, rgba(15, 23, 42, 0) 100%); text-align: center;">
              <div style="display: inline-block; width: 68px; height: 68px; line-height: 68px; border-radius: 22px; background: linear-gradient(135deg, #eab308, #ca8a04); font-size: 36px; box-shadow: 0 10px 30px rgba(234, 179, 8, 0.4);">
                👑
              </div>
              <h1 style="color: #ffffff; font-size: 28px; font-weight: 900; margin: 16px 0 6px; letter-spacing: -0.5px;">
                The Winner Is Crowned!
              </h1>
              <p style="color: #cbd5e1; font-size: 14px; margin: 0;">
                Official outcome for <strong>${sessionTitle}</strong>
              </p>
            </td>
          </tr>

          <!-- Winner Spotlight Card -->
          <tr>
            <td style="padding: 0 32px 24px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: linear-gradient(135deg, rgba(234, 179, 8, 0.15), rgba(15, 23, 42, 0.8)); border: 2px solid #eab308; border-radius: 20px; overflow: hidden; padding: 20px;">
                <tr>
                  <td width="120" valign="top" style="padding-right: 16px;">
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
            <td style="padding: 0 32px 24px;">
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

          <!-- View Live Podium Action -->
          <tr>
            <td style="padding: 0 32px 32px; text-align: center;">
              <a href="${liveUrl}" target="_blank" style="display: block; width: 100%; box-sizing: border-box; background: linear-gradient(135deg, #eab308, #ca8a04); color: #080b12; font-size: 15px; font-weight: 900; text-decoration: none; padding: 14px 24px; border-radius: 14px; text-align: center; box-shadow: 0 10px 25px rgba(234, 179, 8, 0.3);">
                🏆 View Official Live Podium Results &rarr;
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 32px; border-top: 1px solid #1e293b; background-color: #0a0f1d; text-align: center; color: #64748b; font-size: 12px;">
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
