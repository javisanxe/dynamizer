'use client'

import { useEffect, useState } from 'react'
import { useSocket } from './useSocket'
import type { Sala } from '@/types/sala'

export function useGame(salaId: string, jugadorId: string) {
  const { emit, on, off, status } = useSocket()
  const [sala, setSala] = useState<Sala | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (status !== 'connected') return

    on<Sala>('sala:actualizada', (data) => setSala(data))
    on<{ mensaje: string }>('error', (data) => setError(data.mensaje))

    return () => {
      off('sala:actualizada')
      off('error')
    }
  }, [status, on, off])

  function unirse(nombre: string, emoji: string) {
    emit('sala:unirse', { sala_id: salaId, nombre, emoji })
  }

  function iniciarJuego() {
    emit('juego:iniciar', { sala_id: salaId, jugador_id: jugadorId })
  }

  function cartaAdivinada(cartaId: string) {
    emit('juego:carta_adivinada', { sala_id: salaId, jugador_id: jugadorId, carta_id: cartaId })
  }

  function cartaPasada(cartaId: string) {
    emit('juego:carta_pasada', { sala_id: salaId, jugador_id: jugadorId, carta_id: cartaId })
  }

  return { sala, error, socketStatus: status, unirse, iniciarJuego, cartaAdivinada, cartaPasada }
}
