/**
 * Tests for apps/web/src/app/room/[id]/play/page.tsx
 *
 * Strategy: mock useGame so we can control what the page renders without
 * needing a live socket or backend.
 */
import { render, screen, fireEvent } from '@testing-library/react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import PlayPage from '../room/[id]/play/page'
import { useGame } from '../../hooks/useGame'
import type { Room } from '../../types/room'
import type { TicTacToeState, GameFinishedPayload } from '../../types/game'

// ── Next.js navigation mocks ──────────────────────────────────────────────────
jest.mock('next/navigation', () => ({
  useParams: jest.fn(),
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}))

// ── useGame mock ──────────────────────────────────────────────────────────────
jest.mock('../../hooks/useGame')

// ── Fixtures ──────────────────────────────────────────────────────────────────
const mockPush = jest.fn()

const baseRoom: Room = {
  id: 'ABC01',
  status: 'playing',
  host_id: 'p1',
  players: [
    { id: 'p1', name: 'Alice', emoji: '🐱', score: 0, is_host: true, connected: true },
    { id: 'p2', name: 'Bob', emoji: '🐶', score: 0, is_host: false, connected: true },
  ],
  config: { game: 'tic_tac_toe', max_players: 2 },
}

const baseTttState: TicTacToeState = {
  room_id: 'ABC01',
  game: 'tic_tac_toe',
  board: Array(9).fill(null),
  current_player_id: 'p1',
  winner_id: null,
  is_draw: false,
  finished: false,
  scores: { p1: 0, p2: 0 },
}

function mockUseGame(overrides: Partial<ReturnType<typeof useGame>> = {}) {
  ;(useGame as jest.Mock).mockReturnValue({
    room: baseRoom,
    error: null,
    socketStatus: 'connected',
    tttState: baseTttState,
    gameResult: null,
    join: jest.fn(),
    startGame: jest.fn(),
    makeMove: jest.fn(),
    cardGuessed: jest.fn(),
    cardPassed: jest.fn(),
    ...overrides,
  })
}

// ── Setup ─────────────────────────────────────────────────────────────────────
beforeEach(() => {
  jest.clearAllMocks()
  ;(useParams as jest.Mock).mockReturnValue({ id: 'ABC01' })
  ;(useRouter as jest.Mock).mockReturnValue({ push: mockPush })
  ;(useSearchParams as jest.Mock).mockReturnValue({ get: () => null })
  jest.spyOn(Storage.prototype, 'getItem').mockReturnValue(null)
})

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('PlayPage (Tic-Tac-Toe)', () => {
  it('shows a loading state while the room is not yet available', () => {
    mockUseGame({ room: null, tttState: null })
    render(<PlayPage />)
    expect(screen.getByText(/connecting\.\.\./i)).toBeInTheDocument()
  })

  it('shows "Loading game..." while room exists but game state is not yet received', () => {
    mockUseGame({ tttState: null })
    render(<PlayPage />)
    expect(screen.getByText(/loading game\.\.\./i)).toBeInTheDocument()
  })

  it('renders the Tic-Tac-Toe board when tttState is available', () => {
    mockUseGame()
    render(<PlayPage />)
    expect(screen.getAllByRole('button', { name: /cell/i })).toHaveLength(9)
  })

  it('displays an error message when useGame reports an error', () => {
    mockUseGame({ error: 'Room not found' })
    render(<PlayPage />)
    expect(screen.getByText('Room not found')).toBeInTheDocument()
  })

  it('navigates to /room/:id?pid=<playerId> when "Back to lobby" is clicked', () => {
    // pid=p1 provided via URL search param → playerId resolved to p1
    ;(useSearchParams as jest.Mock).mockReturnValue({
      get: (key: string) => (key === 'pid' ? 'p1' : null),
    })

    const finishedState: TicTacToeState = { ...baseTttState, finished: true, winner_id: 'p1' }
    const gameResult: GameFinishedPayload = {
      winner_id: 'p1',
      is_draw: false,
      leaderboard: [
        { player_id: 'p1', points: 1 },
        { player_id: 'p2', points: 0 },
      ],
    }
    mockUseGame({ tttState: finishedState, gameResult })

    render(<PlayPage />)
    fireEvent.click(screen.getByRole('button', { name: /back to lobby/i }))
    expect(mockPush).toHaveBeenCalledWith('/room/ABC01?pid=p1')
  })

  it('navigates to /room/:id without pid when player id is unknown', () => {
    const finishedState: TicTacToeState = { ...baseTttState, finished: true, winner_id: 'p1' }
    const gameResult: GameFinishedPayload = { winner_id: 'p1', is_draw: false, leaderboard: [] }
    mockUseGame({ tttState: finishedState, gameResult })

    render(<PlayPage />)
    fireEvent.click(screen.getByRole('button', { name: /back to lobby/i }))
    // No pid → plain URL
    expect(mockPush).toHaveBeenCalledWith('/room/ABC01')
  })
})
