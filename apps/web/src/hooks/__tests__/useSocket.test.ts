import { renderHook, act } from '@testing-library/react'
import { useSocket } from '../useSocket'

// Mock socket.io-client
jest.mock('socket.io-client', () => {
  const handlers: Record<string, Function> = {}
  const mockSocket = {
    on: jest.fn((event: string, handler: Function) => {
      handlers[event] = handler
    }),
    off: jest.fn(),
    emit: jest.fn(),
    disconnect: jest.fn(),
    _handlers: handlers,
  }
  return {
    io: jest.fn(() => mockSocket),
    __mockSocket: mockSocket,
  }
})

describe('useSocket', () => {
  it('starts with disconnected status', () => {
    const { result } = renderHook(() => useSocket())
    expect(result.current.status).toBe('disconnected')
  })

  it('exposes emit, on and off functions', () => {
    const { result } = renderHook(() => useSocket())
    expect(typeof result.current.emit).toBe('function')
    expect(typeof result.current.on).toBe('function')
    expect(typeof result.current.off).toBe('function')
  })
})
