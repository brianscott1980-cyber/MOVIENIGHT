import fs from 'fs';

async function testTmdb(imdbId) {
  // Let's test if any public TMDB key works or search
  const keys = [
    '389a9be813bc30f9a2d674251fa56936',
    'b6e79980d008b8b8491321ba9ff16b9b',
    '15d2ea6d0dc1d476efbca3eba2b9bbfb',
    '4e44d9029b1270a757cddc766a1bcb63',
    '844dba0bfd8f3a4f3799f6130ef9e335'
  ];

  for (const key of keys) {
    try {
      const res = await fetch(`https://api.themoviedb.org/3/find/${imdbId}?api_key=${key}&external_source=imdb_id`);
      if (res.ok) {
        const data = await res.json();
        const movie = data.movie_results?.[0];
        if (movie && movie.backdrop_path) {
          console.log(`Key ${key} WORKS! Backdrop: https://image.tmdb.org/t/p/w1280${movie.backdrop_path}`);
          return { key, backdropUrl: `https://image.tmdb.org/t/p/w1280${movie.backdrop_path}` };
        }
      }
    } catch (e) {
      // continue
    }
  }
  return null;
}

testTmdb('tt0076759').then(res => console.log('Result:', res));

