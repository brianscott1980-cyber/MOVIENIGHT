import { DatabaseSync } from 'node:sqlite';
import fs from 'fs';

const db = new DatabaseSync('data/movienight.db');
db.exec(`
  DELETE FROM votes;
  UPDATE sessions SET status = 'voting', winner_movie_id = NULL, updated_at = datetime('now') WHERE session_id = 'session-main';
`);
console.log('Votes cleared from SQLite. Remaining count:', db.prepare('SELECT count(*) as c FROM votes').get());

if (fs.existsSync('data/movienight.json')) {
  const data = JSON.parse(fs.readFileSync('data/movienight.json', 'utf8'));
  data.ballots = {};
  data.winnerMovieId = null;
  data.status = 'voting';
  fs.writeFileSync('data/movienight.json', JSON.stringify(data, null, 2));
  console.log('Synced data/movienight.json ballots to {}');
}

