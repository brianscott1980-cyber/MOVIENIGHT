import { ImageResponse } from 'next/og';
import { getSessionOgMetadata } from '@/lib/db';

export const runtime = 'nodejs';
export const alt = 'MovieNight Session Preview';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  const data = await getSessionOgMetadata(sessionId);

  const sessionTitle = data?.title || `Movie Night #${sessionId}`;
  const topMovie = data?.topMovie;
  const movieCount = data?.movieCount ?? 0;

  const topRating = topMovie
    ? (topMovie.tmdbRating ?? topMovie.imdbRating)?.toFixed(1)
    : null;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: '#080b12',
          backgroundImage:
            'radial-gradient(circle at 15% 20%, rgba(245, 158, 11, 0.15) 0%, transparent 45%), radial-gradient(circle at 85% 80%, rgba(220, 38, 38, 0.12) 0%, transparent 45%)',
          color: '#f8fafc',
          padding: '48px',
          boxSizing: 'border-box',
          fontFamily: 'sans-serif',
          position: 'relative',
        }}
      >
        {/* Left Side: Brand, Session Name, and Details */}
        <div
          style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          height: '100%',
          flex: 1,
          paddingRight: '40px',
        }}
      >
        {/* Brand Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '20px',
              background: 'linear-gradient(135deg, #f59e0b, #dc2626)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '36px',
              boxShadow: '0 8px 24px rgba(245, 158, 11, 0.35)',
            }}
          >
            🍿
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span
              style={{
                fontSize: '32px',
                fontWeight: 900,
                letterSpacing: '-0.5px',
                color: '#ffffff',
              }}
            >
              MovieNight
            </span>
            <span
              style={{
                fontSize: '16px',
                fontWeight: 600,
                color: '#94a3b8',
                letterSpacing: '0.5px',
              }}
            >
              Living Room Ballot & Live Podium
            </span>
          </div>
        </div>

        {/* Session Name & Invite */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', margin: '24px 0' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <span
              style={{
                backgroundColor: 'rgba(245, 158, 11, 0.15)',
                color: '#fbbf24',
                border: '1px solid rgba(245, 158, 11, 0.4)',
                borderRadius: '9999px',
                padding: '6px 16px',
                fontSize: '15px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '1px',
              }}
            >
              Active Voting Session #{sessionId}
            </span>
            {movieCount > 0 && (
              <span
                style={{
                  backgroundColor: 'rgba(51, 65, 85, 0.6)',
                  color: '#cbd5e1',
                  borderRadius: '9999px',
                  padding: '6px 14px',
                  fontSize: '15px',
                  fontWeight: 600,
                }}
              >
                {movieCount} Contenders
              </span>
            )}
          </div>

          <h1
            style={{
              fontSize: sessionTitle.length > 35 ? '44px' : '54px',
              fontWeight: 900,
              lineHeight: 1.15,
              color: '#ffffff',
              margin: 0,
              textShadow: '0 4px 16px rgba(0, 0, 0, 0.5)',
            }}
          >
            {sessionTitle}
          </h1>

          <p
            style={{
              fontSize: '20px',
              color: '#94a3b8',
              margin: 0,
              lineHeight: 1.4,
            }}
          >
            Cast your vote, explore IMDb specs & watch official trailers in real time!
          </p>
        </div>

        {/* Bottom Callout */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            backgroundColor: 'rgba(15, 23, 42, 0.8)',
            border: '1px solid rgba(51, 65, 85, 0.7)',
            borderRadius: '16px',
            padding: '14px 20px',
          }}
        >
          <span style={{ fontSize: '22px' }}>🗳️</span>
          <span style={{ fontSize: '18px', fontWeight: 600, color: '#f1f5f9' }}>
            Open link to join ballot and rank contenders
          </span>
        </div>
      </div>

      {/* Right Side: Highest Rated Movie Poster Card */}
      {topMovie && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '320px',
            flexShrink: 0,
            borderRadius: '24px',
            backgroundColor: 'rgba(15, 23, 42, 0.9)',
            border: '2px solid rgba(245, 158, 11, 0.4)',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6), 0 0 40px rgba(245, 158, 11, 0.15)',
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          {/* Top Rated Badge Header */}
          <div
            style={{
              width: '100%',
              backgroundColor: '#f59e0b',
              color: '#0f172a',
              padding: '8px 12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              fontSize: '14px',
              fontWeight: 900,
              textTransform: 'uppercase',
              letterSpacing: '0.75px',
            }}
          >
            <span>⭐ Highest Rated Contender</span>
          </div>

          {/* Poster Image */}
          <div
            style={{
              position: 'relative',
              width: '100%',
              height: '380px',
              display: 'flex',
              overflow: 'hidden',
              backgroundColor: '#1e293b',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={topMovie.posterUrl}
              alt={topMovie.title}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
          </div>

          {/* Movie Details Footer */}
          <div
            style={{
              width: '100%',
              padding: '16px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              backgroundColor: '#0f172a',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span
                style={{
                  fontSize: '19px',
                  fontWeight: 800,
                  color: '#ffffff',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: '200px',
                }}
              >
                {topMovie.title}
              </span>
              {topRating && (
                <span
                  style={{
                    backgroundColor: 'rgba(245, 158, 11, 0.2)',
                    color: '#f59e0b',
                    border: '1px solid rgba(245, 158, 11, 0.4)',
                    borderRadius: '8px',
                    padding: '3px 8px',
                    fontSize: '14px',
                    fontWeight: 800,
                  }}
                >
                  ★ {topRating}
                </span>
              )}
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '13px',
                color: '#94a3b8',
              }}
            >
              <span>{topMovie.year}</span>
              {topMovie.genre && (
                <>
                  <span>•</span>
                  <span>{topMovie.genre}</span>
                </>
              )}
              {topMovie.rated && (
                <>
                  <span>•</span>
                  <span>{topMovie.rated}</span>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  ),
  {
    ...size,
  }
);
}
