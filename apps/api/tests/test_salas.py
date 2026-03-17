import pytest
from unittest.mock import AsyncMock, patch

from app.models.sala import Sala, EstadoSala, Jugador


class TestModeloSala:
    def test_crear_sala_defaults(self):
        sala = Sala()
        assert sala.estado == EstadoSala.ESPERANDO
        assert sala.jugadores == []
        assert len(sala.id) == 6
        assert sala.id == sala.id.upper()

    def test_crear_jugador(self):
        jugador = Jugador(nombre="Ana", emoji="🎉")
        assert jugador.nombre == "Ana"
        assert jugador.emoji == "🎉"
        assert jugador.puntuacion == 0
        assert jugador.es_host is False
        assert len(jugador.id) == 8

    def test_sala_esta_llena(self):
        sala = Sala()
        sala.configuracion.max_jugadores = 2
        sala.jugadores = [
            Jugador(nombre="Ana", emoji="🎉"),
            Jugador(nombre="Bob", emoji="🎮"),
        ]
        assert sala.esta_llena() is True

    def test_sala_no_esta_llena(self):
        sala = Sala()
        sala.configuracion.max_jugadores = 4
        sala.jugadores = [Jugador(nombre="Ana", emoji="🎉")]
        assert sala.esta_llena() is False

    def test_jugador_por_id_encontrado(self):
        jugador = Jugador(nombre="Ana", emoji="🎉")
        sala = Sala()
        sala.jugadores = [jugador]
        resultado = sala.jugador_por_id(jugador.id)
        assert resultado is not None
        assert resultado.nombre == "Ana"

    def test_jugador_por_id_no_encontrado(self):
        sala = Sala()
        resultado = sala.jugador_por_id("id-inexistente")
        assert resultado is None


class TestApiSalas:
    @pytest.mark.asyncio
    async def test_crear_sala(self, client, mock_redis):
        mock_redis.set = AsyncMock(return_value=True)

        response = await client.post(
            "/api/salas/",
            json={"nombre_host": "Ana", "emoji_host": "🎉"},
        )
        assert response.status_code == 200
        data = response.json()
        assert "sala_id" in data
        assert "jugador_id" in data
        assert "qr_url" in data
        assert data["qr_url"].startswith("/sala/")

    @pytest.mark.asyncio
    async def test_obtener_sala_no_encontrada(self, client, mock_redis):
        mock_redis.get = AsyncMock(return_value=None)

        response = await client.get("/api/salas/NOEXISTE")
        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_obtener_sala_encontrada(self, client, mock_redis):
        sala = Sala()
        sala.jugadores.append(Jugador(nombre="Ana", emoji="🎉", es_host=True))
        mock_redis.get = AsyncMock(return_value=sala.model_dump_json().encode())

        response = await client.get(f"/api/salas/{sala.id}")
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == sala.id
        assert len(data["jugadores"]) == 1
