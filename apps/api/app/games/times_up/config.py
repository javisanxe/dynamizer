from pydantic import BaseModel, Field


class TimesUpConfig(BaseModel):
    turn_time: int = Field(default=30, ge=10, le=120)
    rounds: int = Field(default=3, ge=1, le=3)
    cards_per_player: int = Field(default=5, ge=3, le=10)
    allow_pass: bool = True
