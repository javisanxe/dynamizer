from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field


class FaseTimesUp(str, Enum):
    RONDA_1 = "ronda_1"   # describir con palabras
    RONDA_2 = "ronda_2"   # una sola palabra
    RONDA_3 = "ronda_3"   # mímica


class Carta(BaseModel):
    id: str
    texto: str
    categoria: Optional[str] = None
    adivinada: bool = False


class Turno(BaseModel):
    jugador_id: str
    cartas_adivinadas: list[str] = []   # ids de cartas adivinadas
    cartas_pasadas: list[str] = []      # ids de cartas pasadas
    tiempo_restante: int = 0
    activo: bool = False


class EstadoJuego(BaseModel):
    sala_id: str
    fase: FaseTimesUp = FaseTimesUp.RONDA_1
    turno_actual: Optional[Turno] = None
    orden_jugadores: list[str] = []     # ids en orden de turno
    indice_turno: int = 0
    mazo: list[Carta] = []              # cartas pendientes en la ronda
    descartadas: list[Carta] = []       # cartas adivinadas en esta ronda
    puntuaciones: dict[str, int] = {}   # jugador_id -> puntos totales
    ronda_puntuaciones: dict[str, int] = {}  # puntos solo de esta ronda
