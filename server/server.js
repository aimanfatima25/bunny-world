// Kawaii Corner server: leaderboards, player accounts and friends.
// Plain Node.js (no packages): the built-in http server and the built-in SQLite database.
//
// Every player has a secret random id stored on their device ("player"). It proves who they
// are and is never shown to anyone. What others see is their unique username.
//
//   GET  /api/health                      → { ok } (for Coolify's health check)
//   GET  /api/scores/:game?player=        → top 10 for that game
//   POST /api/scores                      → { game, name, score, player } saves a best score
//
//   GET  /api/username/:name              → { available } is this username free?
//   POST /api/account                     → { player, username, name, girl, pet, stars, hearts, motto }
//                                           create or update your account (username must be free)
//   POST /api/ping                        → { player, stars, hearts, girl, pet } "I'm online"
//   GET  /api/users/:username             → someone's public profile
//   GET  /api/search?q=&player=           → up to 12 profiles whose username or name matches
//   GET  /api/suggest?player=             → players who were online lately (people to meet)
//   GET  /api/friends?player=             → { friends, incoming, outgoing }
//   POST /api/friends/add                 → { player, username } send a request (or accept theirs)
//   POST /api/friends/accept              → { player, username }
//   POST /api/friends/remove              → { player, username } remove, decline or cancel
//
// A public profile: { username, name, girl, pet, stars, hearts, motto, online, friends }

const http = require('node:http');
const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');
const fs = require('node:fs');

const PORT = Number(process.env.PORT) || 3000;
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const TOP = 10;
const ONLINE_MS = 2 * 60 * 1000;      // seen in the last 2 minutes = online

// The games, and the highest score that's believable for each (anything above is rejected)
const GAMES = { flappy: 1000, fish: 100000, memory: 1000, bubble: 200000, catch: 1000, sushi: 500, ramen: 500, cake: 500 };

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

  CREATE TABLE IF NOT EXISTS users (
    player     TEXT PRIMARY KEY,
    username   TEXT NOT NULL UNIQUE COLLATE NOCASE,
    name       TEXT NOT NULL DEFAULT '',
    girl       TEXT NOT NULL DEFAULT 'girl-1',
    pet        TEXT NOT NULL DEFAULT 'bunny',
    stars      INTEGER NOT NULL DEFAULT 0,
    hearts     INTEGER NOT NULL DEFAULT 5,
    motto      TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL,
    last_seen  INTEGER NOT NULL DEFAULT 0
  );
  -- one row per pair: from asked to; accepted = 1 once to said yes
  CREATE TABLE IF NOT EXISTS friends (
    from_player TEXT NOT NULL,
    to_player   TEXT NOT NULL,
    accepted    INTEGER NOT NULL DEFAULT 0,
    created_at  TEXT NOT NULL,
    PRIMARY KEY (from_player, to_player)
  );
`);

// ---------- leaderboards ----------

const topQuery = db.prepare(
  'SELECT player, name, score FROM scores WHERE game = ? ORDER BY score DESC, updated_at ASC LIMIT ?');
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

// ---------- cleaning what people send ----------

// Names: letters, numbers and spaces only, 1–12 characters
function cleanName(name) {
  return String(name || '').replace(/[^\p{L}\p{N} ]/gu, '').replace(/\s+/g, ' ').trim().slice(0, 12);
}
// Usernames: 3–15 of a–z, 0–9, _ and . (not starting or ending with . or _)
const USERNAME = /^[a-z0-9](?:[a-z0-9_.]{1,13})[a-z0-9]$/;
const cleanUsername = u => String(u || '').trim().replace(/^@/, '').toLowerCase();
const RESERVED = new Set(['admin', 'kawaii', 'kawaiicorner', 'support', 'moderator', 'official', 'system', 'help', 'api']);
const cleanText = (t, n) => String(t || '').replace(/[<>\u0000-\u001f]/g, '').trim().slice(0, n);
const cleanId = (t, re) => (re.test(String(t || '')) ? String(t) : null);
const goodPlayer = p => /^[a-z0-9-]{8,40}$/.test(String(p || ''));
const num = (n, max) => Math.max(0, Math.min(max, Math.floor(Number(n) || 0)));

// ---------- accounts ----------

const userByPlayer = db.prepare('SELECT * FROM users WHERE player = ?');
const userByName = db.prepare('SELECT * FROM users WHERE username = ?');
const insertUser = db.prepare(`INSERT INTO users (player, username, name, girl, pet, stars, hearts, motto, created_at, last_seen)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
const updateUser = db.prepare(`UPDATE users SET username = ?, name = ?, girl = ?, pet = ?, stars = ?, hearts = ?, motto = ?, last_seen = ?
  WHERE player = ?`);
