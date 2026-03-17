import socketio
from app.models.sala import Jugador, EstadoSala
from app.services.sala_service import SalaService


def register_sala_events(sio: socketio.AsyncServer):
    service = SalaService()

    @sio.event
    async def connect(sid, environ, auth):
        print(f"[socket] conectado: {sid}")

    @sio.event
    async def disconnect(sid):
        print(f"[socket] desconectado: {sid}")

    @sio.on("sala:unirse")
    async def unirse_sala(sid, data):
        """
        Evento: sala:unirse
        Payload: { sala_id, nombre, emoji }
        """
        sala_id = data.get("sala_id")
        nombre = data.get("nombre")
        emoji = data.get("emoji", "🎮")

        sala = await service.obtener_sala(sala_id)
        if not sala:
            await sio.emit("error", {"mensaje": "Sala no encontrada"}, to=sid)
            return

        if sala.estado != EstadoSala.ESPERANDO:
            await sio.emit("error", {"mensaje": "La partida ya ha comenzado"}, to=sid)
            return

        if sala.esta_llena():
            await sio.emit("error", {"mensaje": "La sala está llena"}, to=sid)
            return

        jugador = Jugador(nombre=nombre, emoji=emoji)
        sala.jugadores.append(jugador)
        await service.guardar_sala(sala)

        await sio.enter_room(sid, sala_id)
        await sio.emit("sala:actualizada", sala.model_dump(), room=sala_id)
        await sio.emit("sala:unido", {"jugador_id": jugador.id}, to=sid)

    @sio.on("sala:salir")
    async def salir_sala(sid, data):
        """
        Evento: sala:salir
        Payload: { sala_id, jugador_id }
        """
        sala_id = data.get("sala_id")
        jugador_id = data.get("jugador_id")

        sala = await service.obtener_sala(sala_id)
        if not sala:
            return

        sala.jugadores = [j for j in sala.jugadores if j.id != jugador_id]
        await service.guardar_sala(sala)

        await sio.leave_room(sid, sala_id)
        await sio.emit("sala:actualizada", sala.model_dump(), room=sala_id)
