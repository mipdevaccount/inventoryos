import urllib.request
import json

key = "sb_publishable_o-WoS8eG-ZLN17uhvppuoA_irhHqNDE"

# 1. Login
url = "https://hyydccpsvjijhzbpyarw.supabase.co/auth/v1/token?grant_type=password"
req = urllib.request.Request(url, method='POST')
req.add_header('apikey', key)
req.add_header('Content-Type', 'application/json')
data = json.dumps({"email": "admin@commander.com", "password": "admin123"}).encode('utf-8')

try:
    with urllib.request.urlopen(req, data=data) as f:
        token = json.loads(f.read().decode())['access_token']

    # 2. Fetch products as authenticated user
    url_prod = "https://hyydccpsvjijhzbpyarw.supabase.co/rest/v1/products?select=*"
    req_prod = urllib.request.Request(url_prod)
    req_prod.add_header('apikey', key)
    req_prod.add_header('Authorization', f'Bearer {token}')
    
    with urllib.request.urlopen(req_prod) as f:
        data = json.loads(f.read().decode())
        print(f"Auth products fetched: {len(data)}")
except Exception as e:
    print("Error:", e.read().decode() if hasattr(e, 'read') else str(e))
