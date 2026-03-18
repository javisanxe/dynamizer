from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.models.room import Room, RoomConfig, Player
from app.services.room_service import RoomService

router = APIRouter()


class CreateRoomRequest(BaseModel):
    host_name: str
    host_emoji: str = "🎮"
    config: RoomConfig = RoomConfig()


class CreateRoomResponse(BaseModel):
    room_id: str
    player_id: str
    qr_url: str


@router.post("/", response_model=CreateRoomResponse)
async def create_room(body: CreateRoomRequest):
    """Creates a new room and returns the ID + QR URL."""
    service = RoomService()
    host = Player(
        name=body.host_name,
        emoji=body.host_emoji,
        is_host=True,
    )
    room = Room(config=body.config, host_id=host.id)
    room.players.append(host)
    await service.save_room(room)
    return CreateRoomResponse(
        room_id=room.id,
        player_id=host.id,
        qr_url=f"/room/{room.id}",
    )


@router.get("/{room_id}", response_model=Room)
async def get_room(room_id: str):
    """Returns the current state of a room."""
    service = RoomService()
    room = await service.get_room(room_id)
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    return room
