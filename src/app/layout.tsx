import type { Metadata } from 'next';
import './globals.css';
import { VoterProvider } from '@/context/VoterContext';
import { Navbar } from '@/components/Navbar';

export const metadata: Metadata = {
  title: '🍿 MovieNight - Living Room Ballot & Live Marquee',
  description:
    'Vote on your favorite movies for movie night, watch official trailers, view IMDb specs, and follow the live marquee standings!',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark h-full">
      <body className="min-h-full flex flex-col bg-[#080b12] text-slate-100 antialiased selection:bg-amber-500 selection:text-slate-950">
        <VoterProvider>
          <Navbar />
          <div className="flex-1">{children}</div>
        </VoterProvider>
      </body>
    </html>
  );
}
