# Changelog

All notable changes to this project will be documented here.
Format based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
versioning follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added
- **API structured logging**: coloured, human-readable logs visible in the `make dev-api` terminal
  - `logging_config.py`: `setup_logging(env)` configures root logger with `_ColourFormatter` (ANSI colours + timestamps in dev, plain in prod); DEBUG level in `development`, INFO in production
  - HTTP request logging middleware in `main.py`: logs method, path, status code and elapsed time for every request
  - Socket.IO event logging in `room.py` and `game.py`: INFO on connect/disconnect, join, leave, game start/finish; DEBUG on every event entry; ERROR with full traceback on unhandled exceptions
  - `try/except` guards on all socket handlers — exceptions are now logged instead of being silently swallowed by python-socketio
  - Noisy third-party loggers (socketio, engineio, asyncio, uvicorn.access) silenced to WARNING
- **Tic-Tac-Toe game**: full implementation of classic 3-in-a-row as a second game in Dynamizer
  - Backend: `TicTacToeEngine` (pure, no I/O) with `initialize`, `make_move`, `_check_winner`, `leaderboard`; detects wins (rows, columns, diagonals) and draws
  - Backend: `game:make_move` Socket.IO event handler; `game:finished` broadcast on game end
  - Backend: `GameService.save_state` / `load_state` — `GameState` is now persisted to Redis (key `game_state:{room_id}`)
  - Backend: `game:start` now persists `GameState` and emits `room:updated` before `game:started`
  - Frontend: `TicTacToeState` and `GameFinishedPayload` TypeScript types (`types/game.ts`)
  - Frontend: `TicTacToePlay` component — 3×3 board using player emojis as pieces, turn indicator, winner/draw result overlay with leaderboard, "Back to lobby" button
  - Frontend: `makeMove` action in `useGame` hook; `tttState` and `gameResult` state
  - Frontend: game selector on the home page (Time's Up / Tic-Tac-Toe cards)
  - Frontend: play page now branches on `room.config.game` to render the correct game UI
  - Frontend: lobby shows player count as `x/2` and a "Waiting for 1 more player..." hint for Tic-Tac-Toe; "Start game" is disabled until exactly 2 players are present
  - 20 new backend tests (`test_tic_tac_toe.py`) + 8 new frontend tests (`TicTacToePlay.test.tsx`)
- `GameState.game` field — game slug stored in state, used by `GameService` to dispatch to the correct engine (also fixes `next_turn` which was hardcoded to `"times_up"`)
- `EmojiPicker` component: dropdown grid with 90 emojis, replaces free-text emoji input on homepage and lobby join form
- Dev-only "🧪 Open test player" button in lobby — opens a second tab that auto-joins with a random name/emoji
- `?testplayer=1` query param: auto-fill and auto-join logic for the second test tab
- `.opencode/skills/pr-review/SKILL.md`: OpenCode skill for automated PR review of this repo
- **Player identity scoped per room**: `localStorage` key changed from `player_id` to `player_<roomId>`, preventing cross-room identity collisions when opening multiple tabs
- `room:joined` event now handled on the frontend — server-assigned `player_id` is captured into state and persisted to `localStorage`
- `room:join` socket event now accepts an optional `player_id` for reconnection — if the player already exists in the room the socket is re-added to the room group without creating a duplicate; if the game is already in progress the current `GameState` is also sent back (`game:started`)
- Play page emits `room:join` on socket connect to rejoin the room group and receive `game:started` / `game:updated` after navigation
- Play page renders a "Connecting..." state while `room` is null, preventing the Time's Up fallback from flashing before the room data arrives
- `useGame` accepts an optional `onJoined` callback triggered when `room:joined` fires
- `join()` in `useGame` accepts an optional `existingPlayerId` parameter for reconnection flows
- Badge **"tú"** (accent colour) shown next to the current player's entry in the lobby player list
- 2 new backend tests for `room:join` reconnection logic; 4 new frontend tests for `useGame` reconnection and `room:joined` handling
- Play page passes `?pid=<playerId>` in the URL when navigating to `/room/:id/play`, and reads it on mount with priority over localStorage — prevents test-player tabs from losing their identity during navigation
- Lobby reads `?pid=` from the URL on mount (both normal and test-player flows) so returning from the play page reconnects as the same player
- `onPlayAgain` in the play page now navigates to `/room/:id?pid=<playerId>` so identity is preserved on the return trip
- 11 new frontend tests for `TicTacToePlay` component (loser overlay, occupied-cell disable, winner-cell highlight, leaderboard, missing-onPlayAgain)
- 6 new frontend tests for the play page (`playPage.test.tsx`) covering loading states, error display, and back-to-lobby navigation

### Changed
- Minimum players required to start a game lowered from 2 to 1 (backend + frontend)
- API version no longer hardcoded in `main.py` — read dynamically from `pyproject.toml` via `importlib.metadata`

### Fixed
- Host was not receiving Socket.IO broadcasts because it never emitted `room:join` after creating the room via REST — lobby now emits `room:join` on mount for the host too
- `isHost` was always `false` on first render because `playerId` was read from `localStorage` inside a `useEffect`; it is now read synchronously at render time
- Socket listeners were registered multiple times per event due to unstable `on`/`off` references in `useSocket`; fixed with `useCallback`
- Backend only emitted `game:started` when starting a game but the frontend was waiting for `room:updated` to redirect; backend now emits both events
- Host player was duplicated in the player list because `room:join` always inserted a new `Player` record; backend now does a rejoin if `player_id` is provided and the player already exists
- Opening a second browser tab to join a room would inherit the host's `player_id` from `localStorage` and enter as the host — fixed by scoping the key to the room and always showing the join form for unknown players
- Play page was rendering Time's Up for all games because `room` was `null` on first render — the TTT branch now only evaluates after `room` data arrives
- Play page socket was never joining the backend room group, causing `game:started` and `game:updated` to be silently dropped
- **Back to lobby**: after a game ends, the room was left in `PLAYING` status in Redis, causing the lobby to immediately redirect back to `/play` in a loop — the backend now resets the room to `WAITING` and emits `room:updated` as part of the `game:finished` flow
- **`game:finished` never fired**: a `KeyError` (`entry["score"]` instead of `entry["points"]`) in `game.py` was silently crashing the socket handler after emitting `game:updated`, preventing `game:finished` and the room reset from ever being sent to clients

---

## [0.2.0] — Tooling & DX

### Added
- `Makefile` at repo root: `install`, `up/down/logs`, `dev/dev-api/dev-web`, `test/test-api/test-web/test-cov`, `lint/format/format-check`, `clean`, `help`
- Migrated dependency management from `venv + pip + hatchling` to **Poetry** (`pyproject.toml` rewritten, `poetry.lock` generated)
- Multi-stage `Dockerfile` for the API using Poetry
- Dark design system for the frontend (`globals.css`): colour palette, typography (Nunito + Space Grotesk), spacing tokens, and utility classes (`.card`, `.btn`, `.input`, `.player-list`, `.badge`, `.room-code`, …)

### Changed
- All pages (homepage, lobby, play) redesigned with CSS utility classes, replacing inline styles
- README updated: Poetry setup, Makefile reference, simplified "How to run" and "How to test" sections
- Codebase translated from Spanish to English (backend, frontend, comments, docs)

---

## [0.1.0] — Initial project

### Added
- Monorepo structure: `apps/api` (FastAPI + Socket.IO) and `apps/web` (Next.js 14)
- Real-time room management via WebSockets: create room, join room, player list sync
- Times Up game engine: card deck, rounds 1–3, turn/skip logic, leaderboard
- REST endpoints: `POST /api/rooms/`, `GET /api/rooms/{id}`
- Socket.IO events: `room:join`, `game:start`, `game:card_guessed`, `game:card_passed`
- Redis-backed room persistence (`RoomService`)
- QR code generation in lobby (`qrcode.react`)
- Docker Compose setup: Postgres + Redis
- 28 backend tests (pytest-asyncio)
- 8 frontend tests (Jest + Testing Library)
- Project wiki / documentation

---

[Unreleased]: https://github.com/javisanxe/dynamizer/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/javisanxe/dynamizer/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/javisanxe/dynamizer/releases/tag/v0.1.0
