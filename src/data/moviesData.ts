import { Voter } from '@/types';

export const DEFAULT_VOTERS: Voter[] = [
  { id: 'brian', name: 'Brian', avatar: '🎬', avatarUrl: '/avatars/brian.png', color: 'from-amber-500 to-orange-600' },
  { id: 'suzi', name: 'Suzi', avatar: '🍿', avatarUrl: '/avatars/suzi.png', color: 'from-pink-500 to-rose-600' },
  { id: 'michelle', name: 'Michelle', avatar: '🌟', avatarUrl: '/avatars/michelle.png', color: 'from-purple-500 to-indigo-600' },
  { id: 'william', name: 'William', avatar: '🥤', avatarUrl: '/avatars/william.png', color: 'from-blue-500 to-cyan-600' },
  { id: 'aimee', name: 'Aimee', avatar: '🎟️', avatarUrl: '/avatars/aimee.png', color: 'from-emerald-500 to-teal-600' },
  { id: 'kimberley', name: 'Kimberley', avatar: '🕶️', avatarUrl: '/avatars/kimberley.png', color: 'from-fuchsia-500 to-pink-600' },
  { id: 'liam', name: 'Liam', avatar: '📽️', avatarUrl: '/avatars/liam.png', color: 'from-red-500 to-amber-600' },
];

export const GENRE_INFO: Record<string, { emoji: string; label: string; color: string }> = {
  'sci-fi': { emoji: '🚀', label: 'Sci-Fi / Space', color: 'border-cyan-500/40 text-cyan-400 bg-cyan-950/40' },
  'epic-adventure': { emoji: '⚔️', label: 'Epic / Fantasy Adventure', color: 'border-amber-500/40 text-amber-400 bg-amber-950/40' },
  'action-thriller': { emoji: '💥', label: 'Action / Thriller', color: 'border-red-500/40 text-red-400 bg-red-950/40' },
  'superhero': { emoji: '🦸', label: 'Superhero / Comic Book', color: 'border-blue-500/40 text-blue-400 bg-blue-950/40' },
  'horror-creature': { emoji: '👻', label: 'Horror / Creature', color: 'border-emerald-500/40 text-emerald-400 bg-emerald-950/40' },
  'adventure-family': { emoji: '🗺️', label: 'Adventure / Family', color: 'border-yellow-500/40 text-yellow-400 bg-yellow-950/40' },
  'disaster-spectacle': { emoji: '🌪️', label: 'Disaster / Spectacle', color: 'border-sky-500/40 text-sky-400 bg-sky-950/40' },
  'comedy-cult': { emoji: '😂', label: 'Comedy / Cult', color: 'border-orange-500/40 text-orange-400 bg-orange-950/40' },
  'drama-coming-of-age': { emoji: '🎭', label: 'Drama / Coming-of-Age', color: 'border-purple-500/40 text-purple-400 bg-purple-950/40' },
  'cult-action': { emoji: '🗡️', label: 'Cult Fantasy / Action', color: 'border-rose-500/40 text-rose-400 bg-rose-950/40' },
};

export const STREAMING_PLATFORMS = [
  { id: 'netflix', name: 'Netflix', emoji: '🔴', color: 'text-red-400 border-red-500/40 bg-red-950/30' },
  { id: 'prime', name: 'Prime Video', emoji: '🔵', color: 'text-sky-400 border-sky-500/40 bg-sky-950/30' },
  { id: 'apple', name: 'Apple TV+', emoji: '🍏', color: 'text-emerald-400 border-emerald-500/40 bg-emerald-950/30' },
  { id: 'disney', name: 'Disney+', emoji: '🏰', color: 'text-blue-400 border-blue-500/40 bg-blue-950/30' },
  { id: 'max', name: 'Max / HBO', emoji: '🟣', color: 'text-purple-400 border-purple-500/40 bg-purple-950/30' },
  { id: 'plex', name: 'Plex Library', emoji: '🟠', color: 'text-amber-400 border-amber-500/40 bg-amber-950/30' },
];

export const STREAMING_NAMES = [
  'Netflix',
  'Prime Video',
  'Apple TV+',
  'Disney+',
  'Max',
  'Plex Library',
];

export const AGE_RATINGS = [
  'ALL',
  'U / G',
  'PG',
  '12 / 12A / PG-13',
  '15 / R',
  '18 / NC-17',
];

export interface QuickIdeaPreset {
  title: string;
  emoji: string;
  desc: string;
  movieIds: string[];
}

export const QUICK_IDEAS_PRESETS: QuickIdeaPreset[] = [
  {
    title: 'Family Movie Night',
    emoji: '🍿',
    desc: 'Fun crowd-pleasers & adventures for all ages',
    movieIds: [
      'back-to-the-future',
      'jurassic-park',
      'raiders-of-the-lost-ark',
      'jumanji',
      'ghostbusters',
      'star-wars',
    ],
  },
  {
    title: 'Oscar Contenders',
    emoji: '🏆',
    desc: 'Award-winning epics and cinematic masterpieces',
    movieIds: [
      'gladiator',
      'titanic',
      'braveheart',
      'raiders-of-the-lost-ark',
      'the-truman-show',
      'stand-by-me',
    ],
  },
  {
    title: 'Action Packed',
    emoji: '💥',
    desc: 'High-octane blockbusters, chases, and adrenaline',
    movieIds: [
      'the-bourne-identity',
      'top-gun',
      'rush-hour',
      'con-air',
      'bad-boys',
      'the-terminator',
    ],
  },
  {
    title: '80s & 90s Classics',
    emoji: '📼',
    desc: 'Timeless retro favorites and nostalgia hits',
    movieIds: [
      'back-to-the-future',
      'jurassic-park',
      'the-lost-boys',
      'twister',
      'big-trouble-in-little-china',
      'die-hard',
    ],
  },
];
