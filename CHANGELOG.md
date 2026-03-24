# Changelog

All notable changes to this project will be documented here.
Format based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
versioning follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added
- `EmojiPicker` component: dropdown grid with 90 emojis, replaces free-text emoji input on homepage and lobby join form
- Dev-only "🧪 Open test player" button in lobby — opens a second tab that auto-joins with a random name/emoji
- `?testplayer=1` query param: auto-fill and auto-join logic for the second test tab

### Changed
- Minimum players required to start a game lowered from 2 to 1 (backend + frontend)

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
