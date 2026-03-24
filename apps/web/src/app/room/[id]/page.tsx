'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { QRCodeSVG } from 'qrcode.react'
import { useGame } from '@/hooks/useGame'

export default function LobbyPage() {
  const params = useParams()
  const router = useRouter()
  const roomId = params.id as string
  const [playerId, setPlayerId] = useState<string>('')
  const [name, setName] = useState<string>('')
  const [emoji, setEmoji] = useState<string>('🎮')
  const [joined, setJoined] = useState(false)

  const { room, error, socketStatus, join, startGame } = useGame(roomId, playerId)

  useEffect(() => {
    const storedId = localStorage.getItem('player_id')
    const storedName = localStorage.getItem('name') ?? ''
    const storedEmoji = localStorage.getItem('emoji') ?? '🎮'
    if (storedId) {
      setPlayerId(storedId)
      setJoined(true)
    }
    setName(storedName)
    setEmoji(storedEmoji)
  }, [])

  useEffect(() => {
    if (room?.status === 'playing') {
      router.push(`/room/${roomId}/play`)
    }
  }, [room?.status, roomId, router])

  function handleJoin() {
    join(name, emoji)
    setJoined(true)
  }

  const roomUrl = typeof window !== 'undefined' ? `${window.location.origin}/room/${roomId}` : ''
  const isHost = room?.host_id === playerId

  return (
    <main style={{ maxWidth: 480, margin: '0 auto', padding: '2rem' }}>
      <h1>Room {roomId}</h1>
      <p>Socket status: {socketStatus}</p>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {!joined && (
        <section>
          <h2>Join the room</h2>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
          <input value={emoji} onChange={(e) => setEmoji(e.target.value)} placeholder="Emoji" maxLength={2} />
          <button onClick={handleJoin}>Join</button>
        </section>
      )}

      {joined && roomUrl && (
        <section>
          <h2>Invite your friends</h2>
          <QRCodeSVG value={roomUrl} size={200} />
          <p>Code: <strong>{roomId}</strong></p>
        </section>
      )}

      {room && (
        <section>
          <h2>Players ({room.players.length}/{room.config.max_players})</h2>
          <ul>
            {room.players.map((p) => (
              <li key={p.id}>
                {p.emoji} {p.name} {p.is_host ? '(host)' : ''}
              </li>
            ))}
          </ul>
        </section>
      )}

      {isHost && room?.players.length >= 2 && (
        <button onClick={startGame}>Start game</button>
      )}
    </main>
  )
}
