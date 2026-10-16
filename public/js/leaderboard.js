// Talks to the leaderboard server (the server/ folder). Every function fails
// quietly (returns null) when there's no internet, so the games keep working offline.
window.BW = window.BW || {};

BW.leaderboard = (() => {
  // While testing on this computer (port 8765) use a local server; everywhere else the real one
  const API = location.port === '8765' ? 'http://localhost:3000' : 'https://api.aimanfatima.com';

  async function call(path, options) {
    try {
      const res = await fetch(API + path, Object.assign({ cache: 'no-store' }, options));
      return res.ok ? await res.json() : null;
    } catch (e) {
      return null;
    }
  }

  return {
    // → [{ name, score, you }] or null when offline
    async top(game) {
      const data = await call(`/api/scores/${game}?player=${encodeURIComponent(BW.store.playerId())}`);
      return data ? data.scores : null;
    },
    // → { rank, scores } or null; does nothing until the player has picked a name
    async submit(game, score) {
      const name = BW.store.data.playerName;
      if (!name || score < 1) return null;
      const r = await call('/api/scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ game, name, score, player: BW.store.playerId() })
      });
      if (r && BW.stickers) BW.stickers.topRank(game, r.rank);
      return r;
    }
  };
})();
