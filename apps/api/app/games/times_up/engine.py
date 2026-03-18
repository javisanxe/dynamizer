import random
from app.models.game import GameState, TimesUpPhase, Turn
from app.models.room import Room
from app.games.times_up.cards import get_default_cards
from app.games.times_up.config import TimesUpConfig


class TimesUpEngine:
    """
    Game engine for Times Up.

    Phases:
      Round 1 — describe with words (cards can be passed)
      Round 2 — one word only (no passing)
      Round 3 — mime (no words)

    At the end of each round the deck is reset with all cards.
    Scores accumulate across rounds.
    """

    def initialize(self, room: Room, config: TimesUpConfig = TimesUpConfig()) -> GameState:
        cards = get_default_cards()
        n_cards = config.cards_per_player * len(room.players)
        deck = random.sample(cards, min(n_cards, len(cards)))

        order = [p.id for p in room.players]
        random.shuffle(order)

        return GameState(
            room_id=room.id,
            phase=TimesUpPhase.ROUND_1,
            player_order=order,
            turn_index=0,
            deck=deck,
            scores={p.id: 0 for p in room.players},
            round_scores={p.id: 0 for p in room.players},
        )

    def start_turn(self, state: GameState) -> GameState:
        player_id = state.player_order[state.turn_index]
        state.current_turn = Turn(player_id=player_id, active=True)
        return state

    def card_guessed(self, state: GameState, card_id: str) -> GameState:
        turn = state.current_turn
        if not turn or not turn.active:
            raise ValueError("No active turn")

        card = next((c for c in state.deck if c.id == card_id), None)
        if not card:
            raise ValueError(f"Card {card_id} not found in deck")

        state.deck.remove(card)
        card.guessed = True
        state.discarded.append(card)
        turn.guessed_cards.append(card_id)

        player_id = turn.player_id
        state.scores[player_id] = state.scores.get(player_id, 0) + 1
        state.round_scores[player_id] = state.round_scores.get(player_id, 0) + 1

        return state

    def card_passed(self, state: GameState, card_id: str) -> GameState:
        if state.phase != TimesUpPhase.ROUND_1:
            raise ValueError("Cards can only be passed in round 1")

        turn = state.current_turn
        if not turn or not turn.active:
            raise ValueError("No active turn")

        card = next((c for c in state.deck if c.id == card_id), None)
        if not card:
            raise ValueError(f"Card {card_id} not found")

        state.deck.remove(card)
        state.deck.append(card)
        turn.passed_cards.append(card_id)
        return state

    def end_turn(self, state: GameState) -> GameState:
        if state.current_turn:
            state.current_turn.active = False

        if not state.deck:
            return self._advance_phase(state)

        state.turn_index = (state.turn_index + 1) % len(state.player_order)
        return state

    def _advance_phase(self, state: GameState) -> GameState:
        phases = [TimesUpPhase.ROUND_1, TimesUpPhase.ROUND_2, TimesUpPhase.ROUND_3]
        current_index = phases.index(state.phase)

        if current_index >= len(phases) - 1:
            state.current_turn = None
            return state

        for card in state.discarded:
            card.guessed = False
        state.deck = state.discarded.copy()
        random.shuffle(state.deck)
        state.discarded = []
        state.round_scores = {k: 0 for k in state.scores}
        state.phase = phases[current_index + 1]
        state.turn_index = 0
        return state

    def next_turn(self, state: GameState) -> GameState:
        state = self.end_turn(state)
        if state.deck:
            state = self.start_turn(state)
        return state

    def leaderboard(self, state: GameState) -> list[dict]:
        return sorted(
            [{"player_id": k, "points": v} for k, v in state.scores.items()],
            key=lambda x: x["points"],
            reverse=True,
        )
