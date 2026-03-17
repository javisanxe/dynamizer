from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field
import shortuuid


class EstadoSala(str, Enum):
    ESPERANDO = "esperando"   # jugadores uniéndose
    EN_JUEGO = "en_juego"     # partida activa
    TERMINADA = "terminada"   # partida finalizada


class Jugador(BaseModel):
    id: str = Field(default_factory=lambda: shortuuid.uuid()[:8])
    nombre: str = Field(min_length=1, max_length=30)
    emoji: str = Field(default="🎮", max_length=10)
    foto_url: Optional[str] = None
    puntuacion: int = 0
    es_host: bool = False
    conectado: bool = True


class ConfiguracionSala(BaseModel):
    juego: str = "times_up"
    max_jugadores: int = Field(default=8, ge=2, le=20)
    tiempo_turno: int = Field(default=30, ge=10, le=120)  # segundos
    rondas: int = Field(default=3, ge=1, le=5)
    cartas_por_jugador: int = Field(default=5, ge=3, le=10)


class Sala(BaseModel):
    id: str = Field(default_factory=lambda: shortuuid.uuid()[:6].upper())
    estado: EstadoSala = EstadoSala.ESPERANDO
    jugadores: list[Jugador] = []
    configuracion: ConfiguracionSala = ConfiguracionSala()
    host_id: Optional[str] = None

    def jugador_por_id(self, jugador_id: str) -> Optional[Jugador]:
        return next((j for j in self.jugadores if j.id == jugador_id), None)

    def esta_llena(self) -> bool:
        return len(self.jugadores) >= self.configuracion.max_jugadores
