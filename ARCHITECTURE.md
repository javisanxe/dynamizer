# Architecture & Codebase Guide

This document is the reference for anyone working on Dynamizer for the first time, or jumping into a part of the codebase they haven't touched before. The goal is not just to describe the structure, but to explain **why** things are built the way they are, so you can make changes confidently without breaking things you didn't intend to.

---

## Table of Contents

- [How the system works (big picture)](#how-the-system-works-big-picture)
- [Backend — `apps/api/`](#backend--appsapi)
  - [Key concepts](#key-concepts-backend)
  - [Folder map and responsibilities](#folder-map-and-responsibilities)
  - [How to add a new game](#how-to-add-a-new-game)
- [Frontend — `apps/web/`](#frontend--appsweb)
  - [Key concepts](#key-concepts-frontend)
  - [Folder map and responsibilities](#folder-map-and-responsibilities-1)
  - [How a move travels through the system](#how-a-move-travels-through-the-system)
- [Tests](#tests)
- [Logging and debugging](#logging-and-debugging)

---

## How the system works (big picture)

```
Browser (Next.js)
      │
      │  HTTP (REST)         POST /api/rooms/  → create room
      │                      GET  /api/rooms/{id} → read room
      │
      │  WebSocket           room:join, game:start, game:make_move ...
      │  (Socket.IO)         room:updated, game:started, game:finished ...
      ▼
FastAPI + python-socketio (Python)
      │
      │  read/write JSON
      ▼
Redis  (room:{id}  +  game_state:{id}  — TTL 6h)
```

The key design decision: **the entire live game state lives in Redis, not in memory**. This means if the API process restarts, no data is lost. It also means two instances of the API could run in parallel (future scaling) since they both read/write the same Redis.

The **frontend never holds the authoritative state**. Every action (join, move, leave) is sent to the backend via a socket event. The backend updates Redis, then broadcasts the new state to all players in the room. The frontend only renders what it receives.

---

## Backend — `apps/api/`

### Key concepts (backend)

#### FastAPI and REST

FastAPI is a Python web framework for building HTTP APIs. You define a function and decorate it with the HTTP method and path — FastAPI handles the rest (parsing, validation, serialisation).

REST endpoints in this project are only used for operations that happen **before** entering a room: creating a room and reading its initial data. Everything that happens during a game goes through WebSockets instead, because REST is request/response and cannot push updates to multiple clients simultaneously.

#### Socket.IO and WebSockets

HTTP works as request → response: the client asks, the server answers, the connection closes. That model does not work for a real-time game where the server needs to push updates to everyone in the room without them asking.

Socket.IO keeps a persistent bidirectional connection open between each client and the server. When player A makes a move, the backend immediately pushes the updated state to players B, C, and D without them sending any request.

Events flow both ways:

```
client → server:     emit("game:make_move", { room_id, player_id, cell_index })
server → all room:   emit("game:updated",   { ...game_state })
server → one client: emit("error",          { message })
```

In this project, each room has its own Socket.IO **channel**. When the backend wants to update everyone in a game, it broadcasts to that channel only — not to every connected client in the world.

#### Pydantic models

Pydantic is a library that defines data shapes as Python classes and validates that data matches those shapes automatically. When the backend reads a room from Redis (stored as a JSON string), Pydantic parses it into a fully-typed Python object. When saving, it converts it back to a JSON string. No manual parsing anywhere.

The models in `app/models/` are the **single source of truth** for what a room or game state looks like. If you add a field to a model, it is automatically included when saving to Redis and when sending payloads to the frontend.

#### Redis

Redis is an in-memory key-value store. Think of it as a very fast dictionary that lives outside the Python process and survives restarts.

In this project it stores two types of keys:

| Key | Value | TTL |
|---|---|---|
| `room:{id}` | JSON of a `Room` object | 6 hours |
| `game_state:{id}` | JSON of a `GameState` object | 6 hours |

The 6-hour TTL means abandoned rooms are cleaned up automatically. You can inspect the current data live with `make redis` → `KEYS *`.

---

### Folder map and responsibilities (backend)

```
apps/api/
├── app/
│   ├── main.py           Entry point. Wires everything together.
│   ├── config.py         All environment config (Redis URL, CORS, etc.)
│   ├── logging_config.py Logging setup. Touched once, rarely again.
│   │
│   ├── models/           Data shapes only. No logic, no I/O.
│   ├── routers/          HTTP endpoints only. No business logic.
│   ├── services/         Business logic + Redis access.
│   ├── sockets/          WebSocket event handlers.
│   └── games/            Pure game logic. No I/O, no Redis, no socket.
│
└── tests/                One file per module under test.
```

**The rule that matters**: each layer only talks to the layer below it.

```
sockets/  →  services/  →  models/
routers/  →  services/  →  models/
games/    →  models/    (no Redis, no socket, no HTTP)
```

A socket handler never writes to Redis directly — it calls a service. A game engine never touches Redis — the service does that after calling the engine. This separation means you can test the entire game logic without mocking anything.

**`models/`** — Pure data containers. Add a field here and it flows everywhere automatically (Redis, socket payloads, HTTP responses). Never put I/O or business logic here.

**`routers/`** — HTTP endpoints. Validate input, call a service, return a response. Nothing else.

**`services/`** — The business logic layer. The only place allowed to read/write Redis. Called by both routers and socket handlers.

**`sockets/`** — WebSocket event handlers. Receive an event, call services, broadcast results. All handlers are wrapped in `try/except` so exceptions are logged instead of being silently swallowed by python-socketio.

**`games/`** — One package per game, each with an `engine.py`. Engines are pure Python classes: they receive a room or game state, compute the next state, and return it. No I/O of any kind. Because of this they are trivial to unit test — no mocks needed.

---

### How to add a new game

1. Create `apps/api/app/games/my_game/engine.py` with an engine class that implements `initialize(room)`, `make_move(state, ...)`, and `leaderboard(state)`. Look at `tic_tac_toe/engine.py` as the reference.
2. Register the engine in `game_service.py` by adding it to the `GAME_ENGINES` dict.
3. Add any new state fields the game needs to `models/game.py`.
4. Wire up new socket events in `sockets/game.py` if the game needs them.
5. Add tests in `tests/test_my_game.py`.
6. Add the UI component in `apps/web/src/components/` and branch on `room.config.game` in the play page.

---

## Frontend — `apps/web/`

### Key concepts (frontend)

#### Next.js App Router and file-based routing

Next.js maps the folder structure under `src/app/` to URL routes automatically. A file at `src/app/room/[id]/page.tsx` becomes the page rendered at `/room/ABC01`. The `[id]` in brackets is a dynamic segment — its value is passed as a prop to the component.

You never configure routes manually. Adding a new page means creating a new `page.tsx` file in the right folder.

#### React hooks

A hook is a function whose name starts with `use`. It lets a component hold state that persists across renders, or run side effects (network calls, subscriptions, timers) in a controlled way.

In this project there are two custom hooks that encapsulate all the complex logic so pages stay simple:

- `useSocket` — creates and manages the socket.io connection lifecycle.
- `useGame` — builds on `useSocket` and manages all game state: subscribes to server events, holds `room`, `tttState`, `gameResult`, and exposes action functions like `join`, `makeMove`, `startGame`.

A page component should mostly just call `useGame()`, destructure what it needs, and render. It should not manage socket events directly.

#### TypeScript and why the types matter here

TypeScript adds compile-time type checking to JavaScript. In this project it is especially important for socket events: a typo in an event name or the wrong payload shape would cause a silent runtime bug. With typed payloads, the compiler catches it before the code runs.

The types in `src/types/` mirror the Python models. When the backend changes a field name, the TypeScript compiler will flag every place in the frontend that breaks.

---

### Folder map and responsibilities (frontend)

```
apps/web/src/
├── app/              Pages. Each folder = one URL route.
│   ├── page.tsx               /           → home (create/join room)
│   └── room/[id]/
│       ├── page.tsx           /room/ABC01       → lobby
│       └── play/page.tsx      /room/ABC01/play  → in-game
│
├── components/       Reusable UI pieces. No routing logic, no direct socket calls.
│
├── hooks/            Logic with state. The socket connection and game protocol live here.
│
└── types/            TypeScript interfaces. Mirror of the Python models.
```

**The rule that matters**: components do not call `socket.emit()` directly. They receive data and callbacks as props (`onMove`, `onPlayAgain`) that the page or hook provides. This keeps components decoupled from the network layer and makes them easy to test in isolation — you just pass a mock function as the prop and assert it was called correctly.

**`app/`** — Pages are thin. They read identity from `localStorage` or URL params, call `useGame`, and pass state and actions down to components.

**`components/`** — Presentational. A component renders what it receives and calls the callbacks it is given. It does not know whether those callbacks go to a real socket or a Jest mock.

**`hooks/`** — Where the complexity lives. If you need to subscribe to a new socket event or add a new game action, this is where it goes — not in the page and not in the component.

**`types/`** — Kept in sync with the Python models manually. If a model changes on the backend, update the corresponding type here too.

---

### How a move travels through the system

Concrete example: player clicks cell 4 in Tic-Tac-Toe.

```
1. TicTacToePlay  (component)
   User clicks cell 4 → calls onMove(4)

2. play/page.tsx  (page)
   onMove is wired to makeMove from useGame → makeMove(4)

3. useGame.ts  (hook)
   Emits socket event: game:make_move { room_id, player_id, cell_index: 4 }

4. sockets/game.py  (socket handler)
   Loads room and game state from Redis
   Calls TicTacToeEngine.make_move(state, player_id, 4)

5. games/tic_tac_toe/engine.py  (pure logic)
   Validates: is it this player's turn? Is cell 4 empty?
   Places the piece on the board
   Checks all winning lines → no winner yet
   Returns updated GameState

6. sockets/game.py  (continued)
   Saves updated GameState to Redis
   Broadcasts game:updated to everyone in the room

7. useGame.ts  (hook, all connected clients)
   Receives game:updated → updates tttState in React state → re-render

8. TicTacToePlay  (component)
   Receives new state as prop → renders board with piece in cell 4
   Turn indicator updates to the other player
```

If step 5 raises a validation error (e.g. cell already occupied), step 6 emits an `error` event to the sender only, and step 7 updates the `error` state in `useGame` so the component can display the message.

---

## Tests

### Backend (`apps/api/tests/`)

One test file per module. The naming convention is `test_{module}.py`.

| File | What it tests |
|---|---|
| `test_health.py` | `/health` endpoint smoke test |
| `test_rooms.py` | `Room` model, REST endpoints, `room:join` socket handler |
| `test_room_service.py` | `RoomService` CRUD against mocked Redis |
| `test_times_up.py` | `TimesUpEngine` — all game logic |
| `test_tic_tac_toe.py` | `TicTacToeEngine` — all game logic |

`conftest.py` provides two shared fixtures used across integration tests:
- `client` — an async HTTP client mounted on the ASGI app (no real server needed)
- `mock_redis` — patches the Redis client so tests never touch a real Redis instance

Game engine tests need neither fixture — they just instantiate the engine and call methods directly.

```bash
make test-api          # run all backend tests
make test-api-logs     # run with DEBUG log output (useful for diagnosing a failing test)
```

### Frontend (`apps/web/src/`)

Tests live next to the code they test, in `__tests__/` folders.

| File | What it tests |
|---|---|
| `app/__tests__/page.test.tsx` | Home page create/join flow |
| `app/__tests__/playPage.test.tsx` | Play page rendering and reconnection |
| `components/__tests__/TicTacToePlay.test.tsx` | Board UI, move callbacks, overlays |
| `hooks/__tests__/useSocket.test.ts` | Socket connection lifecycle |
| `hooks/__tests__/useGame.test.ts` | Game event handling and state updates |

Components are tested in isolation — socket calls are mocked. Tests assert on what the user sees (rendered text, disabled buttons) and on which callbacks are called, not on implementation internals.

```bash
make test-web    # run all frontend tests
```

---

## Logging and debugging

### Seeing API logs

Run the API in a dedicated terminal. Logs are colour-coded and structured:

```bash
make dev-api
```

```
14:03:21  INF  app.main            POST /api/rooms/ 200  12ms
14:03:22  INF  app.sockets.room    room:join new player room=ABC01 player=p1 name=Javi
14:03:24  INF  app.sockets.game    game:start room=ABC01 game=tic_tac_toe players=2
14:03:31  INF  app.sockets.game    game:finished room=ABC01 winner=p1
14:03:45  ERR  app.sockets.game    game:make_move unhandled error ...
                                   Traceback (most recent call last): ...
```

Levels: `DBG` (debug), `INF` (info), `WRN` (warning), `ERR` (error).

If the API runs via Docker: `make logs-api`.

To see log output while running tests: `make test-api-logs`.

### Inspecting Redis

```bash
make redis    # opens redis-cli (requires make up)
```

```
KEYS *                   # list all keys
GET room:ABC01           # read a room as JSON
GET game_state:ABC01     # read a game state as JSON
TTL room:ABC01           # seconds until this key expires (-1 = no TTL, -2 = gone)
FLUSHALL                 # wipe everything (local dev only)
```

Rooms and game states expire automatically after 6 hours of inactivity (TTL set on every write in `room_service.py` and `game_service.py`).
