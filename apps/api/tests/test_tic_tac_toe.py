import pytest
from app.models.room import Room, Player
from app.models.game import GameState
from app.games.tic_tac_toe.engine import TicTacToeEngine


@pytest.fixture
def engine():
    return TicTacToeEngine()


@pytest.fixture
def two_player_room():
    room = Room()
    room.players = [
        Player(name="Javi", emoji="🐱", is_host=True),
        Player(name="Adria", emoji="🐶"),
    ]
    room.host_id = room.players[0].id
    return room


@pytest.fixture
def initial_state(engine, two_player_room):
    return engine.initialize(two_player_room)


class TestTicTacToeEngine:
    def test_initialize_creates_empty_board(self, initial_state):
        assert initial_state.board == [None] * 9

    def test_initialize_game_slug(self, initial_state):
        assert initial_state.game == "tic_tac_toe"

    def test_initialize_host_goes_first(self, initial_state, two_player_room):
        host_id = two_player_room.host_id
        assert initial_state.current_player_id == host_id

    def test_initialize_scores_at_zero(self, initial_state, two_player_room):
        for player in two_player_room.players:
            assert initial_state.scores[player.id] == 0

    def test_initialize_requires_exactly_two_players(self, engine):
        room_one = Room()
        room_one.players = [Player(name="Solo", emoji="🎮", is_host=True)]
        room_one.host_id = room_one.players[0].id

        room_three = Room()
        room_three.players = [
            Player(name="A", emoji="🎮", is_host=True),
            Player(name="B", emoji="🎮"),
            Player(name="C", emoji="🎮"),
        ]
        room_three.host_id = room_three.players[0].id

        with pytest.raises(ValueError, match="exactly 2 players"):
            engine.initialize(room_one)
        with pytest.raises(ValueError, match="exactly 2 players"):
            engine.initialize(room_three)

    def test_first_move_places_piece(self, engine, initial_state):
        player_id = initial_state.current_player_id
        state = engine.make_move(initial_state, player_id, 4)
        assert state.board[4] == player_id

    def test_turn_advances_after_move(self, engine, initial_state, two_player_room):
        first_id = initial_state.current_player_id
        second_id = next(p.id for p in two_player_room.players if p.id != first_id)
        state = engine.make_move(initial_state, first_id, 0)
        assert state.current_player_id == second_id

    def test_invalid_move_wrong_player(self, engine, initial_state, two_player_room):
        first_id = initial_state.current_player_id
        other_id = next(p.id for p in two_player_room.players if p.id != first_id)
        with pytest.raises(ValueError, match="not your turn"):
            engine.make_move(initial_state, other_id, 0)

    def test_invalid_move_occupied_cell(self, engine, initial_state, two_player_room):
        first_id = initial_state.current_player_id
        second_id = next(p.id for p in two_player_room.players if p.id != first_id)
        state = engine.make_move(initial_state, first_id, 0)
        with pytest.raises(ValueError, match="already occupied"):
            engine.make_move(state, second_id, 0)

    def test_invalid_move_out_of_range(self, engine, initial_state):
        player_id = initial_state.current_player_id
        with pytest.raises(ValueError, match="out of range"):
            engine.make_move(initial_state, player_id, 9)
        with pytest.raises(ValueError, match="out of range"):
            engine.make_move(initial_state, player_id, -1)

    def test_invalid_move_game_finished(self, engine, initial_state, two_player_room):
        state = _play_win_sequence(engine, initial_state, two_player_room)
        assert state.finished
        with pytest.raises(ValueError, match="already finished"):
            engine.make_move(state, state.winner_id, 8)

    def test_winner_row(self, engine, initial_state, two_player_room):
        """Top row: cells 0, 1, 2 for player X."""
        state = _force_winner_row(engine, initial_state, two_player_room)
        assert state.finished
        assert state.winner_id is not None
        assert not state.is_draw

    def test_winner_column(self, engine, initial_state, two_player_room):
        """Left column: cells 0, 3, 6 for player X."""
        state = _force_winner_column(engine, initial_state, two_player_room)
        assert state.finished
        assert state.winner_id is not None
        assert not state.is_draw

    def test_winner_diagonal(self, engine, initial_state, two_player_room):
        """Main diagonal: cells 0, 4, 8 for player X."""
        state = _force_winner_diagonal(engine, initial_state, two_player_room)
        assert state.finished
        assert state.winner_id is not None
        assert not state.is_draw

    def test_winner_scores_one_point(self, engine, initial_state, two_player_room):
        state = _play_win_sequence(engine, initial_state, two_player_room)
        assert state.scores[state.winner_id] == 1

    def test_loser_scores_zero(self, engine, initial_state, two_player_room):
        state = _play_win_sequence(engine, initial_state, two_player_room)
        loser_id = next(
            pid for pid in state.scores if pid != state.winner_id
        )
        assert state.scores[loser_id] == 0

    def test_draw_detection(self, engine, initial_state, two_player_room):
        """
        Force a draw with this board (X = first player, O = second):
          X O X
          X O O
          O X X
        Moves: 0(X), 1(O), 2(X), 4(O), 3(X), 5(O), 7(X), 6(O), 8(X)
        No winner — draw.
        """
        state = initial_state
        x_id = state.current_player_id
        o_id = next(pid for pid in state.scores if pid != x_id)
        moves = [
            (x_id, 0), (o_id, 1), (x_id, 2),
            (o_id, 4), (x_id, 3), (o_id, 5),
            (x_id, 7), (o_id, 6), (x_id, 8),
        ]
        for player_id, cell in moves:
            state = engine.make_move(state, player_id, cell)

        assert state.finished
        assert state.is_draw
        assert state.winner_id is None

    def test_current_player_none_when_finished(self, engine, initial_state, two_player_room):
        state = _play_win_sequence(engine, initial_state, two_player_room)
        assert state.current_player_id is None

    def test_leaderboard_winner_first(self, engine, initial_state, two_player_room):
        state = _play_win_sequence(engine, initial_state, two_player_room)
        lb = engine.leaderboard(state)
        assert lb[0]["player_id"] == state.winner_id
        assert lb[0]["points"] == 1
        assert lb[1]["points"] == 0

    def test_full_game_integration(self, engine, two_player_room):
        """Simulate a complete game from start to finish."""
        state = engine.initialize(two_player_room)
        x_id = state.current_player_id
        o_id = next(pid for pid in state.scores if pid != x_id)

        # X wins with left column: 0, 3, 6
        # O plays: 1, 4
        moves = [
            (x_id, 0), (o_id, 1),
            (x_id, 3), (o_id, 4),
            (x_id, 6),
        ]
        for player_id, cell in moves:
            state = engine.make_move(state, player_id, cell)

        assert state.finished
        assert state.winner_id == x_id
        lb = engine.leaderboard(state)
        assert lb[0]["player_id"] == x_id


