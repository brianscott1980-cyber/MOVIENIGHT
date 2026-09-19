import fs from 'fs';

const queries = [
  { id: 'bad-boys', q: 'Bad Boys 1995 official trailer' },
  { id: 'hellboy', q: 'Hellboy 2004 official trailer' },
  { id: 'jaws', q: 'Jaws 1975 official trailer' },
  { id: 'tremors', q: 'Tremors 1990 official trailer' },
  { id: 'jumanji', q: 'Jumanji 1995 official trailer' },
  { id: 'real-steel', q: 'Real Steel 2011 official trailer' },
  { id: 'big-trouble-in-little-china', q: 'Big Trouble in Little China 1986 official trailer' },
  { id: 'stand-by-me', q: 'Stand by Me 1986 official trailer' },
];

async function searchOne(q) {
  try {
    const res = await fetch('https://www.youtube.com/results?search_query=' + encodeURIComponent(q), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });
    const text = await res.text();
    const regex = /"videoId":"([a-zA-Z0-9_-]{11})"/g;
    const matches = Array.from(text.matchAll(regex)).map(m => m[1]);
    for (const id of matches) {
      const check = await fetch(`https://i.ytimg.com/vi/${id}/hqdefault.jpg`, { method: 'HEAD' });
      if (check.status === 200) return id;
    }
  } catch (e) {
    console.error(q, e.message);
  }
  return null;
}

async function run() {
  const results = {};
  for (const item of queries) {
    const vid = await searchOne(item.q);
    console.log(`${item.id}: ${vid}`);
    results[item.id] = vid;
    await new Promise(r => setTimeout(r, 600));
  }
  fs.writeFileSync('scripts/remaining_ids.json', JSON.stringify(results, null, 2));
}

run();

