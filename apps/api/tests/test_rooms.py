import pytest
from unittest.mock import AsyncMock, patch

from app.models.room import Room, RoomStatus, Player


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
