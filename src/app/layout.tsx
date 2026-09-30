import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { AuthModal } from '@/components/AuthModal';
import Script from 'next/script';

export const metadata: Metadata = {
  title: '🍿 MovieNight - Living Room Ballot & Live Podium',
  description:
    'Vote on your favorite movies for movie night, watch official trailers, view IMDb specs, and follow the live podium standings!',
};

const GA_MEASUREMENT_ID = 'G-EZNBVZK4SS';
const isVercelProduction = process.env.VERCEL === '1' && process.env.NODE_ENV === 'production';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark h-full">
      <body className="min-h-full flex flex-col bg-[#080b12] text-slate-100 antialiased selection:bg-amber-500 selection:text-slate-950">
        {isVercelProduction && (
          <>
            <Script
              strategy="afterInteractive"
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
            />
            <Script
              id="google-analytics"
              strategy="afterInteractive"
            >
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${GA_MEASUREMENT_ID}');
              `}
            </Script>
          </>
        )}
        <AuthProvider>
          {children}
          <AuthModal />
        </AuthProvider>
      </body>
    </html>
  );
}
