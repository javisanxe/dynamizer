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
    phase: TimesUpPhase = TimesUpPhase.ROUND_1
    current_turn: Optional[Turn] = None
    player_order: list[str] = []     # player ids in turn order
    turn_index: int = 0
    deck: list[Card] = []            # cards remaining in the round
    discarded: list[Card] = []       # cards guessed in this round
    scores: dict[str, int] = {}      # player_id -> total points
    round_scores: dict[str, int] = {}  # points in this round only
