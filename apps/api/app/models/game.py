from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field


class TimesUpPhase(str, Enum):
    ROUND_1 = "round_1"   # describe with words
    ROUND_2 = "round_2"   # one word only
    ROUND_3 = "round_3"   # mime (no words)


class Card(BaseModel):
    id: str
    text: str
    category: Optional[str] = None
    guessed: bool = False


class Turn(BaseModel):
    player_id: str
    guessed_cards: list[str] = []   # ids of guessed cards
    passed_cards: list[str] = []    # ids of passed cards
    time_remaining: int = 0
    active: bool = False


class GameState(BaseModel):
    room_id: str
    game: str = "times_up"           # game slug — determines which fields are active

    # ── Times Up fields ──────────────────────────────────────────────────────
    phase: TimesUpPhase = TimesUpPhase.ROUND_1
    current_turn: Optional[Turn] = None
    player_order: list[str] = []     # player ids in turn order
    turn_index: int = 0
    deck: list[Card] = []            # cards remaining in the round
    discarded: list[Card] = []       # cards guessed in this round
    scores: dict[str, int] = {}      # player_id -> total points
    round_scores: dict[str, int] = {}  # points in this round only

    # ── Tic-Tac-Toe fields ───────────────────────────────────────────────────
    # board: 9 cells indexed 0-8 (row-major), value is player_id or None
    board: Optional[list[Optional[str]]] = None
    current_player_id: Optional[str] = None
    winner_id: Optional[str] = None
    is_draw: bool = False
    finished: bool = False
