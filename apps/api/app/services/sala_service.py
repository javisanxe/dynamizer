from typing import Optional

import redis.asyncio as aioredis

from app.config import settings
from app.models.sala import Sala

SALA_TTL = 60 * 60 * 6  # 6 horas


class SalaService:
    def __init__(self):
        self._redis: Optional[aioredis.Redis] = None

    async def _get_redis(self) -> aioredis.Redis:
        if not self._redis:
            self._redis = await aioredis.from_url(settings.redis_url)
        return self._redis

    def _key(self, sala_id: str) -> str:
        return f"sala:{sala_id}"

    async def guardar_sala(self, sala: Sala) -> None:
        r = await self._get_redis()
        await r.set(self._key(sala.id), sala.model_dump_json(), ex=SALA_TTL)

    async def obtener_sala(self, sala_id: str) -> Optional[Sala]:
        r = await self._get_redis()
        data = await r.get(self._key(sala_id))
        if not data:
            return None
        return Sala.model_validate_json(data)

    async def eliminar_sala(self, sala_id: str) -> None:
        r = await self._get_redis()
        await r.delete(self._key(sala_id))

    async def sala_existe(self, sala_id: str) -> bool:
        r = await self._get_redis()
        return await r.exists(self._key(sala_id)) == 1
