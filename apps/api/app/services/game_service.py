from app.models.game import GameState
from app.models.room import Room
from app.services.room_service import RoomService
from app.games.times_up.engine import TimesUpEngine

GAME_ENGINES = {
    "times_up": TimesUpEngine,
}


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
        return state

    async def next_turn(self, state: GameState) -> GameState:
        engine = self.get_engine("times_up")
        return engine.next_turn(state)
