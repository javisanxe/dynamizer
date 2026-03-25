import { renderHook, act } from '@testing-library/react'
import { useGame } from '../useGame'

const mockOn = jest.fn()
const mockOff = jest.fn()
const mockEmit = jest.fn()

jest.mock('../useSocket', () => ({
  useSocket: () => ({
    status: 'connected',
    emit: mockEmit,
    on: mockOn,
    off: mockOff,
    socket: null,
  }),
}))

describe('useGame', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('starts with null room and no error', () => {
    const { result } = renderHook(() => useGame('ABC123', 'player-1'))
    expect(result.current.room).toBeNull()
    expect(result.current.error).toBeNull()
  })

  it('starts with null tttState and gameResult', () => {
    const { result } = renderHook(() => useGame('ABC123', 'player-1'))
    expect(result.current.tttState).toBeNull()
    expect(result.current.gameResult).toBeNull()
  })

  it('exposes game functions', () => {
    const { result } = renderHook(() => useGame('ABC123', 'player-1'))
    expect(typeof result.current.join).toBe('function')
    expect(typeof result.current.startGame).toBe('function')
    expect(typeof result.current.cardGuessed).toBe('function')
    expect(typeof result.current.cardPassed).toBe('function')
    expect(typeof result.current.makeMove).toBe('function')
  })

  it('registers room:joined listener on connect', () => {
    renderHook(() => useGame('ABC123', 'player-1'))
    const registeredEvents = mockOn.mock.calls.map(([event]: [string]) => event)
    expect(registeredEvents).toContain('room:joined')
  })

  it('calls onJoined callback when room:joined fires', () => {
    const onJoined = jest.fn()
    renderHook(() => useGame('ABC123', 'player-1', onJoined))

    // Find the room:joined handler registered via on()
    const joinedCall = mockOn.mock.calls.find(([event]: [string]) => event === 'room:joined')
    expect(joinedCall).toBeDefined()
    const handler = joinedCall[1]

    act(() => {
      handler({ player_id: 'server-assigned-id' })
    })

    expect(onJoined).toHaveBeenCalledWith('server-assigned-id')
  })

  it('join() sends player_id when provided (reconnection)', () => {
    const { result } = renderHook(() => useGame('ABC123', 'player-1'))
    act(() => {
      result.current.join('Javi', '🐱', 'existing-id')
    })
    expect(mockEmit).toHaveBeenCalledWith('room:join', {
      room_id: 'ABC123',
      name: 'Javi',
      emoji: '🐱',
      player_id: 'existing-id',
    })
  })

  it('join() sends undefined player_id when not provided (new player)', () => {
    const { result } = renderHook(() => useGame('ABC123', 'player-1'))
    act(() => {
      result.current.join('Javi', '🐱')
    })
    expect(mockEmit).toHaveBeenCalledWith('room:join', {
      room_id: 'ABC123',
      name: 'Javi',
      emoji: '🐱',
      player_id: undefined,
    })
  })
})
