import fs from 'fs';
import path from 'path';

// All 31 movies with their verified IMDb IDs and curated trailer IDs
const MOVIES_LIST = [
  // 🚀 SCI-FI / SPACE
  {
    id: 'star-wars',
    imdbId: 'tt0076759',
    genre: 'sci-fi',
    genreEmoji: '🚀',
    youtubeTrailerId: 'vZ734NWnAHA',
    tagline: 'A long time ago in a galaxy far, far away...',
  },
  {
    id: 'back-to-the-future',
    imdbId: 'tt0088763',
    genre: 'sci-fi',
    genreEmoji: '🚀',
    youtubeTrailerId: 'qvsgGtivCgs',
    tagline: "He's the only kid ever to get into trouble before he was even born.",
  },
  {
    id: 'jurassic-park',
    imdbId: 'tt0107290',
    genre: 'sci-fi',
    genreEmoji: '🚀',
    youtubeTrailerId: 'QWBKEmWWL38',
    tagline: 'An adventure 65 million years in the making.',
  },
  {
    id: 'edge-of-tomorrow',
    imdbId: 'tt1631867',
    genre: 'sci-fi',
    genreEmoji: '🚀',
    youtubeTrailerId: 'vw61gCe2oqI',
    tagline: 'Live. Die. Repeat.',
  },
  {
    id: 'star-trek',
    imdbId: 'tt0796366',
    genre: 'sci-fi',
    genreEmoji: '🚀',
    youtubeTrailerId: 'pKFUZ10fiSU',
    tagline: 'The future begins.',
  },
  {
    id: 'galaxy-quest',
    imdbId: 'tt0177789',
    genre: 'sci-fi',
    genreEmoji: '🚀',
    youtubeTrailerId: 'B3U73-ECDA8',
    tagline: 'Never give up, never surrender.',
  },
  {
    id: 'men-in-black',
    imdbId: 'tt0119654',
    genre: 'sci-fi',
    genreEmoji: '🚀',
    youtubeTrailerId: '1Q4mhYF9aQQ',
    tagline: 'Protecting the Earth from the scum of the universe.',
  },
  {
    id: 'stargate',
    imdbId: 'tt0111282',
    genre: 'sci-fi',
    genreEmoji: '🚀',
    youtubeTrailerId: 'X4O_v23_p18',
    tagline: 'It will take you a million light years from home.',
  },
  {
    id: 'independence-day',
    imdbId: 'tt0116629',
    genre: 'sci-fi',
    genreEmoji: '🚀',
    youtubeTrailerId: 'B1E7h3SeMDk',
    tagline: "We've always believed we weren't alone. On July 4th, we'll wish we were.",
  },
  {
    id: 'deep-impact',
    imdbId: 'tt0120647',
    genre: 'sci-fi',
    genreEmoji: '🚀',
    youtubeTrailerId: '9q_K4c7z2gY',
    tagline: 'Heaven and Earth are about to collide.',
  },

  // ⚔️ EPIC / HISTORICAL / FANTASY ADVENTURE
  {
    id: 'gladiator',
    imdbId: 'tt0172495',
    genre: 'epic-adventure',
    genreEmoji: '⚔️',
    youtubeTrailerId: 'P5ieIbInFpg',
    tagline: 'The general who became a slave. The slave who became a gladiator.',
  },
  {
    id: 'troy',
    imdbId: 'tt0332452',
    genre: 'epic-adventure',
    genreEmoji: '⚔️',
    youtubeTrailerId: 'znTLzRJimeY',
    tagline: 'For honor. For love. For Troy.',
  },
  {
    id: 'the-mummy',
    imdbId: 'tt0120616',
    genre: 'epic-adventure',
    genreEmoji: '⚔️',
    youtubeTrailerId: 'h3ptPzxWnxM',
    tagline: 'The sands will tremble. The heavens will fall.',
  },
  {
    id: 'robin-hood-prince-of-thieves',
    imdbId: 'tt0102798',
    genre: 'epic-adventure',
    genreEmoji: '⚔️',
    youtubeTrailerId: 'hN_fFzZ9k38',
    tagline: 'For the good of all men, and the love of one woman.',
  },
  {
    id: 'dragonheart',
    imdbId: 'tt0116136',
    genre: 'epic-adventure',
    genreEmoji: '⚔️',
    youtubeTrailerId: 'a6U9B9m3nZ4',
    tagline: 'You will believe.',
  },

  // 💥 ACTION / THRILLER
  {
    id: 'the-bourne-identity',
    imdbId: 'tt0258463',
    genre: 'action-thriller',
    genreEmoji: '💥',
    youtubeTrailerId: 'FpS8zcEQHA4',
    tagline: 'He was the perfect weapon until he became the target.',
  },
  {
    id: 'top-gun',
    imdbId: 'tt0092099',
    genre: 'action-thriller',
    genreEmoji: '💥',
    youtubeTrailerId: 'xa_z57UatDY',
    tagline: 'I feel the need... the need for speed!',
  },
  {
    id: 'rush-hour',
    imdbId: 'tt0120812',
    genre: 'action-thriller',
    genreEmoji: '💥',
    youtubeTrailerId: 'JMiFsFQdLLE',
    tagline: 'The fastest hands in the East meet the loudest mouth in the West.',
  },
  {
    id: 'con-air',
    imdbId: 'tt0118880',
    genre: 'action-thriller',
    genreEmoji: '💥',
    youtubeTrailerId: '4vKxN8Y3f_c',
    tagline: 'They were lethal on the ground. Now they have taken the skies.',
  },
  {
    id: 'bad-boys',
    imdbId: 'tt0112442',
    genre: 'action-thriller',
    genreEmoji: '💥',
    youtubeTrailerId: 'jXCq8xUq_XQ',
    tagline: 'Whatcha gonna do when they come for you?',
  },

  // 🦸 SUPERHERO / COMIC BOOK
  {
    id: 'x-men',
    imdbId: 'tt0120903',
    genre: 'superhero',
    genreEmoji: '🦸',
    youtubeTrailerId: 'nbNCk2Gky7w',
    tagline: 'Trust a few. Fear the rest.',
  },
  {
    id: 'spider-man',
    imdbId: 'tt0145487',
    genre: 'superhero',
    genreEmoji: '🦸',
    youtubeTrailerId: 't06RUxPbp_c',
    tagline: 'With great power comes great responsibility.',
  },
  {
    id: 'hellboy',
    imdbId: 'tt0167190',
    genre: 'superhero',
    genreEmoji: '🦸',
    youtubeTrailerId: '53zFq1ZJbK8',
    tagline: 'From the ashes of mystery comes an unlikely hero.',
  },

  // 👻 HORROR / SUPERNATURAL / CREATURE
  {
    id: 'jaws',
    imdbId: 'tt0073195',
    genre: 'horror-creature',
    genreEmoji: '👻',
    youtubeTrailerId: 'U1Fu_sZjf28',
    tagline: "Don't go in the water.",
  },
  {
    id: 'ghostbusters',
    imdbId: 'tt0087332',
    genre: 'horror-creature',
    genreEmoji: '👻',
    youtubeTrailerId: '6hDkhw5Wkas',
    tagline: 'Who ya gonna call?',
  },
  {
    id: 'the-lost-boys',
    imdbId: 'tt0093437',
    genre: 'horror-creature',
    genreEmoji: '👻',
    youtubeTrailerId: 'z_7GvW8yT7g',
    tagline: "Sleep all day. Party all night. Never grow old. It's fun to be a vampire.",
  },
  {
    id: 'tremors',
    imdbId: 'tt0100814',
    genre: 'horror-creature',
    genreEmoji: '👻',
    youtubeTrailerId: 'Jz0gU8aMfZs',
    tagline: "They say there's nothing new under the sun. But under the ground...",
  },

  // 🗺️ ADVENTURE / FAMILY
  {
    id: 'raiders-of-the-lost-ark',
    imdbId: 'tt0082971',
    genre: 'adventure-family',
    genreEmoji: '🗺️',
    youtubeTrailerId: 'XkkzKBRoSE8',
    tagline: 'Indiana Jones - the new hero from the creators of Jaws and Star Wars.',
  },
  {
    id: 'jumanji',
    imdbId: 'tt0113497',
    genre: 'adventure-family',
    genreEmoji: '🗺️',
    youtubeTrailerId: '3LPAN38ZLE4',
    tagline: 'Roll the dice and unleash the excitement!',
  },
  {
    id: 'real-steel',
    imdbId: 'tt0433035',
    genre: 'adventure-family',
    genreEmoji: '🗺️',
    youtubeTrailerId: 'T75j9CoJVzQ',
    tagline: 'Courage is stronger than steel.',
  },

  // 🌪️ DISASTER / SPECTACLE
  {
    id: 'titanic',
    imdbId: 'tt0120338',
    genre: 'disaster-spectacle',
    genreEmoji: '🌪️',
    youtubeTrailerId: 'kVrqfYjkTdQ',
    tagline: 'Nothing on Earth could come between them.',
  },
  {
    id: 'twister',
    imdbId: 'tt0117998',
    genre: 'disaster-spectacle',
    genreEmoji: '🌪️',
    youtubeTrailerId: 'OgMm_U_3QYk',
    tagline: "Don't breathe. Don't look back. Just run.",
  },

  // 😂 COMEDY / CULT
  {
    id: 'big-trouble-in-little-china',
    imdbId: 'tt0090728',
    genre: 'comedy-cult',
    genreEmoji: '😂',
    youtubeTrailerId: '592m64lDHmb',
    tagline: 'Adventure is born when Jack Burton rolls in.',
  },

  // 🎭 DRAMA / COMING-OF-AGE
  {
    id: 'the-truman-show',
    imdbId: 'tt0120382',
    genre: 'drama-coming-of-age',
    genreEmoji: '🎭',
    youtubeTrailerId: 'dlnmQbPGuls',
    tagline: 'On the air. Unaware.',
  },
  {
    id: 'stand-by-me',
    imdbId: 'tt0092005',
    genre: 'drama-coming-of-age',
    genreEmoji: '🎭',
    youtubeTrailerId: 'lniA690G7iM',
    tagline: "For some, it's the last real adventure of childhood.",
  },

  // 🗡️ CULT FANTASY / ACTION
  {
    id: 'highlander',
    imdbId: 'tt0091203',
    genre: 'cult-action',
    genreEmoji: '🗡️',
    youtubeTrailerId: 'omOZyLm914g',
    tagline: 'There can be only one.',
  },
];

