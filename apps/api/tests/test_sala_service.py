import pytest
from unittest.mock import AsyncMock
from app.models.sala import Sala, Jugador
from app.services.sala_service import SalaService


@pytest.fixture
def service():
    return SalaService()


@pytest.fixture
def sala_ejemplo():
    sala = Sala()
    sala.jugadores.append(Jugador(nombre="Ana", emoji="🎉", es_host=True))
    return sala


class TestSalaService:
    @pytest.mark.asyncio
    async def test_guardar_y_obtener_sala(self, service, sala_ejemplo, mock_redis):
        sala_json = sala_ejemplo.model_dump_json().encode()
        mock_redis.set = AsyncMock(return_value=True)
        mock_redis.get = AsyncMock(return_value=sala_json)

        await service.guardar_sala(sala_ejemplo)
        resultado = await service.obtener_sala(sala_ejemplo.id)

        assert resultado is not None
        assert resultado.id == sala_ejemplo.id
        assert resultado.jugadores[0].nombre == "Ana"

    @pytest.mark.asyncio
    async def test_obtener_sala_inexistente(self, service, mock_redis):
        mock_redis.get = AsyncMock(return_value=None)
        resultado = await service.obtener_sala("NOEXISTE")
        assert resultado is None

    @pytest.mark.asyncio
    async def test_sala_existe_verdadero(self, service, mock_redis):
        mock_redis.exists = AsyncMock(return_value=1)
        resultado = await service.sala_existe("ABC123")
        assert resultado is True

    @pytest.mark.asyncio
    async def test_sala_existe_falso(self, service, mock_redis):
        mock_redis.exists = AsyncMock(return_value=0)
        resultado = await service.sala_existe("NOEXISTE")
        assert resultado is False

    @pytest.mark.asyncio
    async def test_eliminar_sala(self, service, mock_redis):
        mock_redis.delete = AsyncMock(return_value=1)
        await service.eliminar_sala("ABC123")
        mock_redis.delete.assert_called_once_with("sala:ABC123")
