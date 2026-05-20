import pytest
from unittest.mock import patch


# ==========================================
# 1. Test Standard Criteria Search API: /search/items
# ==========================================

@patch("main.search_items")
def test_search_items_success(mock_search_items, client):
    # [Setup Data] Mock the result returned by the underlying search service
    mock_search_items.return_value = [
        {"id": 1, "name": "Milford Track", "type": "track", "difficulty": "Hard"}
    ]

    # [Construct Payload] Strictly following your TrackSearchRequest schema
    payload = {
        "name": "Milford",
        "difficulty": "Hard",
        "show_tracks": True,
        "show_huts": False,
        "show_campsites": False,
        "limit": 20,
        "offset": 0
    }

    # [Execution] Send the POST request to the API
    response = client.post("/search/items", json=payload)

    # [Assertions] Verify the response status and content
    assert response.status_code == 200
    data = response.json()
    assert data["count"] == 1
    assert data["items"][0]["name"] == "Milford Track"

    # Verify the underlying repository function was called exactly once
    mock_search_items.assert_called_once()


@patch("main.search_items")
def test_search_items_empty_result(mock_search_items, client):
    # [Setup Data] Mock the scenario where no results match the criteria
    mock_search_items.return_value = []

    payload = {
        "name": "NonExistentTrackXYZ",
        "limit": 20
    }

    response = client.post("/search/items", json=payload)

    assert response.status_code == 200
    assert response.json()["count"] == 0
    assert len(response.json()["items"]) == 0


# ==========================================
# 2. Test Gazetteer Spatial Search API: /search/gazetteer
# ==========================================

@patch("main.gazetteer_searcher.search")
def test_search_gazetteer_success(mock_gazetteer_search, client):
    # [Setup Data] Mock the result returned by the in-memory place name matching
    mock_gazetteer_search.return_value = [
        {"name": "Wellington", "lat": -41.2865, "lng": 174.7762}
    ]

    # [Construct Payload] Use the fuzzy_search field to trigger the fuzzy search logic
    payload = {
        "fuzzy_search": "Welling",
        "limit": 5
    }

    response = client.post("/search/gazetteer", json=payload)

    # [Assertions]
    assert response.status_code == 200
    data = response.json()
    assert data["count"] == 1
    assert data["items"][0]["name"] == "Wellington"
    assert "lat" in data["items"][0]

    mock_gazetteer_search.assert_called_once()


@patch("main.gazetteer_searcher.search")
def test_search_gazetteer_validation_error(mock_gazetteer_search, client):
    # [Boundary Test] Test Pydantic Schema validation
    # For example, limit exceeds the le=1000 constraint defined in TrackSearchRequest
    payload = {
        "fuzzy_search": "Auckland",
        "limit": 9999
    }

    response = client.post("/search/gazetteer", json=payload)

    # FastAPI will automatically intercept invalid requests using your Pydantic schema
    # and return a 422 Unprocessable Entity error before it even hits your function logic.
    assert response.status_code == 422
    assert "limit" in response.text