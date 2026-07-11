from fastapi.testclient import TestClient
from server import app
import uuid

def run_tests():
    with TestClient(app) as client:
        suffix = uuid.uuid4().hex[:6]
        test_user = {
            "full_name": f"Test User {suffix}",
            "email": f"testuser_{suffix}@example.com",
            "password": "SecurePassword123"
        }

        try:
            print("1. Registering user...")
            resp = client.post("/api/users/register", json=test_user)
            print("Register Status:", resp.status_code)
            # print("Register Response:", resp.json())
            assert resp.status_code in (200, 201), "Failed to register"
            
            user_id = resp.json()["user_id"]

            print("\n2. Logging in...")
            login_data = {
                "email": test_user["email"],
                "password": test_user["password"]
            }
            resp_login = client.post("/api/users/login", json=login_data)
            print("Login Status:", resp_login.status_code)
            # print("Login Response:", resp_login.json())
            assert resp_login.status_code == 200, "Failed to login"
            
            # Check cookies
            cookies = resp_login.cookies
            print("Cookies set:", cookies.keys())
            assert "qm_access" in cookies, "qm_access cookie missing"
            assert "qm_refresh" in cookies, "qm_refresh cookie missing"
            
            print("\n3. Fetching /me...")
            # cookies are automatically handled by TestClient for subsequent requests
            resp_me = client.get("/api/users/me")
            print("Me Status:", resp_me.status_code)
            print("Me Response:", resp_me.json())
            assert resp_me.status_code == 200, "Failed to get /me"
            assert resp_me.json()["email"] == test_user["email"], "Email mismatch"
            
            print("\n4. Getting sessions...")
            resp_sessions = client.get("/api/users/sessions")
            print("Sessions Status:", resp_sessions.status_code)
            print("Sessions Response:", resp_sessions.json())
            assert resp_sessions.status_code == 200, "Failed to get sessions"

            print("\n5. Logging out...")
            resp_logout = client.post("/api/users/logout")
            print("Logout Status:", resp_logout.status_code)
            print("Logout Response:", resp_logout.json())
            assert resp_logout.status_code == 200, "Failed to logout"

            print("\n6. Fetching /me after logout...")
            resp_me_after = client.get("/api/users/me")
            print("Me After Logout Status:", resp_me_after.status_code)
            print("Me After Logout Response:", resp_me_after.json())
            assert resp_me_after.status_code == 401, "Should be unauthorized after logout"

            print("\nALL AUTHENTICATION TESTS PASSED!")

        except Exception as e:
            print("TEST FAILED:", e)

if __name__ == "__main__":
    run_tests()
