'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const handleAuth = async () => {
      let targetUrl = '/';
      try {
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');

        if (code) {
          await supabase.auth.exchangeCodeForSession(code);
        } else {
          await supabase.auth.getSession();
        }

        const { data: { session } } = await supabase.auth.getSession();
        const pendingIntent = typeof window !== 'undefined' ? sessionStorage.getItem('movienight_pending_intent') : null;

        if (pendingIntent === 'create_session' && session?.user) {
          if (typeof window !== 'undefined') {
            sessionStorage.removeItem('movienight_pending_intent');
            sessionStorage.removeItem('movienight_auth_return');
          }

          const user = session.user;
          const userName =
            user.user_metadata?.full_name ||
            user.user_metadata?.name ||
            (user.email ? user.email.split('@')[0] : 'Host');
          const userAvatar =
            user.user_metadata?.avatar_url ||
            user.user_metadata?.picture ||
            null;

          const res = await fetch('/api/session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'create',
              title: '',
              creator: {
                userId: user.id || null,
                email: user.email || null,
                name: userName,
                avatarUrl: userAvatar,
              },
            }),
          });

          if (res.ok) {
            const json = await res.json();
            if (json?.session?.sessionId) {
              router.replace(`/s/${json.session.sessionId}/admin`);
              return;
            }
          }
        }

        targetUrl = (typeof window !== 'undefined' ? sessionStorage.getItem('movienight_auth_return') : null) || '/';
      } catch (err) {
        console.error('Error handling auth callback:', err);
      } finally {
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('movienight_auth_return');
          sessionStorage.removeItem('movienight_pending_intent');
        }
      }
      router.replace(targetUrl);
    };

    handleAuth();
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-white">
      <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4" />
      <p className="text-slate-300 font-medium text-lg">Signing you in to Movie Night...</p>
    </div>
  );
}

