import socketio
from app.models.room import RoomStatus
from app.services.room_service import RoomService
from app.services.game_service import GameService


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
        room_id = data.get("room_id")
        player_id = data.get("player_id")

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

    @sio.on("game:make_move")
    async def make_move(sid, data):
        """
        Event: game:make_move  (Tic-Tac-Toe)
        Payload: { room_id, player_id, cell_index }
        """
        room_id = data.get("room_id")
        player_id = data.get("player_id")
        cell_index = data.get("cell_index")

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
            await sio.emit(
                "game:finished",
                {
                    "winner_id": state.winner_id,
                    "is_draw": state.is_draw,
                    "leaderboard": leaderboard,
                },
                room=room_id,
            )

    @sio.on("game:card_guessed")
    async def card_guessed(sid, data):
        """
        Event: game:card_guessed  (Times Up)
        Payload: { room_id, player_id, card_id }
        """
        room_id = data.get("room_id")
        await sio.emit("game:updated", {"room_id": room_id}, room=room_id)

    @sio.on("game:card_passed")
    async def card_passed(sid, data):
        """
        Event: game:card_passed  (Times Up)
        Payload: { room_id, player_id, card_id }
        """
        room_id = data.get("room_id")
        await sio.emit("game:updated", {"room_id": room_id}, room=room_id)
