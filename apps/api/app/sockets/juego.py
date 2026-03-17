import socketio
from app.models.sala import EstadoSala
from app.services.sala_service import SalaService
from app.services.juego_service import JuegoService


def register_juego_events(sio: socketio.AsyncServer):
    sala_service = SalaService()
    juego_service = JuegoService()

    @sio.on("juego:iniciar")
    async def iniciar_juego(sid, data):
        """
        Evento: juego:iniciar
        Payload: { sala_id, jugador_id }
        Solo el host puede iniciar la partida.
        """
        sala_id = data.get("sala_id")
        jugador_id = data.get("jugador_id")

        sala = await sala_service.obtener_sala(sala_id)
        if not sala:
            await sio.emit("error", {"mensaje": "Sala no encontrada"}, to=sid)
            return

        if sala.host_id != jugador_id:
            await sio.emit("error", {"mensaje": "Solo el host puede iniciar la partida"}, to=sid)
            return

        if len(sala.jugadores) < 2:
            await sio.emit("error", {"mensaje": "Se necesitan al menos 2 jugadores"}, to=sid)
            return

        sala.estado = EstadoSala.EN_JUEGO
        await sala_service.guardar_sala(sala)

        estado_juego = await juego_service.iniciar_juego(sala)
        await sio.emit("juego:iniciado", estado_juego.model_dump(), room=sala_id)

    @sio.on("juego:carta_adivinada")
    async def carta_adivinada(sid, data):
        """
        Evento: juego:carta_adivinada
        Payload: { sala_id, jugador_id, carta_id }
        """
        sala_id = data.get("sala_id")
        await sio.emit("juego:actualizado", {"sala_id": sala_id}, room=sala_id)

    @sio.on("juego:carta_pasada")
    async def carta_pasada(sid, data):
        """
        Evento: juego:carta_pasada
        Payload: { sala_id, jugador_id, carta_id }
        """
        sala_id = data.get("sala_id")
        await sio.emit("juego:actualizado", {"sala_id": sala_id}, room=sala_id)
