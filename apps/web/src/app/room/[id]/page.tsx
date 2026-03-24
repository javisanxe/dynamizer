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
    <div className="page">
      <div className="container">

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-lg)' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', color: 'var(--color-text)' }}>Lobby</h1>
            <p style={{ fontSize: '0.85rem', marginTop: 'var(--space-xs)' }}>
              Room <span className="room-code" style={{ fontSize: '1rem' }}>{roomId}</span>
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

        {/* Join form — shown to players who arrived via QR */}
        {!joined && (
          <div className="card" style={{ marginBottom: 'var(--space-md)' }}>
            <p className="section-title">Join the room</p>
            <div className="input-group" style={{ marginBottom: 'var(--space-md)' }}>
              <input
                className="input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
              />
              <input
                className="input input-emoji"
                value={emoji}
                onChange={(e) => setEmoji(e.target.value)}
                maxLength={2}
              />
            </div>
            <button className="btn btn-primary btn-full" onClick={handleJoin}>
              Join →
            </button>
          </div>
        )}

        {/* QR + code */}
        {joined && roomUrl && (
          <div className="card" style={{ marginBottom: 'var(--space-md)' }}>
            <p className="section-title">Invite friends</p>
            <div className="qr-wrapper">
              <QRCodeSVG
                value={roomUrl}
                size={180}
                bgColor="#242235"
                fgColor="#fffffe"
              />
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '0.8rem', marginBottom: 'var(--space-xs)' }}>Room code</p>
                <span className="room-code">{roomId}</span>
              </div>
            </div>
          </div>
        )}

        {/* Player list */}
        {room && (
          <div className="card" style={{ marginBottom: 'var(--space-md)' }}>
            <p className="section-title">
              Players — {room.players.length}/{room.config.max_players}
            </p>
            <ul className="player-list">
              {room.players.map((p) => (
                <li key={p.id} className="player-item">
                  <span className="player-emoji">{p.emoji}</span>
                  <span className="player-name">{p.name}</span>
                  {p.is_host && <span className="badge badge-primary">host</span>}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Start game — host only */}
        {isHost && (
          <button
            className="btn btn-accent btn-full btn-lg"
            onClick={startGame}
            disabled={!room || room.players.length < 2}
            style={{ marginTop: 'var(--space-sm)' }}
          >
            {!room || room.players.length < 2
              ? 'Waiting for players...'
              : '🚀 Start game'}
          </button>
        )}

        {/* Waiting message — non-host */}
        {joined && !isHost && room && room.status === 'waiting' && (
          <div className="card" style={{ textAlign: 'center', marginTop: 'var(--space-sm)' }}>
            <p style={{ fontSize: '0.9rem' }}>Waiting for the host to start the game...</p>
          </div>
        )}

      </div>
    </div>
  )
}
