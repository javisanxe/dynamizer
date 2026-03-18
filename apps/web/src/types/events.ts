// WebSocket event types — must match the Python backend

// --- Events EMITTED by the client ---

export interface RoomJoinPayload {
  room_id: string
  name: string
  emoji: string
}

export interface RoomLeavePayload {
  room_id: string
  player_id: string
}

export interface GameStartPayload {
  room_id: string
  player_id: string
}

export interface GameCardGuessedPayload {
  room_id: string
  player_id: string
  card_id: string
}

export interface GameCardPassedPayload {
  room_id: string
  player_id: string
  card_id: string
}

// --- Events RECEIVED by the client ---

export interface ErrorPayload {
  message: string
}

export interface RoomJoinedPayload {
  player_id: string
}

// room:updated returns the full Room object (see room.ts)
// game:started returns the full GameState

export type ClientToServerEvents = {
  'room:join': (payload: RoomJoinPayload) => void
  'room:leave': (payload: RoomLeavePayload) => void
  'game:start': (payload: GameStartPayload) => void
  'game:card_guessed': (payload: GameCardGuessedPayload) => void
  'game:card_passed': (payload: GameCardPassedPayload) => void
}
