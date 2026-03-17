'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { QRCodeSVG } from 'qrcode.react'
import { useGame } from '@/hooks/useGame'

export default function LobbyPage() {
  const params = useParams()
  const router = useRouter()
  const salaId = params.id as string
  const [jugadorId, setJugadorId] = useState<string>('')
  const [nombre, setNombre] = useState<string>('')
  const [emoji, setEmoji] = useState<string>('🎮')
  const [unido, setUnido] = useState(false)

  const { sala, error, socketStatus, unirse, iniciarJuego } = useGame(salaId, jugadorId)

  useEffect(() => {
    const storedId = localStorage.getItem('jugador_id')
    const storedNombre = localStorage.getItem('nombre') ?? ''
    const storedEmoji = localStorage.getItem('emoji') ?? '🎮'
    if (storedId) {
      setJugadorId(storedId)
      setUnido(true)
    }
    setNombre(storedNombre)
    setEmoji(storedEmoji)
  }, [])

  useEffect(() => {
    if (sala?.estado === 'en_juego') {
      router.push(`/sala/${salaId}/jugar`)
    }
  }, [sala?.estado, salaId, router])

  function handleUnirse() {
    unirse(nombre, emoji)
    setUnido(true)
  }

  const salaUrl = typeof window !== 'undefined' ? `${window.location.origin}/sala/${salaId}` : ''
  const esHost = sala?.host_id === jugadorId

  return (
    <main style={{ maxWidth: 480, margin: '0 auto', padding: '2rem' }}>
      <h1>Sala {salaId}</h1>
      <p>Estado del socket: {socketStatus}</p>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {!unido && (
        <section>
          <h2>Unirse a la sala</h2>
          <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Tu nombre" />
          <input value={emoji} onChange={(e) => setEmoji(e.target.value)} placeholder="Emoji" maxLength={2} />
          <button onClick={handleUnirse}>Unirse</button>
        </section>
      )}

      {unido && salaUrl && (
        <section>
          <h2>Invita a tus amigos</h2>
          <QRCodeSVG value={salaUrl} size={200} />
          <p>Código: <strong>{salaId}</strong></p>
        </section>
      )}

      {sala && (
        <section>
          <h2>Jugadores ({sala.jugadores.length}/{sala.configuracion.max_jugadores})</h2>
          <ul>
            {sala.jugadores.map((j) => (
              <li key={j.id}>
                {j.emoji} {j.nombre} {j.es_host ? '(host)' : ''}
              </li>
            ))}
          </ul>
        </section>
      )}

      {esHost && sala?.jugadores.length >= 2 && (
        <button onClick={iniciarJuego}>Iniciar partida</button>
      )}
    </main>
  )
}
