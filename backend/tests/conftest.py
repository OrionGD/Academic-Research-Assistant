"""
Shared pytest fixtures for test suite.
"""
import pytest
from unittest.mock import Mock, AsyncMock, MagicMock
from typing import Generator, AsyncGenerator, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.pool import StaticPool
import asyncio
from datetime import datetime, timezone

from app.core.config import settings
from app.db.base import Base
from app.core.security import get_password_hash
from app.models.user import User
from app.models.item import Item


# ----------------------------
# Database Fixtures
# ----------------------------
@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="session")
async def test_engine():
    """Create test database engine."""
    engine = create_async_engine(
        "sqlite+aiosqlite:///:memory:",
        echo=False,
        poolclass=StaticPool,
        connect_args={"check_same_thread": False}
    )
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    yield engine
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    
    await engine.dispose()


@pytest.fixture
async def db_session(test_engine) -> AsyncGenerator[AsyncSession, None]:
    """Create a fresh database session for each test."""
    async_session = async_sessionmaker(
        test_engine,
        class_=AsyncSession,
        expire_on_commit=False,
        autocommit=False,
        autoflush=False,
    )
    
    async with async_session() as session:
        yield session
        await session.rollback()


# ----------------------------
# Test Data Fixtures
# ----------------------------
@pytest.fixture
def test_user_data() -> Dict[str, Any]:
    """Test user data."""
    return {
        "email": "test@example.com",
        "username": "testuser",
        "full_name": "Test User",
        "password": "testpassword123",
        "is_active": True,
        "is_superuser": False,
    }


@pytest.fixture
async def test_user(db_session: AsyncSession, test_user_data: Dict[str, Any]) -> User:
    """Create and return a test user."""
    user = User(
        email=test_user_data["email"],
        username=test_user_data["username"],
        full_name=test_user_data["full_name"],
        hashed_password=get_password_hash(test_user_data["password"]),
        is_active=test_user_data["is_active"],
        is_superuser=test_user_data["is_superuser"],
    )
    
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest.fixture
def test_item_data() -> Dict[str, Any]:
    """Test item data."""
    return {
        "title": "Test Item",
        "description": "Test item description",
        "price": 99.99,
        "tax": 9.99,
    }


@pytest.fixture
async def test_item(db_session: AsyncSession, test_user: User, test_item_data: Dict[str, Any]) -> Item:
    """Create and return a test item."""
    item = Item(
        **test_item_data,
        owner_id=test_user.id,
    )
    
    db_session.add(item)
    await db_session.commit()
    await db_session.refresh(item)
    return item


# ----------------------------
# Mock Fixtures
# ----------------------------
@pytest.fixture
def mock_cache():
    """Mock cache service."""
    mock = AsyncMock()
    mock.get.return_value = None
    mock.set.return_value = True
    mock.delete.return_value = True
    return mock


@pytest.fixture
def mock_external_api():
    """Mock external API service."""
    mock = AsyncMock()
    mock.fetch_data.return_value = {"status": "success", "data": "mocked"}
    mock.validate.return_value = True
    return mock


@pytest.fixture
def mock_email_service():
    """Mock email service."""
    mock = AsyncMock()
    mock.send.return_value = {"message_id": "test-123", "status": "sent"}
    mock.send_bulk.return_value = {"success": 5, "failed": 0}
    return mock


@pytest.fixture
def mock_file_storage():
    """Mock file storage service."""
    mock = AsyncMock()
    mock.upload.return_value = "https://example.com/file.jpg"
    mock.delete.return_value = True
    mock.get_presigned_url.return_value = "https://example.com/signed-url"
    return mock


# ----------------------------
# Client Fixtures
# ----------------------------
@pytest.fixture
def headers(test_user: User) -> Dict[str, str]:
    """Generate auth headers for test user."""
    # This would normally create a JWT token
    # For testing, we'll use a mock token
    return {
        "Authorization": f"Bearer mock-jwt-token-for-{test_user.id}",
        "Content-Type": "application/json",
    }


@pytest.fixture
def test_client():
    """Override this in your app's conftest.py to provide FastAPI test client."""
    raise NotImplementedError("Override this fixture in your app's conftest.py")


# ----------------------------
# Configuration Fixtures
# ----------------------------
@pytest.fixture(autouse=True)
def test_config(monkeypatch):
    """Set test configuration."""
    monkeypatch.setenv("ENVIRONMENT", "testing")
    monkeypatch.setenv("DATABASE_URL", "sqlite+aiosqlite:///:memory:")
    monkeypatch.setenv("SECRET_KEY", "test-secret-key-for-testing-only")
    monkeypatch.setenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30")
    
    # Disable rate limiting in tests
    monkeypatch.setenv("RATE_LIMIT_ENABLED", "false")
    
    # Use memory cache for testing
    monkeypatch.setenv("REDIS_URL", "")
    
    return settings