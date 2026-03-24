'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState('🎮')
  const [roomId, setRoomId] = useState('')
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
        body: JSON.stringify({ host_name: name, host_emoji: emoji }),
      })
      const data = await res.json()
      localStorage.setItem('player_id', data.player_id)
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
            <input
              className="input input-emoji"
              type="text"
              value={emoji}
              onChange={(e) => setEmoji(e.target.value)}
              maxLength={2}
            />
          </div>
        </div>

        {/* Create room */}
        <div className="card">
          <p className="section-title">Create a room</p>
          <p style={{ fontSize: '0.9rem', marginBottom: 'var(--space-md)' }}>
            Start a new game and invite your friends via QR or code.
          </p>
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