const pingUser = db.prepare('UPDATE users SET stars = ?, hearts = ?, girl = ?, pet = ?, last_seen = ? WHERE player = ?');
const friendCount = db.prepare(`SELECT COUNT(*) AS n FROM friends WHERE accepted = 1 AND (from_player = ? OR to_player = ?)`);

function profile(u) {
  return {
    username: u.username, name: u.name || u.username, girl: u.girl, pet: u.pet, stars: u.stars, hearts: u.hearts,
    motto: u.motto, online: Date.now() - u.last_seen < ONLINE_MS, friends: friendCount.get(u.player, u.player).n
  };
}

function profileFields(body, old) {
  return {
    name: cleanName(body.name) || (old && old.name) || '',
    girl: cleanId(body.girl, /^(girl|guy)-\d{1,2}$/) || (old && old.girl) || 'girl-1',
    pet: cleanId(body.pet, /^[a-z-]{2,20}$/) || (old && old.pet) || 'bunny',
    stars: body.stars == null ? (old ? old.stars : 0) : num(body.stars, 10000000),
    hearts: body.hearts == null ? (old ? old.hearts : 5) : num(body.hearts, 99),
    motto: body.motto == null ? (old ? old.motto : '') : cleanText(body.motto, 30)
  };
}

// ---------- friends ----------

const pairQuery = db.prepare('SELECT * FROM friends WHERE from_player = ? AND to_player = ?');
const addPair = db.prepare('INSERT OR IGNORE INTO friends (from_player, to_player, accepted, created_at) VALUES (?, ?, 0, ?)');
const acceptPair = db.prepare('UPDATE friends SET accepted = 1 WHERE from_player = ? AND to_player = ?');
const removePair = db.prepare('DELETE FROM friends WHERE (from_player = ? AND to_player = ?) OR (from_player = ? AND to_player = ?)');
const myPairs = db.prepare(`
  SELECT f.from_player, f.to_player, f.accepted, u.* FROM friends f
  JOIN users u ON u.player = CASE WHEN f.from_player = ? THEN f.to_player ELSE f.from_player END
  WHERE f.from_player = ? OR f.to_player = ?
  ORDER BY u.last_seen DESC`);
const searchQuery = db.prepare(`SELECT * FROM users WHERE player != ? AND (username LIKE ? ESCAPE '\\' OR name LIKE ? ESCAPE '\\')
  ORDER BY (username = ?) DESC, last_seen DESC LIMIT 12`);
const suggestQuery = db.prepare(`SELECT * FROM users WHERE player != ? ORDER BY last_seen DESC LIMIT 30`);

function relation(me, other) {
  const out = pairQuery.get(me, other), inc = pairQuery.get(other, me);
  if ((out && out.accepted) || (inc && inc.accepted)) return 'friends';
  if (out) return 'requested';
  if (inc) return 'incoming';
  return 'none';
}
const withRelation = (me, u) => Object.assign(profile(u), { relation: relation(me, u.player) });

// ---------- http plumbing ----------

// Simple flood protection: at most 60 writes per minute from one address
const recent = new Map();
function tooMany(ip, limit) {
  const now = Date.now();
  const list = (recent.get(ip) || []).filter(t => now - t < 60000);
  list.push(now);
  recent.set(ip, list);
  return list.length > (limit || 60);
}
setInterval(() => recent.clear(), 10 * 60000).unref();

