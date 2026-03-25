import { render, screen, fireEvent } from '@testing-library/react'
import TicTacToePlay from '../TicTacToePlay'
import type { TicTacToeState } from '@/types/game'
import type { Player } from '@/types/room'

const player1: Player = { id: 'p1', name: 'Javi', emoji: '🐱', score: 0, is_host: true, connected: true }
const player2: Player = { id: 'p2', name: 'Adria', emoji: '🐶', score: 0, is_host: false, connected: true }
const players = [player1, player2]

function makeState(overrides: Partial<TicTacToeState> = {}): TicTacToeState {
  return {
    room_id: 'TEST01',
    game: 'tic_tac_toe',
    board: Array(9).fill(null),
    current_player_id: 'p1',
    winner_id: null,
    is_draw: false,
    finished: false,
    scores: { p1: 0, p2: 0 },
    ...overrides,
  }
}

describe('TicTacToePlay', () => {
  it('renders a 9-cell board', () => {
    render(
      <TicTacToePlay
        state={makeState()}
        players={players}
        myPlayerId="p1"
        gameResult={null}
        onMove={jest.fn()}
      />
    )
    const cells = screen.getAllByRole('button', { name: /cell/i })
    expect(cells).toHaveLength(9)
  })

  it('shows "Your turn" when it is the current player\'s turn', () => {
    render(
      <TicTacToePlay
        state={makeState({ current_player_id: 'p1' })}
        players={players}
        myPlayerId="p1"
        gameResult={null}
        onMove={jest.fn()}
      />
    )
    expect(screen.getByText("Your turn")).toBeInTheDocument()
  })

  it("shows opponent's name when it is the other player's turn", () => {
    render(
      <TicTacToePlay
        state={makeState({ current_player_id: 'p2' })}
        players={players}
        myPlayerId="p1"
        gameResult={null}
        onMove={jest.fn()}
      />
    )
    expect(screen.getByText(/Adria's turn/)).toBeInTheDocument()
  })

  it('calls onMove with the correct cell index when clicked', () => {
    const onMove = jest.fn()
    render(
      <TicTacToePlay
        state={makeState({ current_player_id: 'p1' })}
        players={players}
        myPlayerId="p1"
        gameResult={null}
        onMove={onMove}
      />
    )
    const cells = screen.getAllByRole('button', { name: /cell/i })
    fireEvent.click(cells[4]) // center cell
    expect(onMove).toHaveBeenCalledWith(4)
  })

  it('disables all cells when it is not the player\'s turn', () => {
    render(
      <TicTacToePlay
        state={makeState({ current_player_id: 'p2' })}
        players={players}
        myPlayerId="p1"
        gameResult={null}
        onMove={jest.fn()}
      />
    )
    const cells = screen.getAllByRole('button', { name: /cell/i })
    cells.forEach((cell) => expect(cell).toBeDisabled())
  })

  it('disables all cells when the game is finished', () => {
    render(
      <TicTacToePlay
        state={makeState({ finished: true, winner_id: 'p1' })}
        players={players}
        myPlayerId="p1"
        gameResult={null}
        onMove={jest.fn()}
      />
    )
    const cells = screen.getAllByRole('button', { name: /cell/i })
    cells.forEach((cell) => expect(cell).toBeDisabled())
  })

  it('disables an occupied cell even when it is the player\'s turn', () => {
    // Cell 0 is occupied by p1; p1 is the active player
    const board: (string | null)[] = Array(9).fill(null)
    board[0] = 'p1'
    render(
      <TicTacToePlay
        state={makeState({ board, current_player_id: 'p1' })}
        players={players}
        myPlayerId="p1"
        gameResult={null}
        onMove={jest.fn()}
      />
    )
    // Cell 0 must be disabled because it is already occupied
    const cells = screen.getAllByRole('button', { name: /cell/i })
    expect(cells[0]).toBeDisabled()
    // The remaining empty cells must be enabled
    expect(cells[1]).not.toBeDisabled()
  })

  it('shows winner overlay when game is finished with a winner', () => {
    render(
      <TicTacToePlay
        state={makeState({ finished: true, winner_id: 'p1' })}
        players={players}
        myPlayerId="p1"
        gameResult={{ winner_id: 'p1', is_draw: false, leaderboard: [{ player_id: 'p1', points: 1 }, { player_id: 'p2', points: 0 }] }}
        onMove={jest.fn()}
      />
    )
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('You win!')).toBeInTheDocument()
  })

  it('shows opponent name in overlay when the local player loses', () => {
    render(
      <TicTacToePlay
        state={makeState({ finished: true, winner_id: 'p2' })}
        players={players}
        myPlayerId="p1"
        gameResult={{ winner_id: 'p2', is_draw: false, leaderboard: [{ player_id: 'p2', points: 1 }, { player_id: 'p1', points: 0 }] }}
        onMove={jest.fn()}
      />
    )
    expect(screen.getByText('Adria wins!')).toBeInTheDocument()
  })

  it('shows draw overlay when game ends in a draw', () => {
    render(
      <TicTacToePlay
        state={makeState({ finished: true, is_draw: true })}
        players={players}
        myPlayerId="p1"
        gameResult={{ winner_id: null, is_draw: true, leaderboard: [{ player_id: 'p1', points: 0 }, { player_id: 'p2', points: 0 }] }}
        onMove={jest.fn()}
      />
    )
    expect(screen.getByText('Draw!')).toBeInTheDocument()
  })

  it('highlights winning cells with ttt-cell--winner class', () => {
    // p1 wins on the top row: cells 0, 1, 2
    const board: (string | null)[] = ['p1', 'p1', 'p1', 'p2', 'p2', null, null, null, null]
    render(
      <TicTacToePlay
        state={makeState({ board, finished: true, winner_id: 'p1' })}
        players={players}
        myPlayerId="p1"
        gameResult={{ winner_id: 'p1', is_draw: false, leaderboard: [] }}
        onMove={jest.fn()}
      />
    )
    const cells = screen.getAllByRole('button', { name: /cell/i })
    expect(cells[0]).toHaveClass('ttt-cell--winner')
    expect(cells[1]).toHaveClass('ttt-cell--winner')
    expect(cells[2]).toHaveClass('ttt-cell--winner')
    // Non-winning cells must NOT have the class
    expect(cells[3]).not.toHaveClass('ttt-cell--winner')
    expect(cells[4]).not.toHaveClass('ttt-cell--winner')
  })

  it('shows leaderboard with player names and points in the result overlay', () => {
    render(
      <TicTacToePlay
        state={makeState({ finished: true, winner_id: 'p1' })}
        players={players}
        myPlayerId="p1"
        gameResult={{ winner_id: 'p1', is_draw: false, leaderboard: [{ player_id: 'p1', points: 3 }, { player_id: 'p2', points: 0 }] }}
        onMove={jest.fn()}
      />
    )
    // Scope to the result overlay to avoid collision with the always-visible players card
    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveTextContent('Javi')
    expect(dialog).toHaveTextContent('Adria')
    expect(dialog).toHaveTextContent('3 pt')
    expect(dialog).toHaveTextContent('0 pt')
  })

  it('calls onPlayAgain when "Back to lobby" is clicked', () => {
    const onPlayAgain = jest.fn()
    render(
      <TicTacToePlay
        state={makeState({ finished: true, winner_id: 'p1' })}
        players={players}
        myPlayerId="p1"
        gameResult={{ winner_id: 'p1', is_draw: false, leaderboard: [] }}
        onMove={jest.fn()}
        onPlayAgain={onPlayAgain}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: /back to lobby/i }))
    expect(onPlayAgain).toHaveBeenCalled()
  })

  it('does not show "Back to lobby" button when onPlayAgain is not provided', () => {
    render(
      <TicTacToePlay
        state={makeState({ finished: true, winner_id: 'p1' })}
        players={players}
        myPlayerId="p1"
        gameResult={{ winner_id: 'p1', is_draw: false, leaderboard: [] }}
        onMove={jest.fn()}
        // onPlayAgain deliberately omitted
      />
    )
    expect(screen.queryByRole('button', { name: /back to lobby/i })).not.toBeInTheDocument()
  })
})
