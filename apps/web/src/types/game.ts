// Game state types — mirror of the Python backend models/game.py

// ── Tic-Tac-Toe ─────────────────────────────────────────────────────────────

/** 9 cells indexed 0-8 (row-major). Value is player_id or null (empty). */
export interface TicTacToeState {
  room_id: string
  game: 'tic_tac_toe'
  board: (string | null)[]
  current_player_id: string | null
  winner_id: string | null
  is_draw: boolean
  finished: boolean
  scores: Record<string, number>
}

export interface GameFinishedPayload {
  winner_id: string | null
  is_draw: boolean
  leaderboard: { player_id: string; points: number }[]
}
