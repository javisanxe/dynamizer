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

        if len(room.players) < 2:
            await sio.emit("error", {"message": "At least 2 players are required"}, to=sid)
            return

        room.status = RoomStatus.PLAYING
        await room_service.save_room(room)

        game_state = await game_service.start_game(room)
        await sio.emit("game:started", game_state.model_dump(), room=room_id)

    @sio.on("game:card_guessed")
    async def card_guessed(sid, data):
        """
        Event: game:card_guessed
        Payload: { room_id, player_id, card_id }
        """
        room_id = data.get("room_id")
        await sio.emit("game:updated", {"room_id": room_id}, room=room_id)

    @sio.on("game:card_passed")
    async def card_passed(sid, data):
        """
        Event: game:card_passed
        Payload: { room_id, player_id, card_id }
        """
        room_id = data.get("room_id")
        await sio.emit("game:updated", {"room_id": room_id}, room=room_id)
