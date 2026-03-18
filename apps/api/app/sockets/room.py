import socketio
from app.models.room import Player, RoomStatus
from app.services.room_service import RoomService


def register_room_events(sio: socketio.AsyncServer):
    service = RoomService()

    @sio.event
    async def connect(sid, environ, auth):
        print(f"[socket] connected: {sid}")

    @sio.event
    async def disconnect(sid):
        print(f"[socket] disconnected: {sid}")

    @sio.on("room:join")
    async def join_room(sid, data):
        """
        Event: room:join
        Payload: { room_id, name, emoji }
        """
        room_id = data.get("room_id")
        name = data.get("name")
        emoji = data.get("emoji", "🎮")

        room = await service.get_room(room_id)
        if not room:
            await sio.emit("error", {"message": "Room not found"}, to=sid)
            return

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

    @sio.on("room:leave")
    async def leave_room(sid, data):
        """
        Event: room:leave
        Payload: { room_id, player_id }
        """
        room_id = data.get("room_id")
        player_id = data.get("player_id")

        room = await service.get_room(room_id)
        if not room:
            return

        room.players = [p for p in room.players if p.id != player_id]
        await service.save_room(room)

        await sio.leave_room(sid, room_id)
        await sio.emit("room:updated", room.model_dump(), room=room_id)
