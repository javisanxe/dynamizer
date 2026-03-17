from app.models.juego import EstadoJuego
from app.models.sala import Sala
from app.services.sala_service import SalaService
from app.games.times_up.engine import TimesUpEngine

JUEGO_ENGINES = {
    "times_up": TimesUpEngine,
}


class JuegoService:
    def __init__(self):
        self.sala_service = SalaService()

    def get_engine(self, juego: str):
        engine_cls = JUEGO_ENGINES.get(juego)
        if not engine_cls:
            raise ValueError(f"Juego '{juego}' no soportado")
        return engine_cls()

    async def iniciar_juego(self, sala: Sala) -> EstadoJuego:
        engine = self.get_engine(sala.configuracion.juego)
        estado = engine.inicializar(sala)
        return estado

    async def siguiente_turno(self, estado: EstadoJuego) -> EstadoJuego:
        engine = self.get_engine("times_up")
        return engine.siguiente_turno(estado)
