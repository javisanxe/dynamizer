# Dynamizer

Real-time social games for groups. Create a room, share the QR with your friends, and play together from your phone.

---

## Table of Contents

- [What is Dynamizer?](#what-is-dynamizer)
- [Technology Stack](#technology-stack)
- [System Architecture](#system-architecture)
- [Repository Structure](#repository-structure)
- [How to Run Locally](#how-to-run-locally)
- [Makefile Reference](#makefile-reference)
- [How to Run Tests](#how-to-run-tests)
- [Game Flow](#game-flow)
- [WebSocket Events](#websocket-events)
- [How to Add a New Game](#how-to-add-a-new-game)
- [Roadmap](#roadmap)

---

## What is Dynamizer?

Dynamizer is a social gaming platform designed for groups of friends hanging out. The concept is simple:

1. One person creates a room from their phone or PC
2. Share the automatically generated QR code
3. Others scan it and join with their name and an emoji
4. Everyone plays in real-time from their phones
5. At the end, the final leaderboard is shown

The games are designed for casual settings — drinks, laughs, healthy competition. The first game implemented is **Time's Up**, the game of guessing characters through descriptions, one-word clues, and mime.

No user accounts needed. Each player enters with their name and emoji. Anonymous, fast, frictionless.

---

## Technology Stack

| Layer | Technology | Why |
|---|---|---|
| **Frontend** | Next.js 14 + TypeScript | App Router, SSR for fast mobile loading, shared types with backend |
| **Backend** | Python 3.11 + FastAPI | Native async, Pydantic for validation, familiar ecosystem |
| **Dependency management** | Poetry | Lock file for reproducible installs, clean dev/prod dependency groups |
| **WebSockets** | python-socketio + socket.io-client | Auto-reconnect, rooms, broadcast. Standard for real-time games |
| **Real-time State** | Redis | Ephemeral state for active rooms, Pub/Sub for scaling to multiple instances |
| **Database** | PostgreSQL | History persistence, global leaderboards (future phase) |
| **Initial Deploy** | Vercel (frontend) + Railway (backend) | Free to start, no infrastructure setup |
| **Future Deploy** | AWS (CloudFront + ECS Fargate + RDS + ElastiCache) | Real scaling when there is traffic |

### Why TypeScript on the frontend

The critical point of the app is WebSocket events. With TypeScript, the types for each event (see `apps/web/src/types/events.ts`) are defined once and the compiler warns if the frontend sends something that doesn't match what the backend expects. This avoids silent runtime bugs.

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         CLIENT                               │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Next.js (Vercel / CloudFront)            │   │
│  │                                                      │   │
│  │  / (Home)           → create room / join with code   │   │
│  │  /room/[id]         → lobby + QR + player list       │   │
│  │  /room/[id]/play    → active game view               │   │
│  │                                                      │   │
│  │  useSocket() ──── socket.io-client ──────────────────┼───┼──┐
│  └──────────────────────────────────────────────────────┘   │  │
└─────────────────────────────────────────────────────────────┘  │
                                                                   │ WebSocket
┌─────────────────────────────────────────────────────────────┐  │
│                         SERVER                               │  │
│                                                              │  │
│  ┌──────────────────────────────────────────────────────┐   │  │
│  │     FastAPI + python-socketio (Railway / ECS)         │◄──┼──┘
│  │                                                      │   │
│  │  REST:    POST /api/rooms/      → create room        │   │
│  │           GET  /api/rooms/{id}  → get room state     │   │
│  │                                                      │   │
│  │  Sockets: room:join             → player joins       │   │
│  │           room:leave            → player leaves      │   │
│  │           game:start            → start game         │   │
│  │           game:card_guessed     → add point          │   │
│  │           game:card_passed      → pass card          │   │
│  └────────────────────┬─────────────────────────────────┘   │
│                        │                                      │
│          ┌─────────────┴──────────────┐                      │
│          │                            │                       │
│  ┌───────▼────────┐        ┌──────────▼───────┐              │
│  │  Redis          │        │  PostgreSQL       │              │
│  │  (room state)   │        │  (history,        │              │
│  │  TTL: 6 hours   │        │   leaderboards)   │              │
│  └────────────────┘        └──────────────────┘              │
└─────────────────────────────────────────────────────────────┘
```

### Room data flow

- The **active state** of each room (connected players, game state, card deck) lives in **Redis** with a 6-hour TTL. It is fast and ephemeral — no need to persist to the database.
- When the game ends, the result will be saved to **PostgreSQL** (future implementation).
- WebSocket events use Socket.io's **rooms** system: each room has its own channel, and events are only emitted to the players in that room.

---

## Repository Structure

```
dynamizer/
│
├── apps/
│   ├── web/                          # Frontend — Next.js + TypeScript
│   │   ├── src/
│   │   │   ├── app/                  # Next.js App Router
│   │   │   │   ├── globals.css       # Design system (tokens, utility classes)
│   │   │   │   ├── page.tsx          # Home: create room / join
│   │   │   │   ├── __tests__/        # Page tests
│   │   │   │   └── room/
│   │   │   │       └── [id]/
│   │   │   │           ├── page.tsx          # Room lobby + QR
│   │   │   │           └── play/
│   │   │   │               └── page.tsx      # Active game view
│   │   │   ├── components/
│   │   │   │   └── EmojiPicker.tsx   # Dropdown emoji selector
│   │   │   ├── hooks/
│   │   │   │   ├── useSocket.ts      # WebSocket connection hook
│   │   │   │   ├── useGame.ts        # Game state hook
│   │   │   │   └── __tests__/        # Hook tests
│   │   │   └── types/
│   │   │       ├── room.ts           # Types: Room, Player, RoomStatus
│   │   │       └── events.ts         # WebSocket event types
│   │   ├── next.config.ts
│   │   ├── tsconfig.json
│   │   ├── jest.config.ts
│   │   └── package.json
│   │
│   └── api/                          # Backend — FastAPI + Python
│       ├── app/
│       │   ├── main.py               # Entry point: FastAPI + Socket.io mounted
│       │   ├── config.py             # Settings via pydantic-settings
│       │   ├── models/
│       │   │   ├── room.py           # Room, Player, RoomConfig
│       │   │   └── game.py           # GameState, Turn, Card, TimesUpPhase
│       │   ├── routers/
│       │   │   └── rooms.py          # REST: POST /rooms, GET /rooms/{id}
│       │   ├── services/
│       │   │   ├── room_service.py   # Room CRUD in Redis
│       │   │   └── game_service.py   # Game orchestration
│       │   ├── sockets/
│       │   │   ├── room.py           # Events: room:join, room:leave
│       │   │   └── game.py           # Events: game:start, card_guessed, card_passed
│       │   └── games/
│       │       └── times_up/
│       │           ├── engine.py     # Complete Time's Up game logic
│       │           ├── cards.py      # Default card deck
│       │           └── config.py     # Game configuration
│       ├── tests/
│       │   ├── conftest.py           # Fixtures: HTTP client, mock Redis
│       │   ├── test_health.py        # Test for /health endpoint
│       │   ├── test_rooms.py         # Tests for Room model and REST API
│       │   ├── test_times_up.py      # Tests for the Time's Up engine
│       │   └── test_room_service.py  # Tests for the room service
│       ├── Dockerfile
│       ├── pyproject.toml            # Dependencies managed by Poetry
│       ├── poetry.lock               # Pinned dependency versions
│       └── .env.example
│
├── infra/                            # Infrastructure (AWS CDK — future phase)
├── Makefile                          # Developer shortcuts (install, dev, test, lint...)
├── docker-compose.yml                # Postgres + Redis for local development
└── .gitignore
```

---

## How to Run Locally

### Prerequisites

- **Docker** and **Docker Compose** installed
- **Python 3.11+**
- **Node.js 18+** and **npm**
- **Poetry 2.x** — `pip install poetry`

### 1. Clone the repository

```bash
git clone https://github.com/javisanxe/dynamizer.git
cd dynamizer
```

### 2. Install all dependencies

```bash
make install
```

This creates the Python virtual environment via Poetry, installs backend and frontend dependencies, and copies `.env` files from their examples.

### 3. Start Postgres and Redis

```bash
make up
```

This starts:
- PostgreSQL on `localhost:5432` (user: `dynamizer`, password: `dynamizer`, db: `dynamizer`)
- Redis on `localhost:6379`

### 4. Start the development servers

In separate terminals:

```bash
make dev-api   # backend  → http://localhost:8000
make dev-web   # frontend → http://localhost:3000
```

Or both at once:

```bash
make dev
```

Both servers support hot-reload — changes are reflected immediately without restarting.

The backend is also available at:
- Interactive docs: http://localhost:8000/docs
- Health check: http://localhost:8000/health

---

## Makefile Reference

```
make install        # install all dependencies (backend + frontend)
make up / down      # start / stop Docker Compose (Postgres + Redis)
make logs           # follow Docker Compose logs (all services)
make logs-api       # follow API logs only (Docker)

make dev            # start backend + frontend in parallel
make dev-api        # start FastAPI only (port 8000)
make dev-web        # start Next.js only (port 3000)

make test           # run all tests
make test-api       # run backend tests (pytest)
make test-api-logs  # run backend tests with DEBUG log output
make test-web       # run frontend tests (Jest)
make test-cov       # run all tests with coverage report

make redis          # open Redis CLI (requires make up)

make lint           # run ruff + ESLint
make format         # format backend code with ruff
make clean          # remove build artifacts and caches

make help           # list all available targets
```

---

## Debugging

### API logs

The API emits structured, colour-coded logs to stdout. To see them in real time, run the API in a dedicated terminal:

```bash
make dev-api
```

Each line has the format `HH:MM:SS  LVL  module  message`:

```
14:03:22  INF  app.sockets.room  room:join new player room=ABC01 player=p1 name=Javi
14:03:24  INF  app.sockets.game  game:start room=ABC01 game=tic_tac_toe players=2
14:03:31  INF  app.sockets.game  game:finished room=ABC01 winner=p1
14:03:31  INF  app.main  GET /api/rooms/ABC01 200  3ms
```

If the API runs via Docker, use `make logs-api` instead.

### Inspecting Redis

```bash
make redis          # opens redis-cli
```

Useful commands inside:

```
KEYS *                  # list all keys
GET room:ABC01          # read a room
GET game_state:ABC01    # read a game state
TTL room:ABC01          # check expiry (rooms expire after 6 hours of inactivity)
FLUSHALL                # wipe everything (local dev only)
```

---

## Game Flow

```
1. HOST creates room
   POST /api/rooms/ → { room_id, player_id, qr_url }
   Redirects to /room/{id}
   QR is generated with the room URL

2. PLAYERS scan QR
   Access /room/{id}
   Enter name + emoji
   Emit → room:join { room_id, name, emoji }
   Receive ← room:joined { player_id }  (saved to localStorage)
   Everyone receives ← room:updated { ...room }

3. HOST starts the game
    (button visible only to the host when there are ≥1 players)
   Emits → game:start { room_id, player_id }
   Everyone receives ← game:started { ...game_state }
   Everyone redirects to /room/{id}/play

4. ACTIVE TURN
   The player whose turn it is describes/acts
   For each card guessed:
     Emits → game:card_guessed { room_id, player_id, card_id }
     Everyone receives ← game:updated
   For each card passed (round 1 only):
     Emits → game:card_passed { room_id, player_id, card_id }
   When time runs out → game:turn_ended (emitted by backend via timer)

5. END OF ROUND
   When the deck empties → automatically advance to the next phase
   The deck is reset with all the cards from the previous round
   Round 1 → Round 2 → Round 3 → END

6. END OF GAME
   Everyone receives ← game:finished { leaderboard }
   Final ranking is shown
```

---

## WebSocket Events

### Events emitted by the CLIENT

| Event | Payload | Description |
|---|---|---|
| `room:join` | `{ room_id, name, emoji }` | Join an existing room |
| `room:leave` | `{ room_id, player_id }` | Leave the room |
| `game:start` | `{ room_id, player_id }` | Start the game (host only) |
| `game:card_guessed` | `{ room_id, player_id, card_id }` | Mark a card as guessed |
| `game:card_passed` | `{ room_id, player_id, card_id }` | Pass a card to the end of the deck (round 1) |

### Events received by the CLIENT

| Event | Payload | Description |
|---|---|---|
| `room:joined` | `{ player_id }` | Confirmation that you have joined |
| `room:updated` | `Room` | Updated room state (players, status) |
| `game:started` | `GameState` | Initial game state when starting |
| `game:updated` | `GameState` | Updated state after each action |
| `game:finished` | `{ leaderboard }` | End of game with ranking |
| `error` | `{ message }` | Server error |

---

## How to Add a New Game

The system is designed to be extensible. To add a new game:

### 1. Create the game engine

```
apps/api/app/games/
└── my_game/
    ├── __init__.py
    ├── engine.py     # MyGameEngine class with methods: initialize(), ...
    ├── config.py     # Game-specific configuration
    └── cards.py      # Game data (cards, questions, etc.)
```

The engine must implement at least:

```python
class MyGameEngine:
    def initialize(self, room: Room, config=None) -> GameState:
        ...

    def next_turn(self, state: GameState) -> GameState:
        ...

    def leaderboard(self, state: GameState) -> list[dict]:
        ...
```

### 2. Register the engine

In `apps/api/app/services/game_service.py`:

```python
from app.games.my_game.engine import MyGameEngine

GAME_ENGINES = {
    "times_up": TimesUpEngine,
    "my_game": MyGameEngine,   # add here
}
```

### 3. Add UI components in the frontend

```
apps/web/src/components/games/
└── my-game/
    ├── MyGameView.tsx
    └── MyGameTurn.tsx
```

### 4. Write tests

```
apps/api/tests/test_my_game.py
```

---

## Roadmap

### Phase 1 — MVP (current)
- [x] Project structure
- [x] Time's Up engine (3 rounds)
- [x] Real-time rooms with WebSocket
- [x] QR code to join a room
- [x] Unit tests for backend and frontend
- [ ] Complete game UI (active turn, timer, cards)
- [ ] Leaderboard at the end of the game

### Phase 2 — Product
- [ ] Server-managed turn timer
- [ ] More games (Who am I?, Pictionary, Trivia...)
- [ ] Customizable room settings (time, cards, teams)
- [ ] Game persistence in PostgreSQL
- [ ] Global historical leaderboard

### Phase 3 — Scale
- [ ] Deploy on AWS (ECS Fargate + RDS + ElastiCache)
- [ ] CI/CD with GitHub Actions
- [ ] Terraform for infrastructure as code
- [ ] Support for multiple backend instances via Redis Pub/Sub
- [ ] PWA for mobile installation
