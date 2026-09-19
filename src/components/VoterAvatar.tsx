'use client';

import React, { useState } from 'react';
import { Voter } from '@/types';

interface VoterAvatarProps {
  voter?: Voter | null;
  voterId?: string;
  name?: string;
  color?: string;
  fallbackEmoji?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showBorder?: boolean;
}

const sizeClasses = {
  xs: 'w-5 h-5 text-[10px]',
  sm: 'w-7 h-7 text-xs',
  md: 'w-9 h-9 sm:w-10 sm:h-10 text-sm',
  lg: 'w-12 h-12 sm:w-14 sm:h-14 text-base',
  xl: 'w-16 h-16 sm:w-20 sm:h-20 text-xl',
};

export function VoterAvatar({
  voter,
  voterId,
  name,
  color,
  fallbackEmoji,
  size = 'md',
  className = '',
  showBorder = false,
}: VoterAvatarProps) {
  const [imgError, setImgError] = useState(false);

  const id = voter?.id || voterId || '';
  const voterName = voter?.name || name || 'Voter';
  const voterColor = voter?.color || color || 'from-amber-500 to-orange-600';
  const emoji = voter?.avatar || fallbackEmoji || '👤';
  const avatarSrc = voter?.avatarUrl || (id ? `/avatars/${id.toLowerCase()}.png` : null);

  const sizeClass = sizeClasses[size] || sizeClasses.md;

  if (avatarSrc && !imgError) {
    return (
      <div
        className={`relative rounded-full overflow-hidden shrink-0 select-none bg-slate-800 ${sizeClass} ${
          showBorder ? 'ring-2 ring-slate-900 shadow-md' : ''
        } ${className}`}
        title={voterName}
      >
        <img
          src={avatarSrc}
          alt={voterName}
          className="w-full h-full object-cover object-center"
          onError={() => setImgError(true)}
        />
      </div>
    );
  }

  // Fallback to gradient with emoji or initial letter
  return (
    <div
      className={`rounded-full shrink-0 flex items-center justify-center font-bold text-white bg-gradient-to-br ${voterColor} shadow select-none ${sizeClass} ${
        showBorder ? 'ring-2 ring-slate-900' : ''
      } ${className}`}
      title={voterName}
    >
      {emoji && emoji !== '👤' ? emoji : voterName.charAt(0).toUpperCase()}
    </div>
  );
}

