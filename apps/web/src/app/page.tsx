'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import EmojiPicker from '@/components/EmojiPicker'

type GameSlug = 'times_up' | 'tic_tac_toe'

const GAMES: { slug: GameSlug; icon: string; title: string; description: string }[] = [
  {
    slug: 'times_up',
    icon: '🃏',
    title: "Time's Up",
    description: 'Guess famous characters in 3 rounds. 2–8 players.',
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
    <div className="home-page">

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <header className="home-hero">
        <div className="home-hero__glow" aria-hidden="true" />
        <div className="home-hero__content">
          <div className="home-hero__icon">🎮</div>
          <h1 className="home-hero__title">
            Play together,<br />
            <span className="text-accent">anywhere.</span>
          </h1>
          <p className="home-hero__subtitle">
            Real-time social games for groups. No app, no account — just share a link.
          </p>
          <div className="home-hero__links">
            <Link href="/games" className="home-hero__link">See all games →</Link>
            <Link href="/about" className="home-hero__link">About the project →</Link>
          </div>
        </div>
      </header>

      {/* ── Form ─────────────────────────────────────────────────────────── */}
      <div className="home-form">

        {error && (
          <div className="error-msg" style={{ marginBottom: 'var(--space-md)' }}>
            {error}
          </div>
        )}

        {/* Profile */}
        <div className="card">
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
            {loading ? 'Creating...' : 'Create room'}
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

        {/* Footer links */}
        <div className="home-footer-links">
          <Link href="/about" className="home-footer-link">About</Link>
          <span className="home-footer-sep">·</span>
          <Link href="/games" className="home-footer-link">Games</Link>
          <span className="home-footer-sep">·</span>
          <Link href="/team" className="home-footer-link">Team</Link>
          <span className="home-footer-sep">·</span>
          <Link href="/contact" className="home-footer-link">Contact</Link>
          <span className="home-footer-sep">·</span>
          <a
            href="https://github.com/javisanxe/dynamizer"
            target="_blank"
            rel="noopener noreferrer"
            className="home-footer-link"
          >
            GitHub
          </a>
        </div>

      </div>
    </div>
  )
}
