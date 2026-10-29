# Pixel Dudes Brawl — Online

A 4-player pixel platform fighter with local play plus online play. The online mode uses accounts, quick match, private rooms, coins and a skin shop.

## Run locally
```
npm install
npm start            # http://localhost:3000  (env PORT to change)
npm test             # headless 2-client integration test
npm run build        # rebuild public/index.html + ../pixel-platformer/index.html from src/
```
Requires Node 18 or newer. better-sqlite3 ships prebuilt binaries for common platforms.

## Environment variables
| var | default | meaning |
|---|---|---|
| PORT | 3000 | HTTP and WebSocket port (WS path `/ws`) |
| DB_PATH | data/brawl.db | SQLite file. **Put this on a persistent disk.** |
| QUICK_FILL_MS | 15000 | how long quick match waits before filling empty slots with CPUs |
| COUNTDOWN_MS | 5000 | lobby countdown once ready |
| MATCH_TIME_S | 240 | online match time limit |

## Features
- Register, login and guest accounts, using bcrypt password hashes and bearer tokens.
- Quick match for up to 4 players. CPUs fill the empty slots after a timeout.
- Private rooms with a 4-letter code. The host can add or remove CPUs and pick the arena.
- Authoritative 60 Hz simulation (`shared/core.js`) with 30 Hz snapshots and client interpolation. A player who disconnects mid-fight is replaced by a CPU.
- Coins: 20 for taking part, 15 per KO and 50 for a win. 4 starter skins; the rest are locked and the server validates every purchase.
- `POST /api/coins/checkout` returns **501 "payments not configured"**. No payment provider is integrated.
- Settings sync to localStorage and to the account. There is a title screen, chiptune music per arena and full SFX, and everything works with keyboard and controller.

## Deploy
The app is one Node process (HTTP + WebSocket) and needs a persistent disk for SQLite.
- **Render:** New Web Service from this repo. Build: `npm install`. Start: `npm start`. Add a Disk mounted at `/data` and set `DB_PATH=/data/brawl.db`.
- **Fly.io:** `fly launch` (Node). Then `fly volumes create brawl_data`, mount it at `/data` in `fly.toml` (`[mounts] source="brawl_data" destination="/data"`), set `DB_PATH=/data/brawl.db` and use `internal_port = 3000`. Keep it to 1 machine, because rooms live in memory.
- **Railway:** New project from the repo; it uses the start command `npm start`. Add a Volume at `/data` and set `DB_PATH=/data/brawl.db`.

Run a single instance. Rooms are in memory, so scaling out would need sticky sessions and shared state.

To take real payments you would need to integrate a provider (for example Stripe Checkout plus a webhook that credits coins) in `/api/coins/checkout`. That is intentionally not done.
