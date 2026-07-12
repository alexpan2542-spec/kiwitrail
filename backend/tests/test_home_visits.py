from unittest.mock import ANY, patch


@patch("main.insert_home_visit")
def test_log_home_visit_success(mock_insert, client):
    mock_insert.return_value = 42

    response = client.post(
        "/analytics/home-visit",
        json={"user_email": "hiker@example.com", "page": "home"},
        headers={
            "User-Agent": "KiwiTrailTest/1.0",
            "Referer": "https://kiwitrail.vercel.app/",
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["id"] == 42

    mock_insert.assert_called_once()
    kwargs = mock_insert.call_args.kwargs
    assert kwargs["server"] == "local"
    assert kwargs["user_agent"] == "KiwiTrailTest/1.0"
    assert kwargs["referer"] == "https://kiwitrail.vercel.app/"
    assert kwargs["user_email"] == "hiker@example.com"
    assert kwargs["page"] == "home"
    assert kwargs["ip_address"] == "testclient"


@patch("main.insert_home_visit")
def test_log_home_visit_minimal_body(mock_insert, client):
    mock_insert.return_value = 1

    response = client.post("/analytics/home-visit", json={})

    assert response.status_code == 200
    mock_insert.assert_called_once_with(
        ANY,
        server="local",
        ip_address="testclient",
        user_agent="testclient",
        referer=None,
        user_email=None,
        page="home",
    )
