import fs from 'fs';
import path from 'path';

const API_KEY = '15d2ea6d0dc1d476efbca3eba2b9bbfb';

async function fetchAllBackdrops() {
  const moviesJsonPath = path.join(process.cwd(), 'data', 'movies_fetched.json');
  const movies = JSON.parse(fs.readFileSync(moviesJsonPath, 'utf8'));

  console.log(`Checking landscape backdrops for all ${movies.length} movies...`);

  let foundCount = 0;
  const results = {};

  for (const m of movies) {
    try {
      const res = await fetch(`https://api.themoviedb.org/3/find/${m.imdbId}?api_key=${API_KEY}&external_source=imdb_id`);
      if (res.ok) {
        const data = await res.json();
        const movieResult = data.movie_results?.[0];
        if (movieResult && movieResult.backdrop_path) {
          const backdropUrl = `https://image.tmdb.org/t/p/w1280${movieResult.backdrop_path}`;
          results[m.id] = backdropUrl;
          foundCount++;
          console.log(`✓ [${foundCount}/${movies.length}] ${m.title} -> ${backdropUrl}`);
        } else {
          console.log(`✗ No backdrop found for ${m.title} (${m.imdbId})`);
        }
      }
    } catch (e) {
      console.error(`Error for ${m.title}:`, e.message);
    }
    // Small polite delay
    await new Promise((r) => setTimeout(r, 80));
  }

  console.log(`\nDONE! Found landscape artwork for ${foundCount} / ${movies.length} movies.`);
  fs.writeFileSync(path.join(process.cwd(), 'data', 'backdrops.json'), JSON.stringify(results, null, 2), 'utf8');
}

fetchAllBackdrops();

