import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

# ==========================================
# TASK 1.14: UNIT TEST CHO REGISTRATION API
# ==========================================

def test_register_user_success():
    """Test đăng ký tài khoản thành công"""
    payload = {
        "email": "testuser_unique@example.com",
        "password": "SecurePassword123!",
        "full_name": "Nguyen Van A"
    }
    response = client.post("/api/auth/register", json=payload)
    # Nếu endpoint nhóm đặt khác (ví dụ /auth/signup), chỉ cần chỉnh lại URL
    assert response.status_code in [200, 201]


def test_register_user_invalid_email():
    """Test đăng ký với email sai định dạng"""
    payload = {
        "email": "invalid-email",
        "password": "SecurePassword123!",
        "full_name": "Nguyen Van A"
    }
    response = client.post("/api/auth/register", json=payload)
    assert response.status_code == 422


# ==========================================
# TASK 1.19: UNIT TEST CHO LOGIN API
# ==========================================

def test_login_success():
    """Test đăng nhập thành công trả về JWT Token"""
    payload = {
        "username": "testuser_unique@example.com",
        "password": "SecurePassword123!"
    }
    response = client.post("/api/auth/login", data=payload)
    if response.status_code != 200:
        response = client.post("/api/auth/login", json={"email": payload["username"], "password": payload["password"]})

    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data or "token" in data


def test_login_wrong_password():
    """Test đăng nhập sai mật khẩu"""
    payload = {
        "username": "testuser_unique@example.com",
        "password": "WrongPassword123!"
    }
    response = client.post("/api/auth/login", data=payload)
    if response.status_code != 401:
        response = client.post("/api/auth/login", json={"email": payload["username"], "password": payload["password"]})

    assert response.status_code in [400, 401]