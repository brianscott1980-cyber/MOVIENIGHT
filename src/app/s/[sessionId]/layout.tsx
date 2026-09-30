import React from 'react';
import type { Metadata } from 'next';
import { VoterProvider } from '@/context/VoterContext';
import { Navbar } from '@/components/Navbar';
import { getSessionOgMetadata } from '@/lib/db';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}): Promise<Metadata> {
  const { sessionId } = await params;
  const data = await getSessionOgMetadata(sessionId);

  const title = data?.title ? `🍿 ${data.title} | MovieNight` : `🍿 Movie Night #${sessionId}`;
  const topMovie = data?.topMovie;
  const ratingText = topMovie
    ? `⭐ Top rated: ${topMovie.title} (${topMovie.tmdbRating ?? topMovie.imdbRating}★)`
    : 'Vote for tonight\'s movie!';
  const description = `Join the voting session! ${ratingText}. Choose your favorites, watch official trailers, and see the live podium.`;

  const ogImages = [
    {
      url: `/s/${sessionId}/opengraph-image`,
      width: 1200,
      height: 630,
      alt: `${data?.title || 'MovieNight Session'} - ${topMovie?.title || 'Contender'}`,
    },
  ];

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      url: `/s/${sessionId}`,
      siteName: 'MovieNight',
      images: ogImages,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ogImages,
    },
  };
}

export default async function SessionLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;

  return (
    <VoterProvider sessionId={sessionId}>
      <Navbar />
      <main className="flex-1">{children}</main>
    </VoterProvider>
  );
}

