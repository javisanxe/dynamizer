// Room and player types — mirrors the Python backend model

export interface Player {
  id: string
  name: string
  emoji: string
  photo_url?: string
  score: number
  is_host: boolean
  connected: boolean
}

export type RoomStatus = 'waiting' | 'playing' | 'finished'

export interface RoomConfig {
  game: string
  max_players: number
  turn_time: number
  rounds: number
  cards_per_player: number
}

export interface Room {
  id: string
  status: RoomStatus
  players: Player[]
  config: RoomConfig
  host_id?: string
}
