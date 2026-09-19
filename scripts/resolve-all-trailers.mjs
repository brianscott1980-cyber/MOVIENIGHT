import fs from 'fs';
import path from 'path';

const movies = JSON.parse(fs.readFileSync('data/movies_fetched.json', 'utf-8'));

async function isYouTubeValid(id) {
  if (!id || id.length !== 11) return false;
  try {
    const res = await fetch(`https://i.ytimg.com/vi/${id}/hqdefault.jpg`, { method: 'HEAD' });
    return res.status === 200;
  } catch (e) {
    return false;
  }
}

async function searchYouTubeTrailer(title, year) {
  const query = `${title} ${year} official trailer`;
  const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });
    const html = await res.text();
    // Match all watch?v= IDs
    const matches = Array.from(html.matchAll(/\/watch\?v=([a-zA-Z0-9_-]{11})/g)).map(m => m[1]);
    const unique = Array.from(new Set(matches));

    for (const vid of unique) {
      if (await isYouTubeValid(vid)) {
        return vid;
      }
    }
  } catch (e) {
    console.error(`Search error for ${title}:`, e.message);
  }
  return null;
}

async function main() {
  console.log(`Checking and resolving official YouTube trailers for all ${movies.length} movies...`);

  let updatedCount = 0;

  for (let i = 0; i < movies.length; i++) {
    const m = movies[i];
    const valid = await isYouTubeValid(m.youtubeTrailerId);

    if (valid) {
      console.log(`[${i + 1}/${movies.length}] ✓ ${m.title} has valid trailer (${m.youtubeTrailerId})`);
    } else {
      console.log(`[${i + 1}/${movies.length}] ✗ ${m.title} (${m.youtubeTrailerId}) invalid, searching YouTube...`);
      const newId = await searchYouTubeTrailer(m.title, m.year);
      if (newId) {
        console.log(`  -> Found valid trailer: ${newId}`);
        m.youtubeTrailerId = newId;
        updatedCount++;
      } else {
        console.log(`  -> Could not find alternative for ${m.title}`);
      }
      await new Promise(r => setTimeout(r, 400));
    }
  }

  console.log(`Finished! Updated ${updatedCount} trailer IDs.`);

  // Save back to data/movies_fetched.json
  fs.writeFileSync('data/movies_fetched.json', JSON.stringify(movies, null, 2), 'utf-8');

  // Regenerate src/data/moviesData.ts
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

export const MOVIES_DATA: Movie[] = ${JSON.stringify(movies, null, 2)};
`;

  fs.writeFileSync('src/data/moviesData.ts', code, 'utf-8');
  console.log('Updated src/data/moviesData.ts with verified working YouTube trailers!');
}

main().catch(console.error);

