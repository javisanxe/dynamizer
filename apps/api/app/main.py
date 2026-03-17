import socketio
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import salas
from app.sockets.sala import register_sala_events
from app.sockets.juego import register_juego_events

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
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# REST routers
app.include_router(salas.router, prefix="/api/salas", tags=["salas"])

# Socket.io event handlers
register_sala_events(sio)
register_juego_events(sio)

# Mount Socket.io into FastAPI (ASGI)
asgi_app = socketio.ASGIApp(sio, other_asgi_app=app)


@app.get("/health")
async def health():
    return {"status": "ok", "version": "0.1.0"}
