from typing import Optional

from app.models.game import GameState
from app.models.room import Room
from app.games.tic_tac_toe.config import TicTacToeConfig

# All winning combinations: rows, columns, diagonals
WINNING_LINES = [
    (0, 1, 2), (3, 4, 5), (6, 7, 8),  # rows
    (0, 3, 6), (1, 4, 7), (2, 5, 8),  # columns
    (0, 4, 8), (2, 4, 6),             # diagonals
]


class TicTacToeEngine:
    def initialize(
        self, room: Room, config: TicTacToeConfig = TicTacToeConfig()
    ) -> GameState:
        """
        Create a fresh GameState for Tic-Tac-Toe.
        Requires exactly 2 players; raises ValueError otherwise.
        Player order: host goes first (X), the other player goes second (O).
        """
        if len(room.players) != 2:
            raise ValueError("Tic-Tac-Toe requires exactly 2 players")

        # Host plays first
        ordered = sorted(room.players, key=lambda p: (not p.is_host, p.name))
        first_player_id = ordered[0].id

        return GameState(
            room_id=room.id,
            game="tic_tac_toe",
            board=[None] * 9,
            current_player_id=first_player_id,
            scores={p.id: 0 for p in room.players},
            winner_id=None,
            is_draw=False,
            finished=False,
        )

    def make_move(self, state: GameState, player_id: str, cell_index: int) -> GameState:
        """
        Place a piece on the board.

        Raises ValueError if:
        - It is not the player's turn.
        - The cell index is out of range.
        - The cell is already occupied.
        - The game is already finished.
        """
        if state.finished:
            raise ValueError("Game is already finished")

        if state.current_player_id != player_id:
            raise ValueError("It is not your turn")

        if cell_index < 0 or cell_index > 8:
            raise ValueError(f"Cell index {cell_index} is out of range (0-8)")

        if state.board[cell_index] is not None:
            raise ValueError(f"Cell {cell_index} is already occupied")

        # Place piece (mutate a copy of the board)
        new_board = list(state.board)
        new_board[cell_index] = player_id
        state.board = new_board

        # Check for a winner
        winner_id = self._check_winner(state.board)
        if winner_id:
            state.winner_id = winner_id
            state.scores[winner_id] = 1
            state.finished = True
            state.current_player_id = None
            return state

        # Check for a draw (all cells filled, no winner)
        if all(cell is not None for cell in state.board):
            state.is_draw = True
            state.finished = True
            state.current_player_id = None
            return state

        # Advance turn: find the other player
        player_ids = [pid for pid in state.scores]
        state.current_player_id = next(
            pid for pid in player_ids if pid != player_id
        )
        return state

    def _check_winner(self, board: list[Optional[str]]) -> Optional[str]:
        """Return the player_id of the winner, or None if there is none yet."""
        for a, b, c in WINNING_LINES:
            if board[a] and board[a] == board[b] == board[c]:
                return board[a]
        return None

    def leaderboard(self, state: GameState) -> list[dict]:
        """Return [{player_id, points}] sorted by points descending."""
        return sorted(
            [{"player_id": pid, "points": pts} for pid, pts in state.scores.items()],
            key=lambda x: x["points"],
            reverse=True,
        )
