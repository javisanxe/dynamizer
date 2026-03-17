// Tipos de sala y jugador — espejo del modelo Python

export interface Jugador {
  id: string
  nombre: string
  emoji: string
  foto_url?: string
  puntuacion: number
  es_host: boolean
  conectado: boolean
}

export type EstadoSala = 'esperando' | 'en_juego' | 'terminada'

export interface ConfiguracionSala {
  juego: string
  max_jugadores: number
  tiempo_turno: number
  rondas: number
  cartas_por_jugador: number
}

export interface Sala {
  id: string
  estado: EstadoSala
  jugadores: Jugador[]
  configuracion: ConfiguracionSala
  host_id?: string
}
