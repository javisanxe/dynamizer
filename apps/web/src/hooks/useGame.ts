'use client'

import { useEffect, useState } from 'react'
import { useSocket } from './useSocket'
import type { Room } from '@/types/room'

export function useGame(roomId: string, playerId: string) {
  const { emit, on, off, status } = useSocket()
  const [room, setRoom] = useState<Room | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (status !== 'connected') return

    on<Room>('room:updated', (data) => setRoom(data))
    on<{ message: string }>('error', (data) => setError(data.message))

    return () => {
      off('room:updated')
      off('error')
    }
  }, [status, on, off])

  function join(name: string, emoji: string) {
    emit('room:join', { room_id: roomId, name, emoji })
  }

  function startGame() {
    emit('game:start', { room_id: roomId, player_id: playerId })
  }

  function cardGuessed(cardId: string) {
    emit('game:card_guessed', { room_id: roomId, player_id: playerId, card_id: cardId })
  }

  function cardPassed(cardId: string) {
    emit('game:card_passed', { room_id: roomId, player_id: playerId, card_id: cardId })
  }

  return { room, error, socketStatus: status, join, startGame, cardGuessed, cardPassed }
}
