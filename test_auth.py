import urllib.request
import json
url = "https://hyydccpsvjijhzbpyarw.supabase.co/auth/v1/token?grant_type=password"
key = "sb_publishable_o-WoS8eG-ZLN17uhvppuoA_irhHqNDE"
req = urllib.request.Request(url, method='POST')
req.add_header('apikey', key)
req.add_header('Content-Type', 'application/json')
data = json.dumps({"email": "admin@commander.com", "password": "admin123"}).encode('utf-8')
try:
    with urllib.request.urlopen(req, data=data) as f:
        print("Success:", f.read().decode())
except urllib.error.HTTPError as e:
    print("Error:", e.read().decode())
