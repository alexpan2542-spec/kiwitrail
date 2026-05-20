import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock

# Import app and database dependencies from your main program
from main import app, get_db


# ==========================================
# 1. Base Configuration: Intercept real database connections
# ==========================================

def override_get_db():
    db = MagicMock()
    yield db


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture
def client():
    # Completely intercept the preload and real database Session in lifespan
    # to prevent the test from hanging
    with patch("main.SessionLocal"), patch("main.gazetteer_searcher.preload_data"):
        with TestClient(app) as c:
            yield c


# ==========================================
# 2. Test API: /track-info/{track_id}
# ==========================================

@patch("main.select_track_by_id")
def test_get_track_info_success(mock_select_track, client):
    # [Setup Data] Mock the underlying Repository to return a normal Track record
    mock_select_track.return_value = {
        "id": 1,
        "name": "Milford Track",
        "difficulty": "Advanced",
        "region": "Fiordland"
    }

    # [Execute] Send the request
    response = client.get("/track-info/1")

    # [Assertions]
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Milford Track"
    assert data["difficulty"] == "Advanced"

    # Verify that the underlying function was called exactly once,
    # and the passed parameter is 1
    mock_select_track.assert_called_once()
    args, kwargs = mock_select_track.call_args
    assert args[1] == 1  # args[0] is the mocked db session, args[1] is the track_id


@patch("main.select_track_by_id")
def test_get_track_info_not_found(mock_select_track, client):
    # [Setup Data] Mock querying a non-existent Track, the database returns empty (None)
    mock_select_track.return_value = None

    response = client.get("/track-info/99999")

    # If your API layer doesn't raise a 404 HTTPException, returning None normally is also acceptable
    assert response.status_code == 200
    assert response.json() is None


# ==========================================
# 3. Test API: /track-routes/{track_id}
# ==========================================

@patch("main.select_track_routes_by_track_id")
def test_get_track_routes_success(mock_select_routes, client):
    # [Setup Data] Mock the underlying layer returning the route's GeoJSON data structure
    mock_select_routes.return_value = {
        "type": "FeatureCollection",
        "features": [
            {
                "type": "Feature",
                "geometry": {
                    "type": "LineString",
                    "coordinates": [
                        [167.9272, -44.7963],
                        [167.9300, -44.8000]
                    ]
                }
            }
        ]
    }

    response = client.get("/track-routes/1")

    assert response.status_code == 200
    data = response.json()

    # Verify if the returned data structure conforms to the GeoJSON specification
    assert "type" in data
    assert data["type"] == "FeatureCollection"
    assert len(data["features"]) == 1
    assert data["features"][0]["geometry"]["type"] == "LineString"

    mock_select_routes.assert_called_once()