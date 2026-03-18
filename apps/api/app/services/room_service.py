from typing import Optional

import redis.asyncio as aioredis

from app.config import settings
from app.models.room import Room

ROOM_TTL = 60 * 60 * 6  # 6 hours


class RoomService:
    def __init__(self):
        self._redis: Optional[aioredis.Redis] = None

    async def _get_redis(self) -> aioredis.Redis:
        if not self._redis:
            self._redis = await aioredis.from_url(settings.redis_url)
        return self._redis

    def _key(self, room_id: str) -> str:
        return f"room:{room_id}"

    async def save_room(self, room: Room) -> None:
        r = await self._get_redis()
        await r.set(self._key(room.id), room.model_dump_json(), ex=ROOM_TTL)

    async def get_room(self, room_id: str) -> Optional[Room]:
        r = await self._get_redis()
        data = await r.get(self._key(room_id))
        if not data:
            return None
        return Room.model_validate_json(data)

    async def delete_room(self, room_id: str) -> None:
        r = await self._get_redis()
        await r.delete(self._key(room_id))

    async def room_exists(self, room_id: str) -> bool:
        r = await self._get_redis()
        return await r.exists(self._key(room_id)) == 1
