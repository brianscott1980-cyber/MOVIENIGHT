import React from 'react';
import { VoterProvider } from '@/context/VoterContext';
import { Navbar } from '@/components/Navbar';

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

