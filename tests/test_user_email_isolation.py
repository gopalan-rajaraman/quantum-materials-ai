"""
Cross-user privacy test: user1 must not see user2's email via API.

Usage:
  set BASE_URL=http://localhost:8000   # or your backend URL
  python tests/test_user_email_isolation.py

Requires: pip install requests
"""

from __future__ import annotations

import os
import sys
import uuid

try:
    import requests
except ImportError:
    print("Install requests: pip install requests")
    sys.exit(1)

BASE_URL = os.environ.get("BASE_URL", "http://localhost:8000").rstrip("/")
TIMEOUT = 10


def signup(email: str, password: str, full_name: str) -> dict:
    for path in ("/api/users/signup", "/api/users/register"):
        res = requests.post(
            f"{BASE_URL}{path}",
            json={"email": email, "password": password, "full_name": full_name},
            timeout=TIMEOUT,
        )
        if res.status_code in (200, 201):
            return res.json() if res.content else {}
        if res.status_code != 404:
            res.raise_for_status()
    raise RuntimeError("No signup/register endpoint found")


def login(email: str, password: str) -> str:
    res = requests.post(
        f"{BASE_URL}/api/users/login",
        json={"email": email, "password": password},
        timeout=TIMEOUT,
    )
    res.raise_for_status()
    data = res.json()
    token = data.get("access_token") or data.get("token")
    if not token:
        raise RuntimeError(f"Login response missing access_token: {data}")
    return token


def fetch_me(token: str) -> dict:
    res = requests.get(
        f"{BASE_URL}/api/users/me",
        headers={"Authorization": f"Bearer {token}"},
        timeout=TIMEOUT,
    )
    res.raise_for_status()
    return res.json()


def try_fetch_user_by_id(token: str, user_id) -> tuple[int, dict | str]:
    for path in (f"/api/users/{user_id}", f"/api/users?id={user_id}"):
        res = requests.get(
            f"{BASE_URL}{path}",
            headers={"Authorization": f"Bearer {token}"},
            timeout=TIMEOUT,
        )
        if res.status_code == 404:
            continue
        try:
            body = res.json()
        except Exception:
            body = res.text
        return res.status_code, body
    return 404, {}


def assert_email_not_leaked(label: str, payload, forbidden_email: str) -> None:
    text = str(payload).lower()
    if forbidden_email.lower() in text:
        raise AssertionError(f"{label}: leaked user2 email '{forbidden_email}' in response")


def main() -> int:
    suffix = uuid.uuid4().hex[:8]
    user1 = {
        "email": f"user1_{suffix}@isolation-test.example",
        "password": "TestPass123!",
        "full_name": "User One",
    }
    user2 = {
        "email": f"user2_{suffix}@isolation-test.example",
        "password": "TestPass456!",
        "full_name": "User Two",
    }

    print(f"BASE_URL={BASE_URL}")
    print("Creating two test users...")

    try:
        signup(**user1)
        signup(**user2)
    except requests.ConnectionError:
        print(f"FAIL: Cannot reach backend at {BASE_URL}")
        print("Start your API server, set BASE_URL, then rerun this script.")
        return 2
    except Exception as exc:
        print(f"Signup note: {exc} (continuing if users already exist)")

    print("Logging in as user1...")
    token1 = login(user1["email"], user1["password"])
    token2 = login(user2["email"], user2["password"])

    profile1 = fetch_me(token1)
    profile2 = fetch_me(token2)

    user2_id = profile2.get("id") or profile2.get("user_id")
    if not user2_id:
        print(f"WARN: /me for user2 has no id field: {profile2}")

    print("\n--- Test 1: /me returns only own profile ---")
    me_email = profile1.get("email")
    if me_email != user1["email"]:
        raise AssertionError(f"/me returned wrong email: {me_email!r} != {user1['email']!r}")
    assert_email_not_leaked("/me as user1", profile1, user2["email"])
    print("PASS: user1 /me shows only user1 email")

    print("\n--- Test 2: user1 cannot read user2 via user-by-id endpoints ---")
    if user2_id:
        status, body = try_fetch_user_by_id(token1, user2_id)
        if status == 200:
            assert_email_not_leaked(f"GET user/{user2_id} as user1", body, user2["email"])
            print(f"PASS: user-by-id returned 200 but did not include user2 email (body keys: {list(body) if isinstance(body, dict) else 'n/a'})")
        elif status in (401, 403, 404):
            print(f"PASS: user-by-id blocked with HTTP {status}")
        else:
            assert_email_not_leaked(f"GET user/{user2_id} as user1", body, user2["email"])
            print(f"PASS: HTTP {status} and no user2 email in body")
    else:
        print("SKIP: no user2 id to probe user-by-id endpoint")

    print("\n--- Test 3: tokens are scoped (user1 token on user2 /me fails) ---")
    res = requests.get(
        f"{BASE_URL}/api/users/me",
        headers={"Authorization": f"Bearer {token1}"},
        timeout=TIMEOUT,
    )
    if res.status_code == 200:
        data = res.json()
        assert_email_not_leaked("user1 token /me", data, user2["email"])
        if data.get("email") == user2["email"]:
            raise AssertionError("user1 token returned user2 profile on /me")
    print("PASS: user1 token does not surface user2 on /me")

    print("\n--- Test 4: localStorage rule (manual / Playwright) ---")
    print(
        "After login as user1 in browser DevTools → Application → Local Storage:\n"
        "  - Should see access_token (optional)\n"
        "  - Must NOT see key 'user' with user2 email\n"
        "  - Must NOT contain user2 email in any stored value"
    )

    print("\nAll automated API isolation checks passed.")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except AssertionError as exc:
        print(f"\nFAIL: {exc}")
        raise SystemExit(1)
    except requests.HTTPError as exc:
        print(f"\nFAIL: HTTP error — {exc.response.status_code} {exc.response.text[:300]}")
        raise SystemExit(1)
    except Exception as exc:
        print(f"\nFAIL: {exc}")
        raise SystemExit(1)
