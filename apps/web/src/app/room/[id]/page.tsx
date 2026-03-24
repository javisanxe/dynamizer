'use client'

import { useEffect, useState, useRef } from 'react'
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

export default function LobbyPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const roomId = params.id as string
  const isTestPlayer = searchParams.get('testplayer') === '1'

  // Fix 2: read playerId synchronously so isHost is correct on first render
  const [playerId, setPlayerId] = useState<string>(
    () => typeof window !== 'undefined' ? localStorage.getItem('player_id') ?? '' : ''
  )
  const [name, setName] = useState<string>('')
  const [emoji, setEmoji] = useState<string>('🎮')
  const [joined, setJoined] = useState(false)
  const hostJoinedRef = useRef(false)
  const autoJoinedRef = useRef(false)

  const { room, error, socketStatus, join, startGame } = useGame(roomId, playerId)

  // Normal flow: restore name/emoji from localStorage (playerId already set synchronously)
  useEffect(() => {
    if (isTestPlayer) return
    const storedId = localStorage.getItem('player_id') ?? ''
    const storedName = localStorage.getItem('name') ?? ''
    const storedEmoji = localStorage.getItem('emoji') ?? '🎮'
    if (storedId) setJoined(true)
    setName(storedName)
    setEmoji(storedEmoji)
  }, [isTestPlayer])

  // Fix 1: host must emit room:join so the socket enters the Socket.IO room.
  // Non-host players do this via handleJoin; the host bypassed it by using REST.
  useEffect(() => {
    if (isTestPlayer) return
    if (hostJoinedRef.current) return
    if (socketStatus !== 'connected') return
    const storedId = localStorage.getItem('player_id')
    const storedName = localStorage.getItem('name') ?? ''
    const storedEmoji = localStorage.getItem('emoji') ?? '🎮'
    if (!storedId) return
    hostJoinedRef.current = true
    join(storedName, storedEmoji, storedId)
  }, [socketStatus, isTestPlayer, join])

  // Test player flow: auto-fill and auto-join once socket is connected
  useEffect(() => {
    if (!isTestPlayer || autoJoinedRef.current) return
    if (socketStatus !== 'connected') return
    autoJoinedRef.current = true
    const testName = randomItem(TEST_NAMES)
    const testEmoji = randomItem(TEST_EMOJIS)
    setName(testName)
    setEmoji(testEmoji)
    join(testName, testEmoji)
    setJoined(true)
  }, [isTestPlayer, socketStatus, join])

  useEffect(() => {
    if (room?.status === 'playing') {
      router.push(`/room/${roomId}/play`)
    }
  }, [room?.status, roomId, router])

  function handleJoin() {
    join(name, emoji)
    setJoined(true)
  }

  function openTestPlayer() {
    window.open(`/room/${roomId}?testplayer=1`, '_blank')
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
            disabled={!room || room.players.length < 1}
            style={{ marginTop: 'var(--space-sm)' }}
          >
            🚀 Start game
          </button>
        )}

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
