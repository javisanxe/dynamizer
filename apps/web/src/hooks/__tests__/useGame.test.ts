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
  it('starts with null room and no error', () => {
    const { result } = renderHook(() => useGame('ABC123', 'player-1'))
    expect(result.current.room).toBeNull()
    expect(result.current.error).toBeNull()
  })

  it('exposes game functions', () => {
    const { result } = renderHook(() => useGame('ABC123', 'player-1'))
    expect(typeof result.current.join).toBe('function')
    expect(typeof result.current.startGame).toBe('function')
    expect(typeof result.current.cardGuessed).toBe('function')
    expect(typeof result.current.cardPassed).toBe('function')
  })
})
