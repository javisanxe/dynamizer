import logging

import socketio

from app.models.room import RoomStatus
from app.services.room_service import RoomService
from app.services.game_service import GameService

logger = logging.getLogger(__name__)


def register_game_events(sio: socketio.AsyncServer):
    room_service = RoomService()
    game_service = GameService()

    @sio.on("game:start")
    async def start_game(sid, data):
        """
        Event: game:start
        Payload: { room_id, player_id }
        Only the host can start the game.
        Tic-Tac-Toe requires exactly 2 players.
        """
        try:
            room_id = data.get("room_id")
            player_id = data.get("player_id")

            logger.debug("game:start sid=%s room=%s player=%s", sid, room_id, player_id)

            room = await room_service.get_room(room_id)
            if not room:
                await sio.emit("error", {"message": "Room not found"}, to=sid)
                return

            if room.host_id != player_id:
                await sio.emit("error", {"message": "Only the host can start the game"}, to=sid)
                return

            min_players = 2 if room.config.game == "tic_tac_toe" else 1
            max_players = 2 if room.config.game == "tic_tac_toe" else room.config.max_players

            if len(room.players) < min_players:
                await sio.emit(
                    "error",
                    {"message": f"{room.config.game} requires at least {min_players} players"},
                    to=sid,
                )
                return

            if len(room.players) > max_players:
                await sio.emit(
                    "error",
                    {"message": f"{room.config.game} supports at most {max_players} players"},
                    to=sid,
                )
                return

            room.status = RoomStatus.PLAYING
            await room_service.save_room(room)

            try:
                game_state = await game_service.start_game(room)
            except ValueError as e:
                await sio.emit("error", {"message": str(e)}, to=sid)
                return

            await sio.emit("room:updated", room.model_dump(), room=room_id)
            await sio.emit("game:started", game_state.model_dump(), room=room_id)
            logger.info("game:start room=%s game=%s players=%d", room_id, room.config.game, len(room.players))

        except Exception:
            logger.error("game:start unhandled error sid=%s data=%s", sid, data, exc_info=True)
            await sio.emit("error", {"message": "Internal server error"}, to=sid)

    @sio.on("game:make_move")
    async def make_move(sid, data):
        """
        Event: game:make_move  (Tic-Tac-Toe)
        Payload: { room_id, player_id, cell_index }
        """
        try:
            room_id = data.get("room_id")
            player_id = data.get("player_id")
            cell_index = data.get("cell_index")

            logger.debug("game:make_move sid=%s room=%s player=%s cell=%s", sid, room_id, player_id, cell_index)

            room = await room_service.get_room(room_id)
            if not room:
                await sio.emit("error", {"message": "Room not found"}, to=sid)
                return

            state = await game_service.load_state(room_id)
            if not state:
                await sio.emit("error", {"message": "Game state not found"}, to=sid)
                return

            try:
                state = game_service.get_engine(state.game).make_move(state, player_id, cell_index)
            except ValueError as e:
                await sio.emit("error", {"message": str(e)}, to=sid)
                return

            await game_service.save_state(state)
            await sio.emit("game:updated", state.model_dump(), room=room_id)

            if state.finished:
                leaderboard = game_service.get_engine(state.game).leaderboard(state)

                # Reset room to WAITING so players can return to the lobby and start again
                room.status = RoomStatus.WAITING
                for player in room.players:
                    player.score = next(
                        (entry["points"] for entry in leaderboard if entry["player_id"] == player.id),
                        player.score,
                    )
                await room_service.save_room(room)

                winner_id = state.winner_id
                if state.is_draw:
                    logger.info("game:finished room=%s result=draw", room_id)
                else:
                    logger.info("game:finished room=%s winner=%s", room_id, winner_id)

                await sio.emit(
                    "game:finished",
                    {
                        "winner_id": winner_id,
                        "is_draw": state.is_draw,
                        "leaderboard": leaderboard,
                    },
                    room=room_id,
                )
                await sio.emit("room:updated", room.model_dump(), room=room_id)

        except Exception:
            logger.error("game:make_move unhandled error sid=%s data=%s", sid, data, exc_info=True)
            await sio.emit("error", {"message": "Internal server error"}, to=sid)

    @sio.on("game:card_guessed")
    async def card_guessed(sid, data):
        """
        Event: game:card_guessed  (Times Up)
        Payload: { room_id, player_id, card_id }
        """
        try:
            room_id = data.get("room_id")
            logger.debug("game:card_guessed sid=%s room=%s", sid, room_id)
            await sio.emit("game:updated", {"room_id": room_id}, room=room_id)
        except Exception:
            logger.error("game:card_guessed unhandled error sid=%s data=%s", sid, data, exc_info=True)

    @sio.on("game:card_passed")
    async def card_passed(sid, data):
        """
        Event: game:card_passed  (Times Up)
        Payload: { room_id, player_id, card_id }
        """
        try:
            room_id = data.get("room_id")
            logger.debug("game:card_passed sid=%s room=%s", sid, room_id)
            await sio.emit("game:updated", {"room_id": room_id}, room=room_id)
        except Exception:
            logger.error("game:card_passed unhandled error sid=%s data=%s", sid, data, exc_info=True)
