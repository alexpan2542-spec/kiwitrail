import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock

# 从你的主程序导入 app 和 数据库依赖
from main import app, get_db


# ==========================================
# 1. 基础配置：拦截真实数据库连接
# ==========================================

def override_get_db():
    db = MagicMock()
    yield db


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture
def client():
    # 彻底拦截 lifespan 中的预加载和真实数据库 Session，防止测试卡死
    with patch("main.SessionLocal"), patch("main.gazetteer_searcher.preload_data"):
        with TestClient(app) as c:
            yield c


# ==========================================
# 2. 测试 API: /track-info/{track_id}
# ==========================================

@patch("main.select_track_by_id")
def test_get_track_info_success(mock_select_track, client):
    # 【准备数据】模拟底层 Repository 返回一条正常的 Track 数据
    mock_select_track.return_value = {
        "id": 1,
        "name": "Milford Track",
        "difficulty": "Advanced",
        "region": "Fiordland"
    }

    # 【执行操作】发起请求
    response = client.get("/track-info/1")

    # 【断言验证】
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Milford Track"
    assert data["difficulty"] == "Advanced"

    # 验证底层函数确实被调用了1次，并且传入的参数是 1
    mock_select_track.assert_called_once()
    args, kwargs = mock_select_track.call_args
    assert args[1] == 1  # args[0] 是 mock 出来的 db session，args[1] 是 track_id


@patch("main.select_track_by_id")
def test_get_track_info_not_found(mock_select_track, client):
    # 【准备数据】模拟查询不存在的 Track，数据库返回空 (None)
    mock_select_track.return_value = None

    response = client.get("/track-info/99999")

    # 如果你的 API 层面没有抛出 404 HTTPException，正常返回 None 也是可以的
    assert response.status_code == 200
    assert response.json() is None


# ==========================================
# 3. 测试 API: /track-routes/{track_id}
# ==========================================

@patch("main.select_track_routes_by_track_id")
def test_get_track_routes_success(mock_select_routes, client):
    # 【准备数据】模拟底层返回路线的 GeoJSON 数据结构
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

    # 验证返回的数据结构是否符合 GeoJSON 规范
    assert "type" in data
    assert data["type"] == "FeatureCollection"
    assert len(data["features"]) == 1
    assert data["features"][0]["geometry"]["type"] == "LineString"

    mock_select_routes.assert_called_once()