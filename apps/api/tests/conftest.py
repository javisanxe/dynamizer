import pytest
from httpx import AsyncClient, ASGITransport
from unittest.mock import AsyncMock, patch

from app.main import app


@pytest.fixture
async def client():
    """Cliente HTTP asíncrono para tests de la API REST."""
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        yield ac


@pytest.fixture
def mock_redis():
    """Mock de Redis para tests que no requieren Redis real."""
    with patch("app.services.sala_service.aioredis.from_url") as mock:
        redis_mock = AsyncMock()
        mock.return_value = redis_mock
        yield redis_mock