# ── helpers ──────────────────────────────────────────────────────────────────

def _play_win_sequence(engine, state, room):
    """X wins top row (0, 1, 2). O plays 3, 4."""
    x_id = state.current_player_id
    o_id = next(p.id for p in room.players if p.id != x_id)
    for player_id, cell in [(x_id, 0), (o_id, 3), (x_id, 1), (o_id, 4), (x_id, 2)]:
        state = engine.make_move(state, player_id, cell)
    return state


def _force_winner_row(engine, state, room):
    return _play_win_sequence(engine, state, room)


def _force_winner_column(engine, state, room):
    """X wins left column (0, 3, 6). O plays 1, 2."""
    x_id = state.current_player_id
    o_id = next(p.id for p in room.players if p.id != x_id)
    for player_id, cell in [(x_id, 0), (o_id, 1), (x_id, 3), (o_id, 2), (x_id, 6)]:
        state = engine.make_move(state, player_id, cell)
    return state


def _force_winner_diagonal(engine, state, room):
    """X wins main diagonal (0, 4, 8). O plays 1, 2."""
    x_id = state.current_player_id
    o_id = next(p.id for p in room.players if p.id != x_id)
    for player_id, cell in [(x_id, 0), (o_id, 1), (x_id, 4), (o_id, 2), (x_id, 8)]:
        state = engine.make_move(state, player_id, cell)
    return state
