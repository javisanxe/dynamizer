'use client'

import { useEffect, useRef, useState } from 'react'
import { useSocket } from './useSocket'
import type { Room } from '@/types/room'
import type { TicTacToeState, GameFinishedPayload } from '@/types/game'

export function useGame(
  roomId: string,
  playerId: string,
  onJoined?: (playerId: string) => void,
) {
  const { emit, on, off, status } = useSocket()
  const [room, setRoom] = useState<Room | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [tttState, setTttState] = useState<TicTacToeState | null>(null)
  const [gameResult, setGameResult] = useState<GameFinishedPayload | null>(null)

  // Keep a stable ref to onJoined so the effect doesn't re-run when the callback changes identity on each render.
  const onJoinedRef = useRef(onJoined)
  onJoinedRef.current = onJoined

  useEffect(() => {
    if (status !== 'connected') return

    on<Room>('room:updated', (data) => setRoom(data))
    on<{ message: string }>('error', (data) => setError(data.message))
    on<{ player_id: string }>('room:joined', (data) => {
      onJoinedRef.current?.(data.player_id)
    })
    on<TicTacToeState>('game:started', (data) => {
      if (data.game === 'tic_tac_toe') setTttState(data)
    })
    on<TicTacToeState>('game:updated', (data) => {
      if (data.game === 'tic_tac_toe') setTttState(data)
    })
    on<GameFinishedPayload>('game:finished', (data) => setGameResult(data))

    return () => {
      off('room:updated')
      off('error')
      off('room:joined')
      off('game:started')
      off('game:updated')
      off('game:finished')
    }
  }, [status, on, off])

  /** Join or reconnect to the room.
   *  Pass existingPlayerId to reconnect as an already-known player. */
  function join(name: string, emoji: string, existingPlayerId?: string) {
    emit('room:join', { room_id: roomId, name, emoji, player_id: existingPlayerId })
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

  function makeMove(cellIndex: number) {
    emit('game:make_move', { room_id: roomId, player_id: playerId, cell_index: cellIndex })
  }

  return {
    room,
    error,
    socketStatus: status,
    tttState,
    gameResult,
    join,
    startGame,
    cardGuessed,
    cardPassed,
    makeMove,
  }
}
