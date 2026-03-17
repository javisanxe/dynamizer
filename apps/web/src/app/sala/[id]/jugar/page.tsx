'use client'

import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useGame } from '@/hooks/useGame'

export default function JugarPage() {
  const params = useParams()
  const salaId = params.id as string
  const [jugadorId, setJugadorId] = useState<string>('')

  useEffect(() => {
    const id = localStorage.getItem('jugador_id') ?? ''
    setJugadorId(id)
  }, [])

  const { sala, error, socketStatus, cartaAdivinada, cartaPasada } = useGame(salaId, jugadorId)

  return (
    <main style={{ maxWidth: 480, margin: '0 auto', padding: '2rem' }}>
      <h1>En juego — Sala {salaId}</h1>
      <p>Socket: {socketStatus}</p>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {sala && (
        <section>
          <h2>Puntuaciones</h2>
          <ul>
            {sala.jugadores
              .sort((a, b) => b.puntuacion - a.puntuacion)
              .map((j) => (
                <li key={j.id}>
                  {j.emoji} {j.nombre}: {j.puntuacion} pts
                </li>
              ))}
          </ul>
        </section>
      )}

      <section>
        <p>Esperando turno...</p>
        {/* Los controles de turno se implementarán en la siguiente iteración */}
      </section>
    </main>
  )
}
