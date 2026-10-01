'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  Share2,
  X,
  Copy,
  Check,
  Send,
  ExternalLink,
  MessageCircle,
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
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const timerLink = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timerCode = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerLink.current) clearTimeout(timerLink.current);
      if (timerCode.current) clearTimeout(timerCode.current);
    };
  }, []);

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

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(sessionUrl);
      setCopiedLink(true);
      trackShareSession({ sessionId, platform: 'copy_link' });
      if (timerLink.current) clearTimeout(timerLink.current);
      timerLink.current = setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      // Fallback
    }
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(sessionId);
      setCopiedCode(true);
      trackShareSession({ sessionId, platform: 'copy_code' });
      if (timerCode.current) clearTimeout(timerCode.current);
      timerCode.current = setTimeout(() => setCopiedCode(false), 2000);
    } catch {
      // Fallback
    }
  };

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

  // Social Share URLs
  const socialChannels = [
    {
      name: 'WhatsApp',
      icon: (
        <span className="text-emerald-400 font-bold text-lg">
          💬
        </span>
      ),
      bg: 'hover:bg-emerald-500/10 hover:border-emerald-500/30 text-emerald-300',
      action: () => {
        trackShareSession({ sessionId, platform: 'whatsapp' });
        const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(`${shareText}\n\n${sessionUrl}`)}`;
        window.open(url, '_blank', 'noopener,noreferrer');
      },
    },
    {
      name: 'X (Twitter)',
      icon: (
        <span className="font-mono font-bold text-base text-white">
          𝕏
        </span>
      ),
      bg: 'hover:bg-slate-700/40 hover:border-slate-600 text-slate-200',
      action: () => {
        trackShareSession({ sessionId, platform: 'x' });
        const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(sessionUrl)}`;
        window.open(url, '_blank', 'noopener,noreferrer');
      },
    },
    {
      name: 'Telegram',
      icon: (
        <Send className="w-5 h-5 text-sky-400 shrink-0" />
      ),
      bg: 'hover:bg-sky-500/10 hover:border-sky-500/30 text-sky-300',
      action: () => {
        trackShareSession({ sessionId, platform: 'telegram' });
        const url = `https://t.me/share/url?url=${encodeURIComponent(sessionUrl)}&text=${encodeURIComponent(shareText)}`;
        window.open(url, '_blank', 'noopener,noreferrer');
      },
    },
    {
      name: 'Reddit',
      icon: (
        <span className="text-orange-400 font-bold text-lg">
          🤖
        </span>
      ),
      bg: 'hover:bg-orange-500/10 hover:border-orange-500/30 text-orange-300',
      action: () => {
        trackShareSession({ sessionId, platform: 'reddit' });
        const url = `https://www.reddit.com/submit?url=${encodeURIComponent(sessionUrl)}&title=${encodeURIComponent(displayTitle)}`;
        window.open(url, '_blank', 'noopener,noreferrer');
      },
    },
    {
      name: 'Facebook',
      icon: (
        <span className="text-blue-500 font-bold text-lg">
          f
        </span>
      ),
      bg: 'hover:bg-blue-500/10 hover:border-blue-500/30 text-blue-300',
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-6 text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">
                Share Movie Night
              </h3>
              <p className="text-xs text-slate-400 line-clamp-1">
                {displayTitle}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Link & Code Copies */}
        <div className="space-y-3">
          {/* Direct Link */}
          <div className="rounded-2xl bg-slate-950 border border-slate-800 p-3 flex items-center justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                Direct Invite Link
              </div>
              <div className="text-xs text-slate-300 font-mono truncate">
                {sessionUrl}
              </div>
            </div>
            <button
              onClick={copyLink}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                copiedLink
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  : 'bg-amber-400 hover:bg-amber-300 text-slate-950 glow-gold'
              }`}
            >
              {copiedLink ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Link</span>
                </>
              )}
            </button>
          </div>

          {/* 8-Digit PIN Code */}
          <div className="rounded-2xl bg-slate-950 border border-slate-800 p-3 flex items-center justify-between gap-2">
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                8-Digit Join Code
              </div>
              <div className="text-base font-black font-mono tracking-widest text-amber-300">
                {formattedCode}
              </div>
            </div>
            <button
              onClick={copyCode}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                copiedCode
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
              }`}
            >
              {copiedCode ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Code</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Native Mobile Share Button (if available) */}
        {canNativeShare && (
          <button
            onClick={handleNativeShare}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-sm shadow-xl shadow-amber-500/20 transition active:scale-98 glow-gold"
          >
            <Share2 className="w-4 h-4" />
            <span>Share via Phone / Apps...</span>
          </button>
        )}

        {/* Social Share Channels Grid */}
        <div>
          <div className="text-xs font-semibold text-slate-400 mb-2.5">
            Share directly on socials:
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {socialChannels.map((channel) => (
              <button
                key={channel.name}
                onClick={channel.action}
                className={`flex items-center gap-2.5 p-2.5 rounded-2xl border border-slate-800/80 bg-slate-950/60 transition active:scale-95 text-left ${channel.bg}`}
              >
                <div className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0">
                  {channel.icon}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold leading-tight truncate">
                    {channel.name}
                  </div>
                  <div className="text-[10px] text-slate-500 flex items-center gap-0.5">
                    <span>Share</span>
                    <ExternalLink className="w-2.5 h-2.5 inline" />
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Footer Note */}
        <p className="text-[11px] text-center text-slate-500">
          Anyone with this link or code can view the session and cast their votes.
        </p>
      </div>
    </div>
  );
}
