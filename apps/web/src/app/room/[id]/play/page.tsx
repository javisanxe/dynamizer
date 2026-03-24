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
    <div className="page" style={{ justifyContent: 'flex-start', paddingTop: 'var(--space-lg)' }}>
      <div className="container">

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-lg)' }}>
          <div>
            <h1 style={{ fontSize: '1.25rem', color: 'var(--color-text)' }}>🃏 Time&apos;s Up!</h1>
            <p style={{ fontSize: '0.8rem' }}>
              Room <span style={{ color: 'var(--color-accent)', fontWeight: 700 }}>{roomId}</span>
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' }}>
            <span className={`status-dot ${socketStatus}`} />
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{socketStatus}</span>
          </div>
        </div>

        {error && (
          <div className="error-msg" style={{ marginBottom: 'var(--space-md)' }}>
            {error}
          </div>
        )}

        {/* Scoreboard */}
        {room && (
          <div className="card" style={{ marginBottom: 'var(--space-md)' }}>
            <p className="section-title">Scoreboard</p>
            <ul className="player-list">
              {[...room.players]
                .sort((a, b) => b.score - a.score)
                .map((p, i) => (
                  <li key={p.id} className="player-item">
                    <span style={{ fontSize: '0.9rem', color: 'var(--color-text-faint)', width: '1.2rem' }}>
                      {i + 1}
                    </span>
                    <span className="player-emoji">{p.emoji}</span>
                    <span className="player-name">{p.name}</span>
                    <span style={{
                      fontFamily: 'var(--font-display)',
                      fontWeight: 800,
                      color: i === 0 ? 'var(--color-accent)' : 'var(--color-text-muted)',
                    }}>
                      {p.score} pts
                    </span>
                  </li>
                ))}
            </ul>
          </div>
        )}

        {/* Turn area — placeholder until game logic is wired */}
        <div className="card" style={{ textAlign: 'center', padding: 'var(--space-2xl) var(--space-lg)' }}>
          <div style={{ fontSize: '3rem', marginBottom: 'var(--space-md)' }}>⏳</div>
          <h2 style={{ fontSize: '1.1rem', color: 'var(--color-text-muted)', fontWeight: 600, marginBottom: 'var(--space-lg)' }}>
            Waiting for your turn...
          </h2>
          <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
            <button
              className="btn btn-primary btn-full"
              onClick={() => cardGuessed('placeholder')}
              disabled
            >
              ✓ Correct
            </button>
            <button
              className="btn btn-ghost btn-full"
              onClick={() => cardPassed('placeholder')}
              disabled
            >
              Skip
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
