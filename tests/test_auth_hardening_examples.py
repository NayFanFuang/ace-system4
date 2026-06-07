"""
Example auth-hardening tests.

These are intended as starter tests for the ACE Platform test harness. They
assume a test client fixture that talks to an isolated test database.
"""


def test_login_rate_limit_after_five_failures(client):
    for _ in range(5):
        response = client.post("/api/auth/login", json={"email": "missing@example.com", "password": "bad-pass-1"})
        assert response.status_code == 401

    blocked = client.post("/api/auth/login", json={"email": "missing@example.com", "password": "bad-pass-1"})
    assert blocked.status_code == 429
    assert "Too many failed login attempts" in blocked.json()["detail"]


def test_login_success_returns_existing_response_shape(client, seeded_user):
    response = client.post("/api/auth/login", json={"email": seeded_user.employee_code, "password": "Valid1234"})
    assert response.status_code == 200
    body = response.json()
    assert body["token_type"] == "bearer"
    assert body["access_token"]
    assert body["user"]["employeeCode"] == seeded_user.employee_code


def test_token_version_revokes_old_tokens(client, admin_headers, seeded_user):
    login = client.post("/api/auth/login", json={"email": seeded_user.employee_code, "password": "Valid1234"})
    old_headers = {"Authorization": f"Bearer {login.json()['access_token']}"}

    forced = client.post(f"/api/auth/users/{seeded_user.employee_code}/force-logout", headers=admin_headers)
    assert forced.status_code == 200

    revoked = client.get("/api/auth/me", headers=old_headers)
    assert revoked.status_code == 401
    assert revoked.json()["detail"] == "Token has been revoked"


def test_password_policy_rejects_employee_code(client, admin_headers):
    response = client.post(
        "/api/auth/users",
        headers=admin_headers,
        json={
            "employee_code": "ACE999",
            "password": "ACE999",
            "first_name": "Test",
            "last_name": "User",
            "email": "ace999@example.com",
        },
    )
    assert response.status_code == 400
