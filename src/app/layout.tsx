import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '🍿 MovieNight - Living Room Ballot & Live Podium',
  description:
    'Vote on your favorite movies for movie night, watch official trailers, view IMDb specs, and follow the live podium standings!',
};

import { AuthProvider } from '@/context/AuthContext';
import { AuthModal } from '@/components/AuthModal';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark h-full">
      <body className="min-h-full flex flex-col bg-[#080b12] text-slate-100 antialiased selection:bg-amber-500 selection:text-slate-950">
        <AuthProvider>
          {children}
          <AuthModal />
        </AuthProvider>
      </body>
    </html>
  );
}

