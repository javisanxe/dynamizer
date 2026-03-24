import socketio
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from importlib.metadata import version, PackageNotFoundError

from app.config import settings
from app.routers import rooms
from app.sockets.room import register_room_events
from app.sockets.game import register_game_events

try:
    __version__ = version("dynamizer-api")
except PackageNotFoundError:
    __version__ = "unknown"

# --- Socket.io server (async mode) ---
sio = socketio.AsyncServer(
    async_mode="asgi",
    cors_allowed_origins=settings.cors_origins,
    logger=False,
    engineio_logger=False,
)

# --- FastAPI app ---
app = FastAPI(
    title="Dynamizer API",
    description="Real-time social games backend",
    version=__version__,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# REST routers
app.include_router(rooms.router, prefix="/api/rooms", tags=["rooms"])

# Socket.io event handlers
register_room_events(sio)
register_game_events(sio)

# Mount Socket.io into FastAPI (ASGI)
asgi_app = socketio.ASGIApp(sio, other_asgi_app=app)


@app.get("/health")
async def health():
    return {"status": "ok", "version": __version__}
