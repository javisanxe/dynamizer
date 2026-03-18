'use client'

import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useGame } from '@/hooks/useGame'

export default function PlayPage() {
  const params = useParams()
  const roomId = params.id as string
  const [playerId, setPlayerId] = useState<string>('')

  useEffect(() => {
    const id = localStorage.getItem('player_id') ?? ''
    setPlayerId(id)
  }, [])

  const { room, error, socketStatus, cardGuessed, cardPassed } = useGame(roomId, playerId)

  return (
    <main style={{ maxWidth: 480, margin: '0 auto', padding: '2rem' }}>
      <h1>Playing — Room {roomId}</h1>
      <p>Socket: {socketStatus}</p>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {room && (
        <section>
          <h2>Scores</h2>
          <ul>
            {room.players
              .sort((a, b) => b.score - a.score)
              .map((p) => (
                <li key={p.id}>
                  {p.emoji} {p.name}: {p.score} pts
                </li>
              ))}
          </ul>
        </section>
      )}

      <section>
        <p>Waiting for your turn...</p>
        {/* Turn controls will be implemented in the next iteration */}
      </section>
    </main>
  )
}
