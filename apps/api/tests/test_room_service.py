import pytest
from unittest.mock import AsyncMock
from app.models.room import Room, Player
from app.services.room_service import RoomService


@pytest.fixture
def service():
    return RoomService()


@pytest.fixture
def sample_room():
    room = Room()
    room.players.append(Player(name="Julia", emoji="🎉", is_host=True))
    return room


class TestRoomService:
    @pytest.mark.asyncio
    async def test_save_and_get_room(self, service, sample_room, mock_redis):
        room_json = sample_room.model_dump_json().encode()
        mock_redis.set = AsyncMock(return_value=True)
        mock_redis.get = AsyncMock(return_value=room_json)

        await service.save_room(sample_room)
        result = await service.get_room(sample_room.id)

        assert result is not None
        assert result.id == sample_room.id
        assert result.players[0].name == "Julia"

    @pytest.mark.asyncio
    async def test_get_nonexistent_room(self, service, mock_redis):
        mock_redis.get = AsyncMock(return_value=None)
        result = await service.get_room("NOEXIST")
        assert result is None

    @pytest.mark.asyncio
    async def test_room_exists_true(self, service, mock_redis):
        mock_redis.exists = AsyncMock(return_value=1)
        result = await service.room_exists("ABC123")
        assert result is True

    @pytest.mark.asyncio
    async def test_room_exists_false(self, service, mock_redis):
        mock_redis.exists = AsyncMock(return_value=0)
        result = await service.room_exists("NOEXIST")
        assert result is False

    @pytest.mark.asyncio
    async def test_delete_room(self, service, mock_redis):
        mock_redis.delete = AsyncMock(return_value=1)
        await service.delete_room("ABC123")
        mock_redis.delete.assert_called_once_with("room:ABC123")
