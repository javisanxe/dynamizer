'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const router = useRouter()
  const [nombre, setNombre] = useState('')
  const [emoji, setEmoji] = useState('🎮')
  const [salaId, setSalaId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

  async function crearSala() {
    if (!nombre.trim()) return setError('Introduce tu nombre')
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_URL}/api/salas/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre_host: nombre, emoji_host: emoji }),
      })
      const data = await res.json()
      // Guardar jugador_id en localStorage para identificarse en WebSocket
      localStorage.setItem('jugador_id', data.jugador_id)
      router.push(`/sala/${data.sala_id}`)
    } catch {
      setError('Error al crear la sala')
    } finally {
      setLoading(false)
    }
  }

  function unirseASala() {
    if (!salaId.trim()) return setError('Introduce el código de sala')
    if (!nombre.trim()) return setError('Introduce tu nombre')
    localStorage.setItem('nombre', nombre)
    localStorage.setItem('emoji', emoji)
    router.push(`/sala/${salaId.toUpperCase()}`)
  }

  return (
    <main style={{ maxWidth: 480, margin: '0 auto', padding: '2rem' }}>
      <h1>Dynamizer</h1>
      <p>Juegos sociales para grupos. Crea una sala o únete con un código.</p>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      <section>
        <h2>Tu perfil</h2>
        <input
          type="text"
          placeholder="Tu nombre"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
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
        <h2>Crear sala</h2>
        <button onClick={crearSala} disabled={loading}>
          {loading ? 'Creando...' : 'Crear sala'}
        </button>
      </section>

      <section>
        <h2>Unirse a sala</h2>
        <input
          type="text"
          placeholder="Código de sala (ej. AB1C2D)"
          value={salaId}
          onChange={(e) => setSalaId(e.target.value)}
          maxLength={6}
        />
        <button onClick={unirseASala}>Unirse</button>
      </section>
    </main>
  )
}
