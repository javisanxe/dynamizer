import pytest
from unittest.mock import AsyncMock, MagicMock, patch

from app.models.room import Room, RoomStatus, Player
from app.sockets.room import register_room_events


class TestRoomModel:
    def test_create_room_defaults(self):
        room = Room()
        assert room.status == RoomStatus.WAITING
        assert room.players == []
        assert len(room.id) == 6
        assert room.id == room.id.upper()

    def test_create_player(self):
        player = Player(name="Ana", emoji="🎉")
        assert player.name == "Ana"
        assert player.emoji == "🎉"
        assert player.score == 0
        assert player.is_host is False
        assert len(player.id) == 8

    def test_room_is_full(self):
        room = Room()
        room.config.max_players = 2
        room.players = [
            Player(name="Ana", emoji="🎉"),
            Player(name="Bob", emoji="🎮"),
        ]
        assert room.is_full() is True

    def test_room_is_not_full(self):
        room = Room()
        room.config.max_players = 4
        room.players = [Player(name="Ana", emoji="🎉")]
        assert room.is_full() is False

    def test_get_player_by_id_found(self):
        player = Player(name="Ana", emoji="🎉")
        room = Room()
        room.players = [player]
        result = room.get_player_by_id(player.id)
        assert result is not None
        assert result.name == "Ana"

    def test_get_player_by_id_not_found(self):
        room = Room()
        result = room.get_player_by_id("nonexistent-id")
        assert result is None


class TestRoomsApi:
    @pytest.mark.asyncio
    async def test_create_room(self, client, mock_redis):
        mock_redis.set = AsyncMock(return_value=True)

        response = await client.post(
            "/api/rooms/",
            json={"host_name": "Ana", "host_emoji": "🎉"},
        )
        assert response.status_code == 200
        data = response.json()
        assert "room_id" in data
        assert "player_id" in data
        assert "qr_url" in data
        assert data["qr_url"].startswith("/room/")

    @pytest.mark.asyncio
    async def test_get_room_not_found(self, client, mock_redis):
        mock_redis.get = AsyncMock(return_value=None)

        response = await client.get("/api/rooms/NOEXIST")
        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_get_room_found(self, client, mock_redis):
        room = Room()
        room.players.append(Player(name="Ana", emoji="🎉", is_host=True))
        mock_redis.get = AsyncMock(return_value=room.model_dump_json().encode())

        response = await client.get(f"/api/rooms/{room.id}")
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == room.id
        assert len(data["players"]) == 1


class TestRoomJoinSocket:
    """Tests for the room:join socket handler reconnection logic."""

    def _make_sio(self, room: Room):
        """Build a minimal socketio mock and wire up the join handler."""
        sio = MagicMock()
        sio.on = lambda event: (lambda fn: fn)  # decorator no-op
        sio.event = lambda fn: fn               # @sio.event no-op

        emitted: list[dict] = []

        async def fake_emit(event, data=None, to=None, room=None):
            emitted.append({"event": event, "data": data, "to": to, "room": room})

        async def fake_enter_room(sid, room_id):
            pass

        sio.emit = fake_emit
        sio.enter_room = fake_enter_room

        return sio, emitted

    @pytest.mark.asyncio
    async def test_reconnect_reuses_existing_player(self):
        """Sending an existing player_id should reuse that player, not create a new one."""
        room = Room()
        host = Player(name="Alice", emoji="🐱", is_host=True)
        room.players = [host]
        room.host_id = host.id

        sio, emitted = self._make_sio(room)

        with patch("app.sockets.room.RoomService") as MockService:
            service = MockService.return_value
            service.get_room = AsyncMock(return_value=room)
            service.save_room = AsyncMock()

            register_room_events(sio)

            # Simulate the join handler directly
            from app.sockets import room as room_module
            # Re-register to capture the actual async handler
            captured = {}
            original_on = sio.on

            def capturing_on(event):
                def decorator(fn):
                    captured[event] = fn
                    return fn
                return decorator

            sio.on = capturing_on
            register_room_events(sio)

            handler = captured["room:join"]
            await handler("sid-alice", {
                "room_id": room.id,
                "name": "Alice",
                "emoji": "🐱",
                "player_id": host.id,
            })

        # No new player should have been added
        assert len(room.players) == 1
        # room:joined should have been emitted with the existing player's id
        joined_events = [e for e in emitted if e["event"] == "room:joined"]
        assert len(joined_events) == 1
        assert joined_events[0]["data"]["player_id"] == host.id

    @pytest.mark.asyncio
    async def test_unknown_player_id_creates_new_player(self):
        """Sending an unknown player_id (not in the room) creates a new player."""
        room = Room()
        host = Player(name="Alice", emoji="🐱", is_host=True)
        room.players = [host]
        room.host_id = host.id

        sio, emitted = self._make_sio(room)

        with patch("app.sockets.room.RoomService") as MockService:
            service = MockService.return_value
            service.get_room = AsyncMock(return_value=room)
            service.save_room = AsyncMock()

            captured = {}

            def capturing_on(event):
                def decorator(fn):
                    captured[event] = fn
                    return fn
                return decorator

            sio.on = capturing_on
            sio.event = lambda fn: fn
            register_room_events(sio)

            handler = captured["room:join"]
            await handler("sid-bob", {
                "room_id": room.id,
                "name": "Bob",
                "emoji": "🐶",
                "player_id": "does-not-exist",
            })

        # A new player should have been added
        assert len(room.players) == 2
        joined_events = [e for e in emitted if e["event"] == "room:joined"]
        assert len(joined_events) == 1
        new_player_id = joined_events[0]["data"]["player_id"]
        assert new_player_id != host.id
