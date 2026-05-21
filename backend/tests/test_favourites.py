from unittest.mock import patch, ANY


@patch("main.is_favourited")
def test_get_favourite_status_favoured(mock_is_favourited, client):
    mock_is_favourited.return_value = True

    response = client.get(
        "/favourites/track/10?user_email=hiker%40example.com"
    )

    assert response.status_code == 200
    data = response.json()
    assert data["item_type"] == "track"
    assert data["item_id"] == 10
    assert data["user_email"] == "hiker@example.com"
    assert data["favoured"] is True
    mock_is_favourited.assert_called_once_with(
        ANY,
        "hiker@example.com",
        "track",
        10,
    )


@patch("main.is_favourited")
def test_get_favourite_status_not_favoured(mock_is_favourited, client):
    mock_is_favourited.return_value = False

    response = client.get(
        "/favourites/hut/5?user_email=camper%40example.com"
    )

    assert response.status_code == 200
    assert response.json()["favoured"] is False


@patch("main.insert_favourite")
def test_add_favourite_success(mock_insert_favourite, client):
    mock_insert_favourite.return_value = 7

    payload = {
        "user_email": "hiker@example.com",
        "item_type": "track",
        "item_id": 10,
    }

    response = client.post("/favourites", json=payload)

    assert response.status_code == 200
    assert response.json() == {"status": "success", "favoured": True, "id": 7}
    mock_insert_favourite.assert_called_once()


@patch("main.delete_favourite")
def test_remove_favourite_success(mock_delete_favourite, client):
    mock_delete_favourite.return_value = True

    response = client.delete(
        "/favourites/campsite/3?user_email=hiker%40example.com"
    )

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["favoured"] is False
    assert data["removed"] is True
    mock_delete_favourite.assert_called_once_with(
        ANY,
        "hiker@example.com",
        "campsite",
        3,
    )


@patch("main.select_favourite_items_enriched")
def test_list_favourite_items_enriched(mock_select_enriched, client):
    mock_select_enriched.return_value = [
        {
            "id": 1,
            "name": "Routeburn Track",
            "type": "track",
            "lat": -44.7,
            "lng": 168.2,
            "thumbnail_url": "https://example.com/thumb.jpg",
            "favourited_at": "2026-05-21 10:00",
        }
    ]

    response = client.get("/favourites/items?user_email=hiker%40example.com")

    assert response.status_code == 200
    data = response.json()
    assert data["count"] == 1
    assert data["items"][0]["name"] == "Routeburn Track"
    assert data["items"][0]["thumbnail_url"] == "https://example.com/thumb.jpg"
    mock_select_enriched.assert_called_once_with(ANY, "hiker@example.com")


@patch("main.select_favourites_by_user")
def test_list_favourites(mock_select_favourites, client):
    mock_select_favourites.return_value = [
        {"item_type": "track", "item_id": 1, "created_at": "2026-05-21 10:00"}
    ]

    response = client.get("/favourites?user_email=hiker%40example.com")

    assert response.status_code == 200
    data = response.json()
    assert data["count"] == 1
    assert data["items"][0]["item_type"] == "track"
