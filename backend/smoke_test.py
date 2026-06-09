#!/usr/bin/env python3
import urllib.request, urllib.error, json, sys
from urllib.parse import urljoin
import uuid

base = 'http://127.0.0.1:8000'

def post_json(path, data):
    url = urljoin(base, path)
    req = urllib.request.Request(url, data=json.dumps(data).encode('utf-8'), headers={'Content-Type':'application/json'})
    try:
        with urllib.request.urlopen(req) as resp:
            return resp.status, json.load(resp)
    except urllib.error.HTTPError as e:
        try:
            body = e.read().decode()
            return e.code, json.loads(body)
        except Exception:
            return e.code, {'error': str(e)}
    except Exception as e:
        return None, {'error': str(e)}

def get_json(path, token=None):
    url = urljoin(base, path)
    headers = {}
    if token:
        headers['Authorization'] = f'Bearer {token}'
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req) as resp:
            return resp.status, json.load(resp)
    except urllib.error.HTTPError as e:
        try:
            body = e.read().decode()
            return e.code, json.loads(body)
        except Exception:
            return e.code, {'error': str(e)}
    except Exception as e:
        return None, {'error': str(e)}


suffix = uuid.uuid4().hex[:6]
user_a = {"full_name": "User A", "email": f"usera_{suffix}@example.com", "password": "pass123"}
user_b = {"full_name": "User B", "email": f"userb_{suffix}@example.com", "password": "pass456"}

print("Registering user A:", user_a["email"])
status_a, resp_a = post_json('/api/users/register', user_a)
print(status_a, resp_a)
print("Registering user B:", user_b["email"])
status_b, resp_b = post_json('/api/users/register', user_b)
print(status_b, resp_b)

if status_a not in (200, 201) or 'user' not in resp_a:
    print('Failed to register user A, aborting')
    sys.exit(1)
if status_b not in (200, 201) or 'user' not in resp_b:
    print('Failed to register user B, aborting')
    sys.exit(1)

id_a = resp_a['user']['_id']
id_b = resp_b['user']['_id']

print('Logging in as user A')
status_login, resp_login = post_json('/api/users/login', {"email": user_a['email'], "password": user_a['password']})
print(status_login, resp_login)
if status_login != 200 or 'access_token' not in resp_login:
    print('Login failed for user A', resp_login)
    sys.exit(1)

token_a = resp_login['access_token']
print("Fetching /api/users/me with A's token")
status_me, resp_me = get_json('/api/users/me', token=token_a)
print(status_me, resp_me)
if status_me != 200:
    print('FAIL: /me failed', resp_me)
    sys.exit(4)
if resp_me.get('_id') != id_a:
    print('FAIL: /me returned wrong user', resp_me)
    sys.exit(5)

print(f"Attempting to fetch user B ({id_b}) with A's token")
status_get, resp_get = get_json(f'/api/users/{id_b}', token=token_a)
print('GET status:', status_get)
print(resp_get)
if status_get == 403:
    print('PASS: Access denied as expected.')
    sys.exit(0)
elif status_get == 200:
    print("FAIL: A was able to access B's data!")
    sys.exit(2)
else:
    print('Unexpected response code:', status_get)
    sys.exit(3)
