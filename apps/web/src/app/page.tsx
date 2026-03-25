'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import EmojiPicker from '@/components/EmojiPicker'

type GameSlug = 'times_up' | 'tic_tac_toe'

const GAMES: { slug: GameSlug; icon: string; title: string; description: string }[] = [
  {
    slug: 'times_up',
    icon: '🃏',
    title: "Time's Up",
    description: 'Guess famous characters in 3 rounds. 2-8 players.',
  },
  {
    slug: 'tic_tac_toe',
    icon: '⬜',
    title: 'Tic-Tac-Toe',
    description: 'Classic 3-in-a-row. Exactly 2 players.',
  },
]

export default function HomePage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState('🎮')
  const [roomId, setRoomId] = useState('')
  const [selectedGame, setSelectedGame] = useState<GameSlug>('times_up')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

  async function createRoom() {
    if (!name.trim()) return setError('Enter your name')
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_URL}/api/rooms/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host_name: name,
          host_emoji: emoji,
          config: { game: selectedGame },
        }),
      })
      const data = await res.json()
      localStorage.setItem(`player_${data.room_id}`, data.player_id)
      localStorage.setItem('name', name)
      localStorage.setItem('emoji', emoji)
      router.push(`/room/${data.room_id}`)
    } catch {
      setError('Error creating the room. Is the server running?')
    } finally {
      setLoading(false)
    }
  }

  function joinRoom() {
    if (!name.trim()) return setError('Enter your name')
    if (!roomId.trim()) return setError('Enter the room code')
    localStorage.setItem('name', name)
    localStorage.setItem('emoji', emoji)
    router.push(`/room/${roomId.toUpperCase()}`)
  }

  return (
    <div className="page">
      <div className="container">

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-2xl)' }}>
          <div style={{ fontSize: '3rem', marginBottom: 'var(--space-sm)' }}>🎮</div>
          <h1 style={{ fontSize: '2.5rem', color: 'var(--color-text)', marginBottom: 'var(--space-sm)' }}>
            Dynamizer
          </h1>
          <p style={{ fontSize: '1rem' }}>
            Social games for groups. Create a room or join with a code.
          </p>
        </div>

        {error && (
          <div className="error-msg" style={{ marginBottom: 'var(--space-md)' }}>
            {error}
          </div>
        )}

        {/* Profile */}
        <div className="card" style={{ marginBottom: 'var(--space-md)' }}>
          <p className="section-title">Your profile</p>
          <div className="input-group">
            <input
              className="input"
              type="text"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={30}
              onKeyDown={(e) => e.key === 'Enter' && createRoom()}
            />
            <EmojiPicker value={emoji} onChange={setEmoji} />
          </div>
        </div>

        {/* Create room */}
        <div className="card">
          <p className="section-title">Create a room</p>

          {/* Game selector */}
          <div className="game-selector" style={{ marginBottom: 'var(--space-md)' }}>
            {GAMES.map((g) => (
              <button
                key={g.slug}
                className={`game-option${selectedGame === g.slug ? ' game-option--active' : ''}`}
                onClick={() => setSelectedGame(g.slug)}
                type="button"
              >
                <span className="game-option__icon">{g.icon}</span>
                <span className="game-option__title">{g.title}</span>
                <span className="game-option__desc">{g.description}</span>
              </button>
            ))}
          </div>

          <button
            className="btn btn-primary btn-full btn-lg"
            onClick={createRoom}
            disabled={loading}
          >
            {loading ? 'Creating...' : '✨ Create room'}
          </button>
        </div>

        <div className="divider">or</div>

        {/* Join room */}
        <div className="card">
          <p className="section-title">Join a room</p>
          <div className="field">
            <input
              className="input"
              type="text"
              placeholder="Room code (e.g. AB1C2D)"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value.toUpperCase())}
              maxLength={6}
              onKeyDown={(e) => e.key === 'Enter' && joinRoom()}
              style={{ textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700 }}
            />
          </div>
          <button
            className="btn btn-ghost btn-full"
            onClick={joinRoom}
            style={{ marginTop: 'var(--space-md)' }}
          >
            Join →
          </button>
        </div>

      </div>
    </div>
  )
}
