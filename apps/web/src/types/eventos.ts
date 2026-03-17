// Tipos de eventos WebSocket — deben coincidir con el backend Python

// --- Eventos que EMITE el cliente ---

export interface SalaUnirsePayload {
  sala_id: string
  nombre: string
  emoji: string
}

export interface SalaSalirPayload {
  sala_id: string
  jugador_id: string
}

export interface JuegoIniciarPayload {
  sala_id: string
  jugador_id: string
}

export interface JuegoCartaAdiviadaPayload {
  sala_id: string
  jugador_id: string
  carta_id: string
}

export interface JuegoCartaPasadaPayload {
  sala_id: string
  jugador_id: string
  carta_id: string
}

// --- Eventos que RECIBE el cliente ---

export interface ErrorPayload {
  mensaje: string
}

export interface SalaUnidoPayload {
  jugador_id: string
}

// sala:actualizada devuelve el objeto Sala completo (ver sala.ts)
// juego:iniciado devuelve EstadoJuego completo

export type ClientToServerEvents = {
  'sala:unirse': (payload: SalaUnirsePayload) => void
  'sala:salir': (payload: SalaSalirPayload) => void
  'juego:iniciar': (payload: JuegoIniciarPayload) => void
  'juego:carta_adivinada': (payload: JuegoCartaAdiviadaPayload) => void
  'juego:carta_pasada': (payload: JuegoCartaPasadaPayload) => void
}
