'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { QRCodeSVG } from 'qrcode.react'
import { useGame } from '@/hooks/useGame'
import EmojiPicker from '@/components/EmojiPicker'

const TEST_NAMES = ['Player 2', 'Alex', 'Sam', 'Jordan', 'Casey', 'Morgan', 'Riley', 'Taylor']
const TEST_EMOJIS = ['🦊', '🐼', '🦁', '🐸', '🤖', '👽', '🧙', '🥳', '😎', '🤠']

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

const isDev = process.env.NODE_ENV === 'development'

/** localStorage key scoped to a specific room, avoiding cross-room identity collisions. */
function playerKey(roomId: string) {
  return `player_${roomId}`
}

export default function LobbyPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const roomId = params.id as string
  const isTestPlayer = searchParams.get('testplayer') === '1'

  const [playerId, setPlayerId] = useState<string>('')
  const [name, setName] = useState<string>('')
  const [emoji, setEmoji] = useState<string>('🎮')
  // joined = we have shown the form and the user has submitted it (or we're reconnecting)
  const [joined, setJoined] = useState(false)
  const autoJoinedRef = useRef(false)

  // Called by useGame when the server confirms our identity via room:joined
  const handleRoomJoined = useCallback((id: string) => {
    setPlayerId(id)
    if (!isTestPlayer) {
      localStorage.setItem(playerKey(roomId), id)
    }
  }, [roomId, isTestPlayer])

  const { room, error, socketStatus, join, startGame } = useGame(roomId, playerId, handleRoomJoined)

  // Normal flow: if we have a stored player_id for this room (or ?pid= in URL),
  // reconnect automatically. Otherwise show the join form.
  useEffect(() => {
    if (isTestPlayer) return
    if (socketStatus !== 'connected') return
    if (autoJoinedRef.current) return
    autoJoinedRef.current = true

    // ?pid= takes priority (e.g. returning from play page), then localStorage
    const pidFromUrl = searchParams.get('pid') ?? ''
    const storedId = pidFromUrl || (localStorage.getItem(playerKey(roomId)) ?? '')
    const storedName = localStorage.getItem('name') ?? ''
    const storedEmoji = localStorage.getItem('emoji') ?? '🎮'
    setName(storedName)
    setEmoji(storedEmoji)

    if (storedId) {
      // Reconnect: send stored player_id so the backend reuses the existing player
      join(storedName, storedEmoji, storedId)
      setJoined(true)
    }
    // If no storedId: joined stays false → join form is shown
  }, [isTestPlayer, socketStatus, roomId, join, searchParams])

  // Test player flow: reconnect if ?pid= is present (returning from play page),
  // otherwise auto-fill and auto-join with a random identity (no localStorage)
  useEffect(() => {
    if (!isTestPlayer || autoJoinedRef.current) return
    if (socketStatus !== 'connected') return
    autoJoinedRef.current = true

    const pidFromUrl = searchParams.get('pid') ?? ''
    if (pidFromUrl) {
      // Returning from play page — reconnect with the same identity
      const storedName = localStorage.getItem('name') ?? 'Player 2'
      const storedEmoji = localStorage.getItem('emoji') ?? '🎮'
      setName(storedName)
      setEmoji(storedEmoji)
      join(storedName, storedEmoji, pidFromUrl)
    } else {
      const testName = randomItem(TEST_NAMES)
      const testEmoji = randomItem(TEST_EMOJIS)
      setName(testName)
      setEmoji(testEmoji)
      join(testName, testEmoji)
    }
    setJoined(true)
  }, [isTestPlayer, socketStatus, join, searchParams])

  useEffect(() => {
    if (room?.status === 'playing') {
      // Pass player_id in the URL so the play page knows who we are even when
      // localStorage belongs to a different player (e.g. test player tab).
      const dest = playerId
        ? `/room/${roomId}/play?pid=${playerId}`
        : `/room/${roomId}/play`
      router.push(dest)
    }
  }, [room?.status, roomId, router, playerId])

  function handleJoin() {
    localStorage.setItem('name', name)
    localStorage.setItem('emoji', emoji)
    join(name, emoji)
    setJoined(true)
  }

  function openTestPlayer() {
    window.open(`/room/${roomId}?testplayer=1`, '_blank')
  }

  const roomUrl = typeof window !== 'undefined' ? `${window.location.origin}/room/${roomId}` : ''
  const isHost = !!playerId && room?.host_id === playerId

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

        {/* Join form — shown to new players who arrived via QR or room code */}
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
              <EmojiPicker value={emoji} onChange={setEmoji} />
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
              Players — {room.players.length}
              {room.config.game === 'tic_tac_toe' ? '/2' : `/${room.config.max_players}`}
            </p>
            <ul className="player-list">
              {room.players.map((p) => (
                <li key={p.id} className="player-item">
                  <span className="player-emoji">{p.emoji}</span>
                  <span className="player-name">{p.name}</span>
                  {p.id === playerId && (
                    <span className="badge badge-you">tú</span>
                  )}
                  {p.is_host && <span className="badge badge-primary">host</span>}
                </li>
              ))}
            </ul>
            {room.config.game === 'tic_tac_toe' && room.players.length < 2 && (
              <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: 'var(--space-sm)', textAlign: 'center' }}>
                Waiting for 1 more player...
              </p>
            )}
          </div>
        )}

        {/* Start game — host only */}
        {isHost && (() => {
          const isTtt = room?.config.game === 'tic_tac_toe'
          const canStart = isTtt
            ? room?.players.length === 2
            : (room?.players.length ?? 0) >= 1
          const hint = isTtt && !canStart ? 'Need exactly 2 players' : undefined
          return (
            <div style={{ marginTop: 'var(--space-sm)' }}>
              <button
                className="btn btn-accent btn-full btn-lg"
                onClick={startGame}
                disabled={!canStart}
              >
                🚀 Start game
              </button>
              {hint && (
                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', textAlign: 'center', marginTop: 'var(--space-xs)' }}>
                  {hint}
                </p>
              )}
            </div>
          )
        })()}

        {/* Waiting message — non-host */}
        {joined && !isHost && room && room.status === 'waiting' && (
          <div className="card" style={{ textAlign: 'center', marginTop: 'var(--space-sm)' }}>
            <p style={{ fontSize: '0.9rem' }}>Waiting for the host to start the game...</p>
          </div>
        )}

        {/* Dev tool — open a second test player tab */}
        {isDev && joined && (
          <button
            className="btn btn-dev btn-full"
            onClick={openTestPlayer}
            style={{ marginTop: 'var(--space-md)' }}
          >
            🧪 Open test player
          </button>
        )}

      </div>
    </div>
  )
}
