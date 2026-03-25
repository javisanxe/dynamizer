'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useGame } from '@/hooks/useGame'
import TicTacToePlay from '@/components/TicTacToePlay'

export default function PlayPage() {
  const params = useParams()
  const router = useRouter()
  const roomId = params.id as string

  // Read synchronously on first render to avoid the '' → real-id flash
  const storedId = typeof window !== 'undefined'
    ? (localStorage.getItem(`player_${roomId}`) ?? '')
    : ''
  const [playerIdReady] = useState<string>(storedId)
  const [playerId, setPlayerId] = useState<string>(storedId)

  useEffect(() => {
    const id = localStorage.getItem(`player_${roomId}`) ?? ''
    setPlayerId(id)
  }, [roomId])

  const effectivePlayerId = playerIdReady || playerId

  const { room, error, socketStatus, tttState, gameResult, cardGuessed, cardPassed, makeMove, join } =
    useGame(roomId, effectivePlayerId)

  // Reconnect this socket to the room group so we receive game:started / game:updated
  useEffect(() => {
    if (socketStatus !== 'connected') return
    if (!effectivePlayerId) return
    const storedName = localStorage.getItem('name') ?? ''
    const storedEmoji = localStorage.getItem('emoji') ?? '🎮'
    join(storedName, storedEmoji, effectivePlayerId)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socketStatus])

  // ── Loading / no room yet ──────────────────────────────────────────────────
  if (!room) {
    return (
      <div className="page">
        <div className="container">
          <div className="card" style={{ textAlign: 'center' }}>
            <p style={{ color: 'var(--color-text-muted)' }}>
              {error ?? 'Connecting...'}
            </p>
          </div>
        </div>
      </div>
    )
  }

  // ── Tic-Tac-Toe ────────────────────────────────────────────────────────────
  if (room.config.game === 'tic_tac_toe') {
    return (
      <div className="page" style={{ justifyContent: 'flex-start', paddingTop: 'var(--space-lg)' }}>
        <div className="container">

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-lg)' }}>
            <div>
              <h1 style={{ fontSize: '1.25rem', color: 'var(--color-text)' }}>⬜ Tic-Tac-Toe</h1>
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

          {tttState ? (
            <TicTacToePlay
              state={tttState}
              players={room.players}
              myPlayerId={effectivePlayerId}
              gameResult={gameResult}
              onMove={makeMove}
              onPlayAgain={() => router.push(`/room/${roomId}`)}
            />
          ) : (
            <div className="card" style={{ textAlign: 'center' }}>
              <p style={{ color: 'var(--color-text-muted)' }}>Loading game...</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  // ── Time's Up (default / fallback) ─────────────────────────────────────────
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
