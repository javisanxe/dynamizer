import logging
import time

import socketio
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from importlib.metadata import version, PackageNotFoundError
from starlette.middleware.base import BaseHTTPMiddleware

from app.config import settings
from app.logging_config import setup_logging
from app.routers import rooms
from app.sockets.room import register_room_events
from app.sockets.game import register_game_events

# ── Logging ─────────────────────────────────────────────────────────────────
setup_logging(settings.app_env)
logger = logging.getLogger(__name__)

try:
    __version__ = version("dynamizer-api")
except PackageNotFoundError:
    __version__ = "unknown"


# ── HTTP request logging middleware ─────────────────────────────────────────

class _RequestLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        start = time.perf_counter()
        response = await call_next(request)
        elapsed_ms = (time.perf_counter() - start) * 1000
        logger.info(
            "%s %s %s  %.0fms",
            request.method,
            request.url.path,
            response.status_code,
            elapsed_ms,
        )
        return response


# ── Socket.io server (async mode) ───────────────────────────────────────────
sio = socketio.AsyncServer(
    async_mode="asgi",
    cors_allowed_origins=settings.cors_origins,
    logger=settings.app_env == "development",
    engineio_logger=False,
)

# --- FastAPI app ---
app = FastAPI(
    title="Dynamizer API",
    description="Real-time social games backend",
    version=__version__,
)

app.add_middleware(_RequestLoggingMiddleware)
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
    logger.debug("health check")
    return {"status": "ok", "version": __version__}
