import logging

import socketio

from app.models.room import Player, RoomStatus
from app.services.room_service import RoomService
from app.services.game_service import GameService

logger = logging.getLogger(__name__)


def register_room_events(sio: socketio.AsyncServer):
    service = RoomService()
    game_service = GameService()

    @sio.event
    async def connect(sid, environ, auth):
        logger.info("connect sid=%s", sid)

    @sio.event
    async def disconnect(sid):
        logger.info("disconnect sid=%s", sid)

    @sio.on("room:join")
    async def join_room(sid, data):
        """
        Event: room:join
        Payload: { room_id, name, emoji, player_id? }

        If player_id is provided and matches an existing player in the room,
        the socket is reconnected to that player (no new player created).
        If the game is already in progress, the current game state is also sent.
        Otherwise a new player is created and added to the room.
        """
        try:
            room_id = data.get("room_id")
            name = data.get("name")
            emoji = data.get("emoji", "🎮")
            existing_player_id = data.get("player_id")

            logger.debug("room:join sid=%s room=%s player_id=%s", sid, room_id, existing_player_id)

            room = await service.get_room(room_id)
            if not room:
                logger.warning("room:join room not found room=%s sid=%s", room_id, sid)
                await sio.emit("error", {"message": "Room not found"}, to=sid)
                return

            # Reconnection: player already exists in the room
            existing_player = room.get_player_by_id(existing_player_id) if existing_player_id else None
            if existing_player:
                await sio.enter_room(sid, room_id)
                await sio.emit("room:joined", {"player_id": existing_player.id}, to=sid)
                await sio.emit("room:updated", room.model_dump(), to=sid)
                # If a game is in progress, also send the current game state so the
                # play page can render immediately without waiting for a new game:started
                if room.status == RoomStatus.PLAYING:
                    game_state = await game_service.load_state(room_id)
                    if game_state:
                        await sio.emit("game:started", game_state.model_dump(), to=sid)
                logger.info("room:join reconnect room=%s player=%s sid=%s", room_id, existing_player.id, sid)
                return

            # New player joining
            if room.status != RoomStatus.WAITING:
                await sio.emit("error", {"message": "The game has already started"}, to=sid)
                return

            if room.is_full():
                await sio.emit("error", {"message": "The room is full"}, to=sid)
                return

            player = Player(name=name, emoji=emoji)
            room.players.append(player)
            await service.save_room(room)

            await sio.enter_room(sid, room_id)
            await sio.emit("room:updated", room.model_dump(), room=room_id)
            await sio.emit("room:joined", {"player_id": player.id}, to=sid)
            logger.info("room:join new player room=%s player=%s name=%s sid=%s", room_id, player.id, name, sid)

        except Exception:
            logger.error("room:join unhandled error sid=%s data=%s", sid, data, exc_info=True)
            await sio.emit("error", {"message": "Internal server error"}, to=sid)

    @sio.on("room:leave")
    async def leave_room(sid, data):
        """
        Event: room:leave
        Payload: { room_id, player_id }
        """
        try:
            room_id = data.get("room_id")
            player_id = data.get("player_id")

            logger.debug("room:leave sid=%s room=%s player=%s", sid, room_id, player_id)

            room = await service.get_room(room_id)
            if not room:
                return

            room.players = [p for p in room.players if p.id != player_id]
            await service.save_room(room)

            await sio.leave_room(sid, room_id)
            await sio.emit("room:updated", room.model_dump(), room=room_id)
            logger.info("room:leave room=%s player=%s sid=%s", room_id, player_id, sid)

        except Exception:
            logger.error("room:leave unhandled error sid=%s data=%s", sid, data, exc_info=True)
