import pytest
from httpx import AsyncClient, ASGITransport
from unittest.mock import AsyncMock, patch

from app.main import app


@pytest.fixture
async def client():
    """Async HTTP client for REST API tests."""
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        yield ac


@pytest.fixture
def mock_redis():
    """Redis mock for tests that do not require a real Redis instance."""
    with patch("app.services.room_service.aioredis.from_url") as mock:
        redis_mock = AsyncMock()
        mock.return_value = redis_mock
        yield redis_mock
