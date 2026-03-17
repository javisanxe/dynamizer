'use client'

import { useEffect, useRef, useState } from 'react'
import { io, Socket } from 'socket.io-client'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

export type SocketStatus = 'connecting' | 'connected' | 'disconnected' | 'error'

export function useSocket() {
  const socketRef = useRef<Socket | null>(null)
  const [status, setStatus] = useState<SocketStatus>('disconnected')

  useEffect(() => {
    const socket = io(API_URL, {
      transports: ['websocket'],
      autoConnect: true,
    })

    socket.on('connect', () => setStatus('connected'))
    socket.on('disconnect', () => setStatus('disconnected'))
    socket.on('connect_error', () => setStatus('error'))

    socketRef.current = socket

    return () => {
      socket.disconnect()
    }
  }, [])

  function emit<T>(event: string, payload: T) {
    socketRef.current?.emit(event, payload)
  }

  function on<T>(event: string, handler: (data: T) => void) {
    socketRef.current?.on(event, handler)
  }

  function off(event: string) {
    socketRef.current?.off(event)
  }

  return { socket: socketRef.current, status, emit, on, off }
}
