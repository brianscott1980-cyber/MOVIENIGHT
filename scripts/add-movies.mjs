import fs from 'fs';
import path from 'path';
import { DatabaseSync } from 'node:sqlite';

const TMDB_KEY = '15d2ea6d0dc1d476efbca3eba2b9bbfb';

const NEW_MOVIES_DEF = [
  { id: 'austin-powers', imdbId: 'tt0118655', genre: 'comedy-cult', genreEmoji: '😂', youtubeTrailerId: 'JCSMpRHcNuM', tagline: "If he were any cooler, he'd still be frozen, baby!" },
  { id: 'goldeneye', imdbId: 'tt0113189', genre: 'action-thriller', genreEmoji: '💥', youtubeTrailerId: '8Zw8ylP4buA', tagline: 'You know the name. You know the number.' },
  { id: 'braveheart', imdbId: 'tt0112573', genre: 'epic-adventure', genreEmoji: '⚔️', youtubeTrailerId: '1NJO0jxBtMo', tagline: 'Every man dies, not every man really lives.' },
  { id: 'the-rock', imdbId: 'tt0117500', genre: 'action-thriller', genreEmoji: '💥', youtubeTrailerId: '313n0wga2xo', tagline: 'Alcatraz. Only one man has ever broken out. Now five million lives depend on two men breaking in.' },
  { id: 'point-break', imdbId: 'tt0102685', genre: 'action-thriller', genreEmoji: '💥', youtubeTrailerId: 'KywiWyPjrOg', tagline: '27 banks in three years. Anything to catch the perfect wave.' },
  { id: 'die-hard', imdbId: 'tt0095016', genre: 'action-thriller', genreEmoji: '💥', youtubeTrailerId: 'TotSHi0ViUc', tagline: 'Forty stories high, with evil standing between thirty people and their lives.' },
  { id: 'bridget-jones', imdbId: 'tt0243155', genre: 'comedy-cult', genreEmoji: '😂', youtubeTrailerId: 'PYPK3jPZkYI', tagline: 'Health warning: Calorie counting requires serious dedication.' },
  { id: 'anchorman', imdbId: 'tt0357413', genre: 'comedy-cult', genreEmoji: '😂', youtubeTrailerId: '-T3wnP91OnI', tagline: 'His news was big. His hair was bigger.' },
  { id: 'zoolander', imdbId: 'tt0196229', genre: 'comedy-cult', genreEmoji: '😂', youtubeTrailerId: 'YtQq0T3ExLs', tagline: '3% Body Fat. 1% Brain Activity.' },
  { id: 'elf', imdbId: 'tt0319343', genre: 'comedy-cult', genreEmoji: '😂', youtubeTrailerId: 'gW9wRNqQ_P8', tagline: 'This holiday, discover your inner elf.' },
  { id: 'dodgeball', imdbId: 'tt0364725', genre: 'comedy-cult', genreEmoji: '😂', youtubeTrailerId: 'W-XbDZUnUmw', tagline: 'Grab Life by the Balls.' },
  { id: 'iron-man', imdbId: 'tt0371746', genre: 'superhero', genreEmoji: '🦸', youtubeTrailerId: '8ugaeA-nMTc', tagline: "Heroes aren't born. They're built." },
  { id: 'love-actually', imdbId: 'tt0314331', genre: 'comedy-cult', genreEmoji: '😂', youtubeTrailerId: 'H9Z3_ifFheQ', tagline: 'The ultimate romantic comedy.' },
  { id: 'teen-wolf', imdbId: 'tt0090142', genre: 'comedy-cult', genreEmoji: '😂', youtubeTrailerId: 'KjxTIvkD2ls', tagline: "He's always wanted to be special... but he never expected this!" },
  { id: 'the-terminator', imdbId: 'tt0088247', genre: 'sci-fi', genreEmoji: '🚀', youtubeTrailerId: 'k64P4l2Wmeg', tagline: 'Your future is in his hands.' }
];