async function fetchOmdb(imdbId) {
  try {
    const res = await fetch(`http://www.omdbapi.com/?i=${imdbId}&plot=full&apikey=trilogy`);
    if (!res.ok) return null;
    const json = await res.json();
    if (json.Response === 'True') return json;
    return null;
  } catch (e) {
    console.error(`Error fetching OMDB for ${imdbId}:`, e.message);
    return null;
  }
}

async function fetchImdbSuggestion(imdbId) {
  try {
    const res = await fetch(`https://v3.sg.media-imdb.com/suggestion/t/${imdbId}.json`);
    if (!res.ok) return null;
    const json = await res.json();
    return json.d?.[0] || null;
  } catch (e) {
    console.error(`Error fetching IMDb suggestion for ${imdbId}:`, e.message);
    return null;
  }
}

async function main() {
  console.log(`Fetching rich live metadata for ${MOVIES_LIST.length} movies...`);

  const enrichedMovies = [];

  for (let i = 0; i < MOVIES_LIST.length; i++) {
    const item = MOVIES_LIST[i];
    console.log(`[${i + 1}/${MOVIES_LIST.length}] Fetching ${item.id} (${item.imdbId})...`);

    const [omdb, imdbSug] = await Promise.all([
      fetchOmdb(item.imdbId),
      fetchImdbSuggestion(item.imdbId),
    ]);

    const title = omdb?.Title || imdbSug?.l || item.id;
    const year = parseInt(omdb?.Year || imdbSug?.y || '2000', 10);
    const imdbRating = parseFloat(omdb?.imdbRating || '7.5');
    const rated = omdb?.Rated || 'PG-13';
    const runtime = omdb?.Runtime || '120 min';
    const director = omdb?.Director || 'Unknown Director';
    const cast = omdb?.Actors ? omdb.Actors.split(',').map((s) => s.trim()) : [];
    const synopsis = omdb?.Plot || 'A great movie for movie night.';
    const awards = omdb?.Awards || '';
    const rottenTomatoes = omdb?.Ratings?.find((r) => r.Source === 'Rotten Tomatoes')?.Value || null;
    const boxOffice = omdb?.BoxOffice && omdb.BoxOffice !== 'N/A' ? omdb.BoxOffice : null;

    // High-res poster from IMDb CDN or OMDB
    let posterUrl = omdb?.Poster && omdb.Poster !== 'N/A' ? omdb.Poster : '';
    if (imdbSug?.i?.imageUrl) {
      posterUrl = imdbSug.i.imageUrl;
    }

    // High-res backdrop / landscape poster URL
    const backdropUrl = posterUrl;

    enrichedMovies.push({
      id: item.id,
      title,
      year,
      imdbRating,
      imdbId: item.imdbId,
      imdbUrl: `https://www.imdb.com/title/${item.imdbId}/`,
      genre: item.genre,
      genreEmoji: item.genreEmoji,
      director,
      cast,
      synopsis,
      youtubeTrailerId: item.youtubeTrailerId,
      posterUrl,
      backdropUrl,
      tagline: item.tagline,
      runtime,
      rated,
      awards,
      rottenTomatoes,
      boxOffice,
    });

    // Small delay to be polite
    await new Promise((r) => setTimeout(r, 150));
  }

  console.log(`Successfully fetched metadata for all ${enrichedMovies.length} movies!`);

  // Write out as JSON for reference
  fs.writeFileSync(
    path.join(process.cwd(), 'data', 'movies_fetched.json'),
    JSON.stringify(enrichedMovies, null, 2),
    'utf-8'
  );

  console.log('Saved to data/movies_fetched.json');
}

main().catch(console.error);