function send(res, status, body) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    // The websites and the Android app all call this server
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
      if (data.length > 4000) { reject(new Error('too big')); req.destroy(); }
    });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const p = url.pathname;
  if (req.method === 'OPTIONS') return send(res, 204, {});
  if (p === '/api/health') return send(res, 200, { ok: true });

  let body = {};
  if (req.method === 'POST') {
    const ip = req.headers['cf-connecting-ip'] || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    if (tooMany(ip, p === '/api/scores' ? 20 : 60)) return send(res, 429, { error: 'Slow down a little' });
    try { body = JSON.parse(await readBody(req)); } catch (e) { return send(res, 400, { error: 'Bad request' }); }
  }
  const player = String(body.player || url.searchParams.get('player') || '');
  const me = goodPlayer(player) ? userByPlayer.get(player) : null;

  // ---- leaderboards ----
  const top = p.match(/^\/api\/scores\/([a-z]+)$/);
  if (req.method === 'GET' && top) {
    if (!GAMES[top[1]]) return send(res, 404, { error: 'Unknown game' });
    return send(res, 200, { game: top[1], scores: topTen(top[1], player) });
  }
  if (req.method === 'POST' && p === '/api/scores') {
    const game = String(body.game || ''), name = cleanName(body.name), score = Number(body.score);
    if (!GAMES[game]) return send(res, 400, { error: 'Unknown game' });
    if (!name) return send(res, 400, { error: 'Name needed' });
    if (!goodPlayer(player)) return send(res, 400, { error: 'Bad player id' });
    if (!Number.isInteger(score) || score < 1 || score > GAMES[game]) return send(res, 400, { error: 'Bad score' });
    saveQuery.run(game, player, name, score, new Date().toISOString());
    const { rank } = rankQuery.get(game, game, player);
    return send(res, 200, { ok: true, rank, scores: topTen(game, player) });
  }

  // ---- accounts ----
  const un = p.match(/^\/api\/username\/([^/]+)$/);
  if (req.method === 'GET' && un) {
    const u = cleanUsername(decodeURIComponent(un[1]));
    if (!USERNAME.test(u) || RESERVED.has(u)) return send(res, 200, { available: false, reason: 'not allowed' });
    const taken = userByName.get(u);
    return send(res, 200, { available: !taken || taken.player === player });
  }

  if (req.method === 'POST' && p === '/api/account') {
    if (!goodPlayer(player)) return send(res, 400, { error: 'Bad player id' });
    const username = cleanUsername(body.username);
    if (!USERNAME.test(username) || RESERVED.has(username)) {
      return send(res, 400, { error: 'Use 3–15 letters, numbers, _ or .' });
    }
    const taken = userByName.get(username);
    if (taken && taken.player !== player) return send(res, 409, { error: 'That username is taken' });
    const f = profileFields(body, me);
    const now = Date.now();
    if (me) updateUser.run(username, f.name, f.girl, f.pet, f.stars, f.hearts, f.motto, now, player);
    else insertUser.run(player, username, f.name, f.girl, f.pet, f.stars, f.hearts, f.motto, new Date().toISOString(), now);
    return send(res, 200, { ok: true, me: profile(userByPlayer.get(player)) });
  }

  if (req.method === 'POST' && p === '/api/ping') {
    if (!me) return send(res, 404, { error: 'No account yet' });
    const f = profileFields(body, me);
    pingUser.run(f.stars, f.hearts, f.girl, f.pet, Date.now(), player);
    const incoming = myPairs.all(player, player, player).filter(r => !r.accepted && r.to_player === player).length;
    return send(res, 200, { ok: true, incoming });
  }

  const user = p.match(/^\/api\/users\/([^/]+)$/);
  if (req.method === 'GET' && user) {
    const u = userByName.get(cleanUsername(decodeURIComponent(user[1])));
    if (!u) return send(res, 404, { error: 'No player with that username' });
    return send(res, 200, me ? withRelation(player, u) : profile(u));
  }

  if (req.method === 'GET' && p === '/api/search') {
    const q = cleanText(url.searchParams.get('q'), 20).replace(/^@/, '');
    if (q.length < 2) return send(res, 200, { users: [] });
    const like = '%' + q.replace(/[\\%_]/g, c => '\\' + c) + '%';
    return send(res, 200, { users: searchQuery.all(player, like, like, q.toLowerCase()).map(u => withRelation(player, u)) });
  }

  if (req.method === 'GET' && p === '/api/suggest') {
    const users = suggestQuery.all(player).map(u => withRelation(player, u)).filter(u => u.relation === 'none').slice(0, 10);
    return send(res, 200, { users });
  }

  if (req.method === 'GET' && p === '/api/friends') {
    if (!me) return send(res, 200, { friends: [], incoming: [], outgoing: [] });
    const rows = myPairs.all(player, player, player);
    const out = { friends: [], incoming: [], outgoing: [] };
    for (const r of rows) {
      const prof = profile(r);
      if (r.accepted) out.friends.push(prof);
      else if (r.to_player === player) out.incoming.push(prof);
      else out.outgoing.push(prof);
    }
    out.friends.sort((a, b) => b.online - a.online);
    return send(res, 200, out);
  }

  const fr = p.match(/^\/api\/friends\/(add|accept|remove)$/);
  if (req.method === 'POST' && fr) {
    if (!me) return send(res, 400, { error: 'Pick a username first' });
    const other = userByName.get(cleanUsername(body.username));
    if (!other) return send(res, 404, { error: 'No player with that username' });
    if (other.player === player) return send(res, 400, { error: "That's you!" });
    const now = new Date().toISOString();
    if (fr[1] === 'remove') {
      removePair.run(player, other.player, other.player, player);
    } else if (pairQuery.get(other.player, player)) {
      // they asked first: adding them back (or accepting) makes you friends
      acceptPair.run(other.player, player);
    } else if (fr[1] === 'add') {
      addPair.run(player, other.player, now);
    } else {
      return send(res, 400, { error: 'No request to accept' });
    }
    return send(res, 200, withRelation(player, other));
  }

  send(res, 404, { error: 'Not found' });
});

server.listen(PORT, () => console.log(`Kawaii Corner server listening on port ${PORT}`));
