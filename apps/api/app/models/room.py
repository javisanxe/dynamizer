from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field
import shortuuid


class RoomStatus(str, Enum):
    WAITING = "waiting"     # players joining
    PLAYING = "playing"     # game in progress
    FINISHED = "finished"   # game ended


class Player(BaseModel):
    id: str = Field(default_factory=lambda: shortuuid.uuid()[:8])
    name: str = Field(min_length=1, max_length=30)
    emoji: str = Field(default="🎮", max_length=10)
    photo_url: Optional[str] = None
    score: int = 0
    is_host: bool = False
    connected: bool = True


class RoomConfig(BaseModel):
    game: str = "times_up"
    max_players: int = Field(default=8, ge=2, le=20)
    turn_time: int = Field(default=30, ge=10, le=120)  # seconds
    rounds: int = Field(default=3, ge=1, le=5)
    cards_per_player: int = Field(default=5, ge=3, le=10)


class Room(BaseModel):
    id: str = Field(default_factory=lambda: shortuuid.uuid()[:6].upper())
    status: RoomStatus = RoomStatus.WAITING
    players: list[Player] = []
    config: RoomConfig = RoomConfig()
    host_id: Optional[str] = None

    def get_player_by_id(self, player_id: str) -> Optional[Player]:
        return next((p for p in self.players if p.id == player_id), None)

    def is_full(self) -> bool:
        return len(self.players) >= self.config.max_players
