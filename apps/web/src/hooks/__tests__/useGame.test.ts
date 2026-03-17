import { renderHook } from '@testing-library/react'
import { useGame } from '../useGame'

jest.mock('../useSocket', () => ({
  useSocket: () => ({
    status: 'connected',
    emit: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
    socket: null,
  }),
}))

describe('useGame', () => {
  it('inicia con sala null y sin error', () => {
    const { result } = renderHook(() => useGame('ABC123', 'jugador-1'))
    expect(result.current.sala).toBeNull()
    expect(result.current.error).toBeNull()
  })

  it('expone funciones de juego', () => {
    const { result } = renderHook(() => useGame('ABC123', 'jugador-1'))
    expect(typeof result.current.unirse).toBe('function')
    expect(typeof result.current.iniciarJuego).toBe('function')
    expect(typeof result.current.cartaAdivinada).toBe('function')
    expect(typeof result.current.cartaPasada).toBe('function')
  })
})
