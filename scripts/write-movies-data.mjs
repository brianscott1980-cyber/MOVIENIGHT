import fs from 'fs';
import path from 'path';

const fetched = JSON.parse(fs.readFileSync('data/movies_fetched.json', 'utf-8'));

const code = `import { Movie, Voter } from '@/types';

export const DEFAULT_VOTERS: Voter[] = [
  { id: 'brian', name: 'Brian', avatar: '🎬', color: 'from-amber-500 to-orange-600' },
  { id: 'suzi', name: 'Suzi', avatar: '🍿', color: 'from-pink-500 to-rose-600' },
  { id: 'michelle', name: 'Michelle', avatar: '🌟', color: 'from-purple-500 to-indigo-600' },
  { id: 'william', name: 'William', avatar: '🥤', color: 'from-blue-500 to-cyan-600' },
  { id: 'aimee', name: 'Aimee', avatar: '🎟️', color: 'from-emerald-500 to-teal-600' },
  { id: 'kimberley', name: 'Kimberley', avatar: '🕶️', color: 'from-fuchsia-500 to-pink-600' },
  { id: 'liam', name: 'Liam', avatar: '📽️', color: 'from-red-500 to-amber-600' },
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

export const MOVIES_DATA: Movie[] = ${JSON.stringify(fetched, null, 2)};
`;

fs.writeFileSync('src/data/moviesData.ts', code, 'utf-8');
console.log('Successfully updated src/data/moviesData.ts with all live metadata!');

