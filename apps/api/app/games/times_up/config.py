from pydantic import BaseModel, Field


class TimesUpConfig(BaseModel):
    tiempo_turno: int = Field(default=30, ge=10, le=120)
    rondas: int = Field(default=3, ge=1, le=3)
    cartas_por_jugador: int = Field(default=5, ge=3, le=10)
    permitir_pasar: bool = True
