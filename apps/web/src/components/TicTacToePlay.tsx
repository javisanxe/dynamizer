'use client'

import type { TicTacToeState, GameFinishedPayload } from '@/types/game'
import type { Player } from '@/types/room'

interface Props {
  state: TicTacToeState
  players: Player[]
  myPlayerId: string
  gameResult: GameFinishedPayload | null
  onMove: (cellIndex: number) => void
  onPlayAgain?: () => void
}

export default function TicTacToePlay({
  state,
  players,
  myPlayerId,
  gameResult,
  onMove,
  onPlayAgain,
}: Props) {
  const playerById = Object.fromEntries(players.map((p) => [p.id, p]))
  const isMyTurn = state.current_player_id === myPlayerId && !state.finished

  // Determine which cells are part of the winning line (for highlight)
  const winningCells = getWinningCells(state.board)

  function statusText() {
    if (state.finished) return null
    const active = playerById[state.current_player_id ?? '']
    if (!active) return null
    return state.current_player_id === myPlayerId
      ? 'Your turn'
      : `${active.emoji} ${active.name}'s turn`
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-lg)' }}>

      {/* Status line */}
      {!state.finished && (
        <p className="ttt-status">{statusText()}</p>
      )}

      {/* Board */}
      <div className="ttt-board" role="grid" aria-label="Tic-Tac-Toe board">
        {state.board.map((cell, index) => {
          const owner = cell ? playerById[cell] : null
          const isWinnerCell = winningCells.includes(index)
          const disabled = !isMyTurn || cell !== null || state.finished

          return (
            <button
              key={index}
              className={`ttt-cell${isWinnerCell ? ' ttt-cell--winner' : ''}`}
              onClick={() => onMove(index)}
              disabled={disabled}
              aria-label={owner ? `Cell ${index + 1}: ${owner.name}` : `Cell ${index + 1}: empty`}
            >
              {owner ? owner.emoji : ''}
            </button>
          )
        })}
      </div>

      {/* Scoreboard — always visible */}
      <div className="card" style={{ width: '100%', maxWidth: 320 }}>
        <p className="section-title">Players</p>
        <ul className="player-list">
          {players.map((p) => (
            <li key={p.id} className="player-item">
              <span className="player-emoji">{p.emoji}</span>
              <span className="player-name">{p.name}</span>
              {state.current_player_id === p.id && !state.finished && (
                <span className="badge badge-primary">turn</span>
              )}
            </li>
          ))}
        </ul>
      </div>

      {/* Result overlay */}
      {state.finished && (
        <div className="ttt-result-overlay" role="dialog" aria-label="Game result">
          <div className="ttt-result-card">
            {state.is_draw ? (
              <>
                <div style={{ fontSize: '3rem', marginBottom: 'var(--space-md)' }}>🤝</div>
                <h2 style={{ color: 'var(--color-text)', marginBottom: 'var(--space-sm)' }}>Draw!</h2>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                  Well played by both sides.
                </p>
              </>
            ) : (
              <>
                <div style={{ fontSize: '3rem', marginBottom: 'var(--space-md)' }}>
                  {playerById[state.winner_id ?? '']?.emoji ?? '🏆'}
                </div>
                <h2 style={{ color: 'var(--color-accent)', marginBottom: 'var(--space-sm)' }}>
                  {state.winner_id === myPlayerId ? 'You win!' : `${playerById[state.winner_id ?? '']?.name ?? 'Someone'} wins!`}
                </h2>
                {gameResult && (
                  <ul className="player-list" style={{ marginTop: 'var(--space-md)', textAlign: 'left' }}>
                    {gameResult.leaderboard.map((entry, i) => (
                      <li key={entry.player_id} className="player-item">
                        <span style={{ width: '1.5rem', fontWeight: 700, color: 'var(--color-text-muted)' }}>
                          {i + 1}.
                        </span>
                        <span className="player-emoji">{playerById[entry.player_id]?.emoji}</span>
                        <span className="player-name">{playerById[entry.player_id]?.name}</span>
                        <span className="badge badge-primary">{entry.points} pt</span>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}

            {onPlayAgain && (
              <button
                className="btn btn-primary btn-full"
                onClick={onPlayAgain}
                style={{ marginTop: 'var(--space-lg)' }}
              >
                Back to lobby
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ── helpers ──────────────────────────────────────────────────────────────────

const WINNING_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
]

function getWinningCells(board: (string | null)[]): number[] {
  for (const [a, b, c] of WINNING_LINES) {
    if (board[a] && board[a] === board[b] && board[b] === board[c]) {
      return [a, b, c]
    }
  }
  return []
}
