'use client';

import React from 'react';
import {
  Share2,
  X,
  ExternalLink,
  Send,
} from 'lucide-react';
import { trackShareSession } from '@/lib/analytics';

interface ShareSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
  sessionTitle?: string;
  isLocked?: boolean;
}

export function ShareSessionModal({
  isOpen,
  onClose,
  sessionId,
  sessionTitle,
  isLocked = false,
}: ShareSessionModalProps) {
  if (!isOpen) return null;

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const sessionUrl = `${origin}/s/${encodeURIComponent(sessionId)}`;
  const formattedCode =
    sessionId.replace(/\D/g, '').length === 8
      ? `${sessionId.slice(0, 4)} ${sessionId.slice(4)}`
      : sessionId;

  const displayTitle = sessionTitle || `Movie Night #${sessionId}`;
  const shareText = isLocked
    ? `🏆 Check out the crowned winner and results for ${displayTitle} on MovieNight! Code: ${formattedCode}`
    : `🍿 Cast your vote on our living room movie ballot for ${displayTitle}! Code: ${formattedCode}`;

  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: displayTitle,
          text: shareText,
          url: sessionUrl,
        });
        trackShareSession({ sessionId, platform: 'native_share' });
      } catch {
        // User cancelled or share failed
      }
    }
  };

  const socialChannels = [
    {
      name: 'WhatsApp',
      subtitle: 'Chat & Groups',
      iconText: '💬',
      iconBg: 'bg-emerald-950/80 border-emerald-500/40 text-emerald-400',
      cardHover: 'hover:border-emerald-500/60 hover:bg-emerald-950/20 group-hover:scale-105',
      action: () => {
        trackShareSession({ sessionId, platform: 'whatsapp' });
        const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(`${shareText}\n\n${sessionUrl}`)}`;
        window.open(url, '_blank', 'noopener,noreferrer');
      },
    },
    {
      name: 'X (Twitter)',
      subtitle: 'Post to feed',
      iconText: '𝕏',
      iconBg: 'bg-black border-slate-700 text-white',
      cardHover: 'hover:border-slate-500 hover:bg-slate-800/40 group-hover:scale-105',
      action: () => {
        trackShareSession({ sessionId, platform: 'x' });
        const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(sessionUrl)}`;
        window.open(url, '_blank', 'noopener,noreferrer');
      },
    },
    {
      name: 'Telegram',
      subtitle: 'Channel & Direct',
      iconNode: <Send className="w-5 h-5 text-sky-400" />,
      iconBg: 'bg-sky-950/80 border-sky-500/40 text-sky-300',
      cardHover: 'hover:border-sky-500/60 hover:bg-sky-950/20 group-hover:scale-105',
      action: () => {
        trackShareSession({ sessionId, platform: 'telegram' });
        const url = `https://t.me/share/url?url=${encodeURIComponent(sessionUrl)}&text=${encodeURIComponent(shareText)}`;
        window.open(url, '_blank', 'noopener,noreferrer');
      },
    },
    {
      name: 'Reddit',
      subtitle: 'Movie Communities',
      iconText: '🤖',
      iconBg: 'bg-orange-950/80 border-orange-500/40 text-orange-400',
      cardHover: 'hover:border-orange-500/60 hover:bg-orange-950/20 group-hover:scale-105',
      action: () => {
        trackShareSession({ sessionId, platform: 'reddit' });
        const url = `https://www.reddit.com/submit?url=${encodeURIComponent(sessionUrl)}&title=${encodeURIComponent(displayTitle)}`;
        window.open(url, '_blank', 'noopener,noreferrer');
      },
    },
    {
      name: 'Facebook',
      subtitle: 'Share to Story / Wall',
      iconText: 'f',
      iconBg: 'bg-blue-950/80 border-blue-500/40 text-blue-400',
      cardHover: 'hover:border-blue-500/60 hover:bg-blue-950/20 group-hover:scale-105',
      action: () => {
        trackShareSession({ sessionId, platform: 'facebook' });
        const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(sessionUrl)}`;
        window.open(url, '_blank', 'noopener,noreferrer');
      },
    },
  ];

  const canNativeShare = typeof navigator !== 'undefined' && Boolean(navigator.share);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg md:max-w-3xl rounded-3xl border-2 border-amber-500/30 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 p-6 sm:p-8 shadow-2xl shadow-amber-950/20 space-y-6 text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-500 p-0.5 shadow-lg shadow-amber-500/20 shrink-0">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-amber-400">
                <Share2 className="w-6 h-6" />
              </div>
            </div>
            <div>
              <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Share to Socials
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="p-2 rounded-2xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Featured Session Spotlight Banner */}
        <div className="rounded-2xl border border-slate-800 bg-slate-950/90 p-4 shadow-inner">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="text-xs font-semibold text-slate-400">
              Session Contenders &amp; Ballot
            </span>
            <span className="text-xs font-mono font-bold text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-lg">
              #{formattedCode}
            </span>
          </div>
          <div className="text-base sm:text-lg font-black text-white line-clamp-1">
            {displayTitle}
          </div>
          <p className="text-xs text-slate-400 mt-1 line-clamp-2">
            {shareText}
          </p>
        </div>

        {/* Prominent Social Channels Grid */}
        <div className="space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Choose Platform:
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {socialChannels.map((channel) => (
              <button
                key={channel.name}
                onClick={channel.action}
                className={`group relative flex items-center gap-3.5 p-3.5 rounded-2xl border border-slate-800/90 bg-slate-950/70 transition-all duration-200 active:scale-97 text-left shadow-lg ${channel.cardHover}`}
              >
                <div
                  className={`w-11 h-11 rounded-xl border flex items-center justify-center font-black text-xl shrink-0 transition-transform group-hover:scale-110 shadow-sm ${channel.iconBg}`}
                >
                  {channel.iconNode || channel.iconText}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center">
                    <span className="text-sm font-bold text-white tracking-tight truncate">
                      {channel.name}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 font-medium">
                    {channel.subtitle}
                  </div>
                </div>

                <ExternalLink className="w-4 h-4 text-slate-600 group-hover:text-amber-400 transition shrink-0" />
              </button>
            ))}
          </div>
        </div>

        {/* Native Mobile Share Sheet Callout (Mobile/Tablet Only) */}
        {canNativeShare && (
          <div className="pt-1">
            <button
              onClick={handleNativeShare}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-sm shadow-xl shadow-amber-500/25 transition transform hover:-translate-y-0.5 active:scale-98 glow-gold"
            >
              <Share2 className="w-4 h-4" />
              <span>More Share Options (Instagram, AirDrop, Messages)</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