async function run() {
  const fetchedPath = path.join(process.cwd(), 'data', 'movies_fetched.json');
  const backdropsPath = path.join(process.cwd(), 'data', 'backdrops.json');

  const existingMovies = JSON.parse(fs.readFileSync(fetchedPath, 'utf8'));
  const backdrops = JSON.parse(fs.readFileSync(backdropsPath, 'utf8'));

  const existingIds = new Set(existingMovies.map(m => m.id));
  const newlyAdded = [];

  for (const def of NEW_MOVIES_DEF) {
    if (existingIds.has(def.id)) {
      console.log('Already exists:', def.id);
      continue;
    }

    console.log(`Fetching metadata for: ${def.id} (${def.imdbId})...`);

    // 1. Fetch OMDB
    let omdb = null;
    try {
      const omdbRes = await fetch(`http://www.omdbapi.com/?i=${def.imdbId}&plot=full&apikey=trilogy`);
      if (omdbRes.ok) omdb = await omdbRes.json();
    } catch (e) {
      console.error('OMDB error:', e.message);
    }

    // 2. Fetch TMDB
    let tmdbMovie = null;
    try {
      const tmdbFindRes = await fetch(`https://api.themoviedb.org/3/find/${def.imdbId}?api_key=${TMDB_KEY}&external_source=imdb_id`);
      if (tmdbFindRes.ok) {
        const tmdbFind = await tmdbFindRes.json();
        tmdbMovie = tmdbFind.movie_results?.[0];
      }
    } catch (e) {
      console.error('TMDB error:', e.message);
    }

    const title = omdb?.Title || tmdbMovie?.title || def.id;
    const year = parseInt(omdb?.Year || (tmdbMovie?.release_date ? tmdbMovie.release_date.slice(0, 4) : '2000'), 10);
    const imdbRating = parseFloat(omdb?.imdbRating || '7.5');
    const rated = omdb?.Rated && omdb.Rated !== 'N/A' ? omdb.Rated : 'PG-13';
    const runtime = omdb?.Runtime && omdb.Runtime !== 'N/A' ? omdb.Runtime : '120 min';
    const director = omdb?.Director && omdb.Director !== 'N/A' ? omdb.Director : 'Unknown Director';
    const cast = omdb?.Actors ? omdb.Actors.split(',').map(s => s.trim()) : [];
    const synopsis = omdb?.Plot || tmdbMovie?.overview || 'A classic film for movie night.';
    const awards = omdb?.Awards && omdb.Awards !== 'N/A' ? omdb.Awards : '';
    const rottenTomatoes = omdb?.Ratings?.find(r => r.Source === 'Rotten Tomatoes')?.Value || null;
    const boxOffice = omdb?.BoxOffice && omdb.BoxOffice !== 'N/A' ? omdb.BoxOffice : null;

    let posterUrl = omdb?.Poster && omdb.Poster !== 'N/A' ? omdb.Poster : '';
    if (tmdbMovie?.poster_path) {
      posterUrl = `https://image.tmdb.org/t/p/w780${tmdbMovie.poster_path}`;
    }

    let backdropUrl = posterUrl;
    if (tmdbMovie?.backdrop_path) {
      backdropUrl = `https://image.tmdb.org/t/p/w1280${tmdbMovie.backdrop_path}`;
      backdrops[def.id] = backdropUrl;
    }

    const movieObj = {
      id: def.id,
      title,
      year,
      imdbRating,
      imdbId: def.imdbId,
      imdbUrl: `https://www.imdb.com/title/${def.imdbId}/`,
      genre: def.genre,
      genreEmoji: def.genreEmoji,
      director,
      cast,
      synopsis,
      youtubeTrailerId: def.youtubeTrailerId,
      posterUrl,
      backdropUrl,
      tagline: def.tagline,
      runtime,
      rated,
      awards,
      rottenTomatoes,
      boxOffice
    };

    newlyAdded.push(movieObj);
    existingMovies.push(movieObj);
    console.log(`✓ Added: ${movieObj.title} (${movieObj.year}) | IMDb ${movieObj.imdbRating} | Backdrop: ${backdropUrl.slice(0, 50)}...`);

    await new Promise(r => setTimeout(r, 120));
  }

  console.log(`\nTotal movies now: ${existingMovies.length}`);

  // Save data/movies_fetched.json
  fs.writeFileSync(fetchedPath, JSON.stringify(existingMovies, null, 2), 'utf8');
  // Save data/backdrops.json
  fs.writeFileSync(backdropsPath, JSON.stringify(backdrops, null, 2), 'utf8');

  // Update src/data/moviesData.ts
  const moviesDataTsPath = path.join(process.cwd(), 'src', 'data', 'moviesData.ts');
  const moviesDataTs = fs.readFileSync(moviesDataTsPath, 'utf8');
  const marker = 'export const MOVIES_DATA: Movie[] = ';
  const idx = moviesDataTs.indexOf(marker);
  if (idx !== -1) {
    const prefix = moviesDataTs.slice(0, idx + marker.length);
    const newContent = prefix + JSON.stringify(existingMovies, null, 2) + ';\n';
    fs.writeFileSync(moviesDataTsPath, newContent, 'utf8');
    console.log(`Updated src/data/moviesData.ts with ${existingMovies.length} movies`);
  }

  // Update SQLite database active_movies table
  const db = new DatabaseSync(path.join(process.cwd(), 'data', 'movienight.db'));
  const insertActive = db.prepare('INSERT OR IGNORE INTO active_movies (session_id, movie_id) VALUES (?, ?)');
  for (const m of existingMovies) {
    insertActive.run('session-main', m.id);
  }
  console.log('Updated SQLite active_movies in data/movienight.db');
}

run().catch(console.error);

