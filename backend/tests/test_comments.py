import pytest
from unittest.mock import patch, mock_open, ANY
import io


# ==========================================
# 1. Test GET Comments API: /comments/{item_type}/{item_id}
# ==========================================

@patch("main.select_comments_by_item")
def test_get_comments_success(mock_select_comments, client):
    # [Setup Data] Mock the database returning a list of comments for a specific track
    mock_select_comments.return_value = [
        {
            "id": 1,
            "user_name": "KiwiHiker",
            "rating": 5,
            "comment_text": "Absolutely stunning views!",
            "image_url_1": "/static/test_image.jpg"
        }
    ]

    # [Execution] Fetch comments for a track with ID 10
    response = client.get("/comments/track/10")

    # [Assertions]
    assert response.status_code == 200
    data = response.json()
    assert data["item_type"] == "track"
    assert data["item_id"] == 10
    assert data["count"] == 1
    assert data["items"][0]["user_name"] == "KiwiHiker"

    # Verify the underlying repository function was called with the correct parameters
    mock_select_comments.assert_called_once_with(
        ANY,  # Matches the mock DB session
        "track",
        10
    )


@patch("main.select_comments_by_item")
def test_get_comments_empty(mock_select_comments, client):
    # [Setup Data] Mock the scenario where a track has no comments yet
    mock_select_comments.return_value = []

    response = client.get("/comments/hut/99")

    assert response.status_code == 200
    assert response.json()["count"] == 0
    assert len(response.json()["items"]) == 0


# ==========================================
# 2. Test POST Comment API: /comments/add
# ==========================================

@patch("main.insert_user_comment")
def test_add_comment_success(mock_insert_comment, client):
    # [Setup Data] Mock the database successfully inserting the comment and returning a new ID
    mock_insert_comment.return_value = (42,)

    # [Construct Payload] Matches your Pydantic CommentSchema
    payload = {
        "item_type": "campsite",
        "item_id": 5,
        "user_name": "CamperDan",
        "rating": 4,
        "comment_text": "Great spot, but a bit windy.",
        "image_url_1": None,
        "image_url_2": None,
        "image_url_3": None
    }

    # [Execution] Send the POST request
    response = client.post("/comments/add", json=payload)

    # [Assertions]
    assert response.status_code == 200
    assert response.json() == {"status": "success", "id": 42}
    mock_insert_comment.assert_called_once()


def test_add_comment_validation_error(client):
    # [Boundary Test] Test the @model_validator logic in your CommentSchema
    # It requires EITHER text OR at least one image. If we provide neither, it should fail.
    payload = {
        "item_type": "track",
        "item_id": 1,
        "rating": 5,
        "comment_text": "",  # Empty text
        "image_url_1": None  # No images
    }

    response = client.post("/comments/add", json=payload)

    # FastAPI should intercept this using your Pydantic validator and return 422
    assert response.status_code == 422
    assert "Provide comment text and/or at least one image URL" in response.text


# ==========================================
# 3. Test Asynchronous Image Upload API: /upload-image
# ==========================================

# We patch the built-in 'open' function so the test doesn't actually create
# physical files on your hard drive during the test run.
@patch("builtins.open", new_callable=mock_open)
def test_upload_image_success(mock_file_open, client):
    # [Setup Data] Create a fake image file in memory using io.BytesIO
    fake_image_content = b"fake binary image data"
    file_like_object = io.BytesIO(fake_image_content)
    file_like_object.name = "beautiful_scenery.png"

    # Format required by TestClient for multipart/form-data file uploads
    files = {"file": ("beautiful_scenery.png", file_like_object, "image/png")}

    # [Execution]
    response = client.post("/upload-image", files=files)

    # [Assertions]
    assert response.status_code == 200
    data = response.json()

    # Check if the URL was generated correctly
    assert "url" in data
    assert data["url"].startswith("/static/")
    assert data["url"].endswith(".png")

    # Verify that the system attempted to write the file (to our mocked 'open')
    mock_file_open.assert_called_once()