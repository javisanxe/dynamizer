import pytest
from app.models.room import Room, Player
from app.models.game import TimesUpPhase
from app.games.times_up.engine import TimesUpEngine
from app.games.times_up.cards import get_default_cards
from app.games.times_up.config import TimesUpConfig


@pytest.fixture
def room_with_players():
    room = Room()
    room.players = [
        Player(name="Ana",   emoji="🎉", is_host=True),
        Player(name="Bob",   emoji="🎮"),
        Player(name="Carol", emoji="🌟"),
    ]
    room.host_id = room.players[0].id
    return room


@pytest.fixture
def engine():
    return TimesUpEngine()


@pytest.fixture
def initial_state(engine, room_with_players):
    config = TimesUpConfig(cards_per_player=3)
    return engine.initialize(room_with_players, config)


class TestCards:
    def test_get_default_cards_returns_list(self):
        cards = get_default_cards()
        assert len(cards) > 0

    def test_cards_have_id_and_text(self):
        cards = get_default_cards()
        for c in cards:
            assert c.id
            assert c.text


class TestTimesUpEngine:
    def test_initialize_creates_state(self, initial_state, room_with_players):
        assert initial_state.room_id == room_with_players.id
        assert initial_state.phase == TimesUpPhase.ROUND_1
        assert len(initial_state.player_order) == 3
        assert len(initial_state.deck) > 0

    def test_initialize_scores_at_zero(self, initial_state, room_with_players):
        for player in room_with_players.players:
            assert initial_state.scores[player.id] == 0

    def test_start_turn(self, engine, initial_state):
        state = engine.start_turn(initial_state)
        assert state.current_turn is not None
        assert state.current_turn.active is True
        assert state.current_turn.player_id in state.player_order

    def test_card_guessed_adds_point(self, engine, initial_state):
        state = engine.start_turn(initial_state)
        card_id = state.deck[0].id
        player_id = state.current_turn.player_id

        state = engine.card_guessed(state, card_id)

        assert state.scores[player_id] == 1
        assert card_id not in [c.id for c in state.deck]
        assert card_id in [c.id for c in state.discarded]

    def test_card_guessed_without_active_turn_raises_error(self, engine, initial_state):
        card_id = initial_state.deck[0].id
        with pytest.raises(ValueError, match="No active turn"):
            engine.card_guessed(initial_state, card_id)

    def test_card_passed_in_round_1(self, engine, initial_state):
        state = engine.start_turn(initial_state)
        card_id = state.deck[0].id
        cards_before = len(state.deck)

        state = engine.card_passed(state, card_id)

        assert len(state.deck) == cards_before  # still in deck
        assert state.deck[-1].id == card_id       # at the end
        assert card_id in state.current_turn.passed_cards

    def test_card_passed_in_round_2_raises_error(self, engine, initial_state):
        state = engine.start_turn(initial_state)
        state.phase = TimesUpPhase.ROUND_2
        card_id = state.deck[0].id
        with pytest.raises(ValueError, match="Cards can only be passed in round 1"):
            engine.card_passed(state, card_id)

    def test_end_turn_advances_index(self, engine, initial_state):
        state = engine.start_turn(initial_state)
        initial_index = state.turn_index
        state = engine.end_turn(state)
        expected_index = (initial_index + 1) % len(state.player_order)
        assert state.turn_index == expected_index

    def test_leaderboard_sorted_by_points(self, engine, initial_state):
        state = engine.start_turn(initial_state)
        # Set up scores
        players = list(state.scores.keys())
        state.scores[players[0]] = 5
        state.scores[players[1]] = 10
        state.scores[players[2]] = 3

        lb = engine.leaderboard(state)
        assert lb[0]["points"] == 10
        assert lb[1]["points"] == 5
        assert lb[2]["points"] == 3

    def test_advance_phase_when_deck_empty(self, engine, room_with_players):
        config = TimesUpConfig(cards_per_player=3)
        state = engine.initialize(room_with_players, config)
        state = engine.start_turn(state)

        # Guess all cards
        while state.deck:
            card_id = state.deck[0].id
            state = engine.card_guessed(state, card_id)

        state = engine.end_turn(state)
        assert state.phase == TimesUpPhase.ROUND_2

    def test_full_game_three_rounds(self, engine, room_with_players):
        """Integration test: simulates a full game until the end."""
        config = TimesUpConfig(cards_per_player=3)
        state = engine.initialize(room_with_players, config)

        for _ in range(3):  # 3 rounds
            state = engine.start_turn(state)
            while state.deck:
                card_id = state.deck[0].id
                state = engine.card_guessed(state, card_id)
            state = engine.end_turn(state)

        # After 3 rounds, the game should be over
        assert not state.deck
        lb = engine.leaderboard(state)
        assert len(lb) == 3
