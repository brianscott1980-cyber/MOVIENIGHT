'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { X, Mail, AlertCircle, CheckCircle2, Sparkles } from 'lucide-react';

export function AuthModal() {
  const { isAuthModalOpen, closeAuthModal, signInWithOAuth, signInWithOtp } = useAuth();
  const [email, setEmail] = useState('');
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);
  const [otpSent, setOtpSent] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isAuthModalOpen) return null;

  const handleOAuth = async (provider: 'google' | 'github') => {
    setLoadingProvider(provider);
    setErrorMessage(null);
    try {
      const { error } = await signInWithOAuth(provider);
      if (error) {
        if (error.message?.toLowerCase().includes('not enabled')) {
          setErrorMessage(`${provider === 'google' ? 'Google' : 'GitHub'} login is not enabled in your Supabase Dashboard yet. You can sign in immediately using Email Magic Link below, or enable ${provider} in Supabase Auth settings.`);
        } else {
          setErrorMessage(error.message || `Failed to sign in with ${provider}`);
        }
        setLoadingProvider(null);
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Authentication failed');
      setLoadingProvider(null);
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Please enter a valid email address');
      return;
    }
    setLoadingProvider('email');
    setErrorMessage(null);
    try {
      const { error } = await signInWithOtp(email.trim());
      if (error) {
        setErrorMessage(error.message || 'Failed to send login link');
      } else {
        setOtpSent(true);
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to send login link');
    } finally {
      setLoadingProvider(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md p-6 sm:p-8 bg-slate-900 border border-amber-500/40 rounded-3xl shadow-2xl glow-gold">
        <button
          onClick={closeAuthModal}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white transition rounded-full hover:bg-slate-800"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 mb-3 bg-gradient-to-tr from-amber-500 to-red-600 rounded-2xl text-2xl shadow-lg shadow-amber-500/20">
            🎬
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">
            Sign In to Host
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Sign in to create movie nights and manage your sessions
          </p>
        </div>

        {errorMessage && (
          <div className="mb-5 p-3.5 bg-red-950/60 border border-red-500/50 rounded-xl text-red-200 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {otpSent ? (
          <div className="p-5 bg-emerald-950/50 border border-emerald-500/40 rounded-2xl text-center">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
            <h3 className="text-white font-bold text-base mb-1">Check your inbox!</h3>
            <p className="text-xs text-slate-300 mb-4">
              We sent a magic sign-in link to <span className="font-semibold text-emerald-300">{email}</span>. Click the link to log in.
            </p>
            <button
              onClick={() => {
                setOtpSent(false);
                setEmail('');
              }}
              className="text-xs text-amber-400 hover:underline"
            >
              Use a different email or sign-in method
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* OAuth Buttons */}
            <div className="space-y-2.5">
              <button
                onClick={() => handleOAuth('google')}
                disabled={loadingProvider !== null}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white text-slate-900 hover:bg-slate-100 font-bold rounded-xl transition shadow active:scale-98 disabled:opacity-60"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>
                  {loadingProvider === 'google' ? 'Connecting to Google...' : 'Continue with Google'}
                </span>
              </button>

              <button
                onClick={() => handleOAuth('github')}
                disabled={loadingProvider !== null}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl border border-slate-700 transition active:scale-98 disabled:opacity-60"
              >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                </svg>
                <span>
                  {loadingProvider === 'github' ? 'Connecting to GitHub...' : 'Continue with GitHub'}
                </span>
              </button>
            </div>

            <div className="flex items-center my-4">
              <div className="flex-1 border-t border-slate-800"></div>
              <span className="px-3 text-xs text-slate-500 uppercase tracking-wider font-semibold">
                Or magic link
              </span>
              <div className="flex-1 border-t border-slate-800"></div>
            </div>

            {/* Email Magic Link Form */}
            <form onSubmit={handleEmailSignIn} className="space-y-3">
              <div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  className="w-full px-4 py-3 bg-slate-950/80 border border-slate-800 focus:border-amber-500 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none transition"
                />
              </div>
              <button
                type="submit"
                disabled={loadingProvider !== null || !email.trim()}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl transition shadow-lg shadow-amber-500/10 active:scale-98 disabled:opacity-60"
              >
                <Mail className="w-4 h-4" />
                <span>
                  {loadingProvider === 'email' ? 'Sending Magic Link...' : 'Send Magic Link'}
                </span>
              </button>
            </form>
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-slate-800/80 text-center text-xs text-slate-500 flex items-center justify-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>Participants can join your sessions without an account</span>
        </div>
      </div>
    </div>
  );
}

