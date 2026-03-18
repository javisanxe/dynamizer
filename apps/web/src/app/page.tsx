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
      // Save player_id to localStorage for WebSocket identification
      localStorage.setItem('player_id', data.player_id)
      router.push(`/room/${data.room_id}`)
    } catch {
      setError('Error creating the room')
    } finally {
      setLoading(false)
    }
  }

  function joinRoom() {
    if (!roomId.trim()) return setError('Enter the room code')
    if (!name.trim()) return setError('Enter your name')
    localStorage.setItem('name', name)
    localStorage.setItem('emoji', emoji)
    router.push(`/room/${roomId.toUpperCase()}`)
  }

  return (
    <main style={{ maxWidth: 480, margin: '0 auto', padding: '2rem' }}>
      <h1>Dynamizer</h1>
      <p>Social games for groups. Create a room or join with a code.</p>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      <section>
        <h2>Your profile</h2>
        <input
          type="text"
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={30}
        />
        <input
          type="text"
          placeholder="Emoji"
          value={emoji}
          onChange={(e) => setEmoji(e.target.value)}
          maxLength={2}
        />
      </section>

      <section>
        <h2>Create room</h2>
        <button onClick={createRoom} disabled={loading}>
          {loading ? 'Creating...' : 'Create room'}
        </button>
      </section>

      <section>
        <h2>Join room</h2>
        <input
          type="text"
          placeholder="Room code (e.g. AB1C2D)"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
          maxLength={6}
        />
        <button onClick={joinRoom}>Join</button>
      </section>
    </main>
  )
}
