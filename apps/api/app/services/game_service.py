from typing import Optional

from app.models.game import GameState
from app.models.room import Room
from app.services.room_service import RoomService
from app.games.times_up.engine import TimesUpEngine
from app.games.tic_tac_toe.engine import TicTacToeEngine

GAME_ENGINES = {
    "times_up": TimesUpEngine,
    "tic_tac_toe": TicTacToeEngine,
}

GAME_STATE_TTL = 60 * 60 * 6  # 6 hours


class GameService:
    def __init__(self):
        self.room_service = RoomService()

    def get_engine(self, game: str):
        engine_cls = GAME_ENGINES.get(game)
        if not engine_cls:
            raise ValueError(f"Game '{game}' not supported")
        return engine_cls()

    async def start_game(self, room: Room) -> GameState:
        engine = self.get_engine(room.config.game)
        state = engine.initialize(room)
        await self.save_state(state)
        return state

    async def next_turn(self, state: GameState) -> GameState:
        engine = self.get_engine(state.game)
        return engine.next_turn(state)

    async def save_state(self, state: GameState) -> None:
        """Persist game state to Redis."""
        r = await self.room_service._get_redis()
        key = f"game_state:{state.room_id}"
        await r.set(key, state.model_dump_json(), ex=GAME_STATE_TTL)

    async def load_state(self, room_id: str) -> Optional[GameState]:
        """Load game state from Redis. Returns None if not found."""
        r = await self.room_service._get_redis()
        key = f"game_state:{room_id}"
        data = await r.get(key)
        if not data:
            return None
        return GameState.model_validate_json(data)
