from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.models.sala import Sala, ConfiguracionSala, Jugador
from app.services.sala_service import SalaService

router = APIRouter()


class CrearSalaRequest(BaseModel):
    nombre_host: str
    emoji_host: str = "🎮"
    configuracion: ConfiguracionSala = ConfiguracionSala()


class CrearSalaResponse(BaseModel):
    sala_id: str
    jugador_id: str
    qr_url: str


@router.post("/", response_model=CrearSalaResponse)
async def crear_sala(body: CrearSalaRequest):
    """Crea una nueva sala y devuelve el ID + QR URL."""
    service = SalaService()
    host = Jugador(
        nombre=body.nombre_host,
        emoji=body.emoji_host,
        es_host=True,
    )
    sala = Sala(configuracion=body.configuracion, host_id=host.id)
    sala.jugadores.append(host)
    await service.guardar_sala(sala)
    return CrearSalaResponse(
        sala_id=sala.id,
        jugador_id=host.id,
        qr_url=f"/sala/{sala.id}",
    )


@router.get("/{sala_id}", response_model=Sala)
async def obtener_sala(sala_id: str):
    """Devuelve el estado actual de una sala."""
    service = SalaService()
    sala = await service.obtener_sala(sala_id)
    if not sala:
        raise HTTPException(status_code=404, detail="Sala no encontrada")
    return sala
