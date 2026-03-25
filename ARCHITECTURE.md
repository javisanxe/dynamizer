# Architecture & Codebase Guide

This document is the reference for anyone working on Dynamizer for the first time, or jumping into a part of the codebase they haven't touched before. The goal is not just to describe the structure, but to explain **why** things are built the way they are, so you can make changes confidently without breaking things you didn't intend to.

---

## Table of Contents

- [How the system works (big picture)](#how-the-system-works-big-picture)
- [Backend — `apps/api/`](#backend--appsapi)
  - [Key concepts](#key-concepts-backend)
  - [Folder map](#folder-map-backend)
  - [File-by-file reference](#file-by-file-reference)
  - [How to add a new game](#how-to-add-a-new-game)
- [Frontend — `apps/web/`](#frontend--appsweb)
  - [Key concepts](#key-concepts-frontend)
  - [Folder map](#folder-map-frontend)
  - [File-by-file reference](#file-by-file-reference-1)
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

FastAPI is a Python web framework for building HTTP APIs. You define an endpoint like this:

```python
@router.get("/{room_id}")
async def get_room(room_id: str):
    room = await service.get_room(room_id)
    return room
```

REST endpoints in this project are only used for operations that happen **before** entering a room: creating a room (`POST /api/rooms/`) and reading its initial data (`GET /api/rooms/{id}`). Everything that happens during a game goes through WebSockets instead.

#### Socket.IO and WebSockets

HTTP works as request → response: the client asks, the server answers, the connection closes. That model does not work for a real-time game where the server needs to push updates to everyone in the room without them asking.

Socket.IO is a library that keeps a persistent bidirectional connection open between each client and the server. When player A makes a move, the backend can immediately push the updated state to players B, C, and D without them sending any request.

Events flow both ways:

```
client → server:   emit("game:make_move", { room_id, player_id, cell_index })
server → clients:  emit("game:updated",   { ...game_state })   (broadcast to whole room)
server → one client: emit("error", { message })                (only to the sender)
```

In this project, each room has its own Socket.IO **room** (a channel). When the backend wants to update everyone in a game, it broadcasts to that channel, not to every connected client in the world.

#### Pydantic models

Pydantic is a library that defines data shapes using Python classes. It validates that incoming data has the right types and provides easy JSON serialisation.

```python
class Player(BaseModel):
    id: str = Field(default_factory=lambda: ...)
    name: str
    score: int = 0
```

When the backend reads a room from Redis (stored as a JSON string), it calls `Room.model_validate_json(data)` and gets a fully-typed Python object back. When saving, `room.model_dump_json()` converts it back to a string. No manual JSON parsing anywhere.

The models in `app/models/` are the **single source of truth** for what a room or game state looks like. If you add a field here, it's automatically included when saving to Redis and when sending to the frontend.

#### Redis

Redis is an in-memory key-value store. Think of it as a very fast dictionary that lives outside the Python process and survives restarts.

In this project it stores two types of keys:

| Key | Value | TTL |
|---|---|---|
| `room:{id}` | JSON of a `Room` object | 6 hours |
| `game_state:{id}` | JSON of a `GameState` object | 6 hours |

The 6-hour TTL means abandoned rooms are cleaned up automatically. You can inspect the current data with `make redis` → `KEYS *`.

---

### Folder map (backend)

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

A socket handler never writes to Redis directly — it calls a service. A game engine never touches Redis — the service does that after calling the engine. This separation means you can test the game logic without mocking anything.

---

### File-by-file reference

#### `app/main.py`

The startup file. It:
1. Calls `setup_logging()` (must happen before anything else logs)
2. Creates the FastAPI app and adds middleware (CORS, HTTP logging)
3. Creates the Socket.IO server
4. Registers all socket event handlers
5. Wraps everything into a single ASGI app that uvicorn runs

**You touch this file when**: adding a new router, changing CORS settings, or adding a new middleware. You do not put business logic here.

---

#### `app/config.py`

Reads environment variables (from `.env` in local dev) and exposes them as a typed `settings` object. Import it anywhere with:

```python
from app.config import settings
settings.redis_url   # → "redis://localhost:6379"
settings.app_env     # → "development"
```

**You touch this file when**: adding a new environment variable. Define it here, add it to `.env.example`, and read it via `settings.` everywhere else — never `os.environ.get()` directly.

---

#### `app/models/room.py`

Defines `Player`, `RoomConfig`, `Room`, and the `RoomStatus` enum. These are pure data containers — no methods that make HTTP calls or touch Redis.

The two helpers on `Room` (`get_player_by_id`, `is_full`) are fine because they only operate on the object's own data.

**You touch this file when**: adding a field to a player or room (e.g. an avatar URL, a `ready` flag). Remember: any new field will automatically flow to Redis and to the frontend via `model_dump()`.

---

#### `app/models/game.py`

Defines `GameState` — a single model that holds the state of any game. It has fields for both Times Up and Tic-Tac-Toe on the same model. This is a pragmatic choice for an early-stage project: one model, easy to serialise, no complex inheritance.

The `game` field (e.g. `"tic_tac_toe"`) is the key the services use to dispatch to the right engine.

**You touch this file when**: a new game needs new state fields that don't fit in the existing model, or you add a new game type.

---

#### `app/routers/rooms.py`

Two HTTP endpoints: create room and get room. Each one validates input, delegates to `RoomService`, and returns the result. No game logic here.

**You touch this file when**: adding a new REST endpoint (e.g. `DELETE /api/rooms/{id}`).

---

#### `app/services/room_service.py`

The only place in the codebase that reads and writes `room:{id}` keys in Redis. Exposes `save_room`, `get_room`, `delete_room`, `room_exists`.

**You touch this file when**: changing how rooms are persisted, the TTL, or adding a new query (e.g. `list_rooms`).

---

#### `app/services/game_service.py`

Orchestrates game actions: picks the right engine from the `GAME_ENGINES` registry, calls it, and persists the result to Redis. Also exposes `load_state` and `save_state` for `game_state:{id}` keys.

**You touch this file when**: adding a new game engine (register it in `GAME_ENGINES`), or changing game state persistence.

---

#### `app/sockets/room.py`

Handles room-related socket events: `connect`, `disconnect`, `room:join`, `room:leave`.

The `room:join` handler has two paths:
- **Reconnection**: the client sends a `player_id` that already exists in the room (e.g. page refresh). The handler reuses the existing player and resends the current state.
- **New join**: a new `Player` is created, added to the room, and the updated room is broadcast to everyone.

All handlers are wrapped in `try/except` — unhandled errors are logged with a full traceback and an `error` event is sent to the client. Without this, python-socketio silently swallows exceptions.

**You touch this file when**: adding a new room-lifecycle event (e.g. `room:kick`).

---

#### `app/sockets/game.py`

Handles game-related socket events: `game:start`, `game:make_move`, `game:card_guessed`, `game:card_passed`.

After a move, if `state.finished` is `True`, the handler resets the room status to `waiting` and emits `game:finished` so all clients can show the result and navigate back to the lobby.

**You touch this file when**: adding a new in-game socket event, or wiring up game logic that was previously a stub (e.g. Times Up card events).

---

#### `app/logging_config.py`

Called once at startup from `main.py`. Sets up coloured output in development (`DEBUG` level) and plain output in production (`INFO` level). Silences noisy libraries (socketio, engineio, asyncio, uvicorn.access).

To add a log line anywhere in the backend:

```python
import logging
logger = logging.getLogger(__name__)

logger.debug("make_move room=%s player=%s cell=%s", room_id, player_id, cell_index)
logger.error("something broke", exc_info=True)  # exc_info=True prints the traceback
```

**You touch this file when**: adjusting log levels for specific libraries, or changing the output format.

---

#### `app/games/`

Each game is a self-contained package with an `engine.py`. The engine is a plain Python class with no dependencies on Redis, HTTP, or sockets. It receives a `Room` or `GameState`, performs pure computation, and returns a new `GameState`.

**Contract every engine must implement**:

```python
class MyGameEngine:
    def initialize(self, room: Room) -> GameState:
        # Called once when the game starts. Returns the initial state.
        ...

    def make_move(self, state: GameState, player_id: str, ...) -> GameState:
        # Validates and applies a move. Raises ValueError on invalid moves.
        # Sets state.finished = True when the game ends.
        ...

    def leaderboard(self, state: GameState) -> list[dict]:
        # Returns [{ "player_id": ..., "points": ..., "rank": ... }]
        # sorted by rank (winner first).
        ...
```

Because engines have no I/O, they are trivial to test — no mocks needed.

---

### How to add a new game

1. Create `apps/api/app/games/my_game/engine.py` implementing the contract above
2. Register it in `game_service.py`:
   ```python
   GAME_ENGINES = {
       "times_up": TimesUpEngine,
       "tic_tac_toe": TicTacToeEngine,
       "my_game": MyGameEngine,   # ← add here
   }
   ```
3. Add the game slug to `RoomConfig` allowed values in `models/room.py` if needed
4. Wire up any new socket events in `sockets/game.py`
5. Add tests in `tests/test_my_game.py`
6. Add the UI component in `apps/web/src/components/` and branch on `room.config.game` in the play page

---

## Frontend — `apps/web/`

### Key concepts (frontend)

#### Next.js App Router and file-based routing

Next.js maps folders to URL routes automatically. A file at `src/app/room/[id]/page.tsx` becomes the page at `/room/ABC01`. The `[id]` in brackets means it's a dynamic segment — Next.js passes its value as a prop to the component.

You never configure routes manually. If you want a new page at `/settings`, create `src/app/settings/page.tsx`.

#### React hooks

A hook is a function that starts with `use` and lets a component hold state or run side effects. The two built-in hooks you'll see everywhere are:

```typescript
const [value, setValue] = useState(initialValue)   // state: triggers re-render on change
useEffect(() => { /* runs after render */ }, [dep]) // side effect: fetch, subscribe, etc.
```

In this project there are two custom hooks that encapsulate all the complex logic so pages stay simple:

- `useSocket` — manages the socket.io connection
- `useGame` — uses `useSocket` internally and manages all game state

A page component should mostly just call `useGame()`, destructure what it needs, and render. It should not manage socket events directly.

#### TypeScript and why the types matter here

TypeScript adds compile-time type checking to JavaScript. In this project it's especially important for socket events: a typo in an event name or the wrong payload shape would cause a silent runtime bug that's hard to track down.

The types in `src/types/` mirror the Python models. When the backend changes a field name, the TypeScript compiler will tell you every place in the frontend that breaks.

---

### Folder map (frontend)

```
apps/web/src/
├── app/              Pages. Each folder = one URL route.
│   └── room/[id]/
│       ├── page.tsx          /room/ABC01   → lobby
│       └── play/page.tsx     /room/ABC01/play → game
│
├── components/       Reusable UI pieces. No routing logic, no direct socket calls.
│
├── hooks/            Logic with state. The socket and game protocol live here.
│
└── types/            TypeScript interfaces. Mirror of the Python models.
```

**The rule that matters**: components do not call `socket.emit()` directly. They receive callbacks as props (`onMove`, `onPlayAgain`) that the page or hook provides. This makes components testable in isolation — you just pass a mock function as the prop.

---

### File-by-file reference

#### `app/page.tsx` — Home

The landing page. Lets the user:
- Enter a name and pick an emoji
- Choose a game type (Times Up / Tic-Tac-Toe)
- Create a new room (`POST /api/rooms/`) → redirects to `/room/{id}`
- Or join an existing room by typing a code → redirects to `/room/{id}`

On successful room creation, the server-assigned `player_id` is saved to `localStorage` under the key `player_{roomId}`.

**You touch this file when**: adding a new game to the selector, or changing the join/create flow.

---

#### `app/room/[id]/page.tsx` — Lobby

The waiting room. This is where players see the QR code, watch others join, and the host starts the game.

On mount it:
1. Reads `playerId` from `localStorage` (key `player_{roomId}`) or from `?pid=` in the URL
2. Connects via `useGame` and emits `room:join`
3. Listens for `room:updated` to refresh the player list
4. Redirects everyone to `/play` when `room.status === "playing"`

The "Start game" button is only shown to the host and is disabled until the minimum player count for the selected game is met.

**You touch this file when**: changing the lobby UI, the start-game validation rules, or the reconnection logic.

---

#### `app/room/[id]/play/page.tsx` — Play

The in-game screen. On mount it reconnects to the socket room (using the same `?pid=` or `localStorage` pattern as the lobby) and renders the right game component based on `room.config.game`:

```typescript
if (room.config.game === "tic_tac_toe") return <TicTacToePlay ... />
// else: Times Up placeholder
```

**You touch this file when**: adding a new game's UI component, or changing what happens after a game ends.

---

#### `hooks/useSocket.ts`

Creates and owns a single `socket.io-client` connection. Exposes:

```typescript
const { socket, status, emit, on, off } = useSocket()
```

`status` can be `"connecting"`, `"connected"`, `"disconnected"`, or `"error"` — useful for showing a connection indicator in the UI.

**Important**: this hook creates a new socket on every component mount. It is not a global singleton. Each page that calls `useSocket` (or `useGame`) has its own connection. This is intentional — it avoids stale connections persisting across navigation.

**You touch this file when**: changing connection options (timeout, transports, auth).

---

#### `hooks/useGame.ts`

The main hook that drives the entire game protocol. It:
1. Creates a socket via `useSocket`
2. Subscribes to all server events: `room:updated`, `room:joined`, `game:started`, `game:updated`, `game:finished`, `error`
3. Exposes state: `room`, `tttState`, `gameResult`, `playerId`, `error`
4. Exposes actions: `join`, `startGame`, `makeMove`, `cardGuessed`, `cardPassed`

Pages call this hook and pass the returned actions down to components as props. Components never import or call this hook directly.

**You touch this file when**: adding a new socket event subscription, a new game action, or new state that needs to persist across renders.

---

#### `types/room.ts`

TypeScript mirror of `app/models/room.py`. Contains `Player`, `RoomConfig`, `Room`, and `RoomStatus`.

If you add a field to the Python `Player` model, add it here too — otherwise TypeScript won't know it exists when the frontend receives a `room:updated` event.

---

#### `types/game.ts`

TypeScript mirror of the game-related parts of `app/models/game.py`. Contains `TicTacToeState` and `GameFinishedPayload`.

When you add a new game, add its state type here.

---

#### `types/events.ts`

Typed payload interfaces for every socket event the client **sends**. This is documentation as much as it is code — it makes it immediately clear what data each event requires.

```typescript
export interface GameMakeMovePayload {
  room_id: string
  player_id: string
  cell_index: number
}
```

**You touch this file when**: adding a new socket event that the client emits.

---

#### `components/TicTacToePlay.tsx`

The complete Tic-Tac-Toe game UI. Receives all data and callbacks as props:

```typescript
<TicTacToePlay
  state={tttState}
  room={room}
  playerId={playerId}
  onMove={(cellIndex) => makeMove(cellIndex)}
  onPlayAgain={() => router.push(`/room/${roomId}?pid=${playerId}`)}
/>
```

It does not know about sockets or Redux. It just renders state and calls callbacks. This makes it fully testable with React Testing Library — you pass a mock `onMove` and assert it was called with the right index.

**You touch this file when**: changing the board UI, the result overlay, or the winning-cell highlight logic.

---

#### `components/EmojiPicker.tsx`

A dropdown grid of ~90 emojis. Controlled component: receives a `value` and an `onChange` callback. Closes on outside click via a `mousedown` listener on `document`.

**You touch this file when**: adding more emojis or changing the picker layout.

---

### How a move travels through the system

Concrete example: player clicks cell 4 in Tic-Tac-Toe.

```
1. TicTacToePlay
   User clicks cell 4 → calls onMove(4)

2. play/page.tsx
   onMove={makeMove} → makeMove(4)

3. useGame.ts — makeMove()
   socket.emit("game:make_move", { room_id, player_id, cell_index: 4 })

4. sockets/game.py — make_move()
   Loads room and game state from Redis
   Calls TicTacToeEngine.make_move(state, player_id, 4)

5. games/tic_tac_toe/engine.py — make_move()
   Validates: is it this player's turn? Is cell 4 empty?
   Places the piece: board[4] = player_id
   Checks all 8 winning lines → no winner yet
   Returns updated GameState

6. sockets/game.py (continued)
   Saves updated GameState to Redis
   Broadcasts: sio.emit("game:updated", state.model_dump(), room=room_id)

7. useGame.ts — on("game:updated")
   Updates tttState in React state → triggers re-render

8. TicTacToePlay
   Receives new state as prop → renders board with piece in cell 4
   turn indicator updates to the other player
```

If step 5 raises a `ValueError` (e.g. cell already occupied), step 6 emits an `error` event instead, and step 7 updates the `error` state in `useGame` — the component can then show the message.

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

The `conftest.py` provides two shared fixtures:
- `client` — an async HTTP client mounted on the ASGI app (no real server needed)
- `mock_redis` — patches `aioredis.from_url` so tests never touch a real Redis

Game engine tests need neither fixture — they just instantiate the engine and call methods.

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

Components are tested in isolation — socket calls are mocked. The tests assert on what the user sees (rendered text, disabled buttons) and on what callbacks are called, not on implementation details.

```bash
make test-web    # run all frontend tests
```

---

## Logging and debugging

### Seeing API logs

Run the API in a dedicated terminal. Logs are coloured and structured:

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
