import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock

# Import the FastAPI application instance and the database dependency
from main import app, get_db

# ==========================================
# Database Mocking Configuration
# ==========================================

def override_get_db():
    """
    Creates a mock database session to prevent the application from
    connecting to the real PostgreSQL database during testing.
    """
    db = MagicMock()
    yield db

# Override the default get_db dependency in FastAPI with our mock function
app.dependency_overrides[get_db] = override_get_db


# ==========================================
# Shared Pytest Fixtures
# ==========================================

@pytest.fixture
def client():
    """
    Provides a TestClient for sending HTTP requests to the FastAPI app.
    It automatically applies to any test function that includes 'client' as an argument.
    """
    # Patch SessionLocal and preload_data to intercept any real database
    # connection attempts during the application's lifespan (startup events).
    with patch("main.SessionLocal"), patch("main.gazetteer_searcher.preload_data"):
        with TestClient(app) as c:
            yield c