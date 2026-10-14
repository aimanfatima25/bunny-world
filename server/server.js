// Bunny World leaderboard server.
// Plain Node.js (no packages): the built-in http server and the built-in SQLite database.
//
//   GET  /api/scores/:game          → top 10 for that game
//   POST /api/scores                → { game, name, score, player } saves a player's best score
//   GET  /api/health                → "ok" (for Coolify's health check)
//
// Each player (a random id stored on their device) keeps one entry per game: their best score.

const http = require('node:http');
const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');
const fs = require('node:fs');

const PORT = Number(process.env.PORT) || 3000;
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const TOP = 10;

// The games, and the highest score that's believable for each (anything above is rejected)
const GAMES = { flappy: 1000, fish: 100000, memory: 1000, bubble: 200000, catch: 1000 };

fs.mkdirSync(DATA_DIR, { recursive: true });
const db = new DatabaseSync(path.join(DATA_DIR, 'leaderboard.db'));
db.exec(`
  CREATE TABLE IF NOT EXISTS scores (
    game       TEXT    NOT NULL,
    player     TEXT    NOT NULL,
    name       TEXT    NOT NULL,
    score      INTEGER NOT NULL,
    updated_at TEXT    NOT NULL,
    PRIMARY KEY (game, player)
  );
  CREATE INDEX IF NOT EXISTS scores_by_game ON scores (game, score DESC);
`);

const topQuery = db.prepare(
  'SELECT player, name, score FROM scores WHERE game = ? ORDER BY score DESC, updated_at ASC LIMIT ?');

// Top 10 without the private player ids; the asking player's own row gets you: true
function topTen(game, player) {
  return topQuery.all(game, TOP).map(r => ({ name: r.name, score: r.score, you: r.player === player }));
}
const saveQuery = db.prepare(`
  INSERT INTO scores (game, player, name, score, updated_at) VALUES (?, ?, ?, ?, ?)
  ON CONFLICT (game, player) DO UPDATE SET
    name = excluded.name,
    score = MAX(scores.score, excluded.score),
    updated_at = CASE WHEN excluded.score > scores.score THEN excluded.updated_at ELSE scores.updated_at END`);
const rankQuery = db.prepare(
  'SELECT COUNT(*) + 1 AS rank FROM scores WHERE game = ? AND score > (SELECT score FROM scores WHERE game = ? AND player = ?)');

// Names: letters, numbers and spaces only, 1–12 characters
function cleanName(name) {
  return String(name || '').replace(/[^\p{L}\p{N} ]/gu, '').replace(/\s+/g, ' ').trim().slice(0, 12);
}

// Simple flood protection: at most 20 saves per minute from one address
const recent = new Map();
function tooMany(ip) {
  const now = Date.now();
  const list = (recent.get(ip) || []).filter(t => now - t < 60000);
  list.push(now);
  recent.set(ip, list);
  return list.length > 20;
}
setInterval(() => recent.clear(), 10 * 60000).unref();

function send(res, status, body) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    // The website, the Vercel copy and the Android app all call this server
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Cache-Control': 'no-store'
  });
  res.end(JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => {
      data += chunk;
      if (data.length > 2000) { reject(new Error('too big')); req.destroy(); }
    });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (req.method === 'OPTIONS') return send(res, 204, {});
  if (url.pathname === '/api/health') return send(res, 200, { ok: true });

  const top = url.pathname.match(/^\/api\/scores\/([a-z]+)$/);
  if (req.method === 'GET' && top) {
    if (!GAMES[top[1]]) return send(res, 404, { error: 'Unknown game' });
    return send(res, 200, { game: top[1], scores: topTen(top[1], url.searchParams.get('player')) });
  }

  if (req.method === 'POST' && url.pathname === '/api/scores') {
    const ip = req.headers['cf-connecting-ip'] || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    if (tooMany(ip)) return send(res, 429, { error: 'Slow down a little' });
    let body;
    try { body = JSON.parse(await readBody(req)); } catch (e) { return send(res, 400, { error: 'Bad request' }); }
    const game = String(body.game || '');
    const name = cleanName(body.name);
    const score = Number(body.score);
    const player = String(body.player || '');
    if (!GAMES[game]) return send(res, 400, { error: 'Unknown game' });
    if (!name) return send(res, 400, { error: 'Name needed' });
    if (!/^[a-z0-9-]{8,40}$/.test(player)) return send(res, 400, { error: 'Bad player id' });
    if (!Number.isInteger(score) || score < 1 || score > GAMES[game]) return send(res, 400, { error: 'Bad score' });
    saveQuery.run(game, player, name, score, new Date().toISOString());
    const { rank } = rankQuery.get(game, game, player);
    return send(res, 200, { ok: true, rank, scores: topTen(game, player) });
  }

  send(res, 404, { error: 'Not found' });
});

server.listen(PORT, () => console.log(`Leaderboard listening on port ${PORT}`));
