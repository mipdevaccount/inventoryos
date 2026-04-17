import urllib.request
import json
url = "https://hyydccpsvjijhzbpyarw.supabase.co/rest/v1/vendors?select=*"
key = "sb_publishable_o-WoS8eG-ZLN17uhvppuoA_irhHqNDE"
req = urllib.request.Request(url, method='GET')
req.add_header('apikey', key)
req.add_header('Authorization', f'Bearer {key}')
try:
    with urllib.request.urlopen(req) as f:
        data = json.loads(f.read().decode())
        print(f"Total vendors in DB: {len(data)}")
except Exception as e:
    print("Error:", e.read().decode() if hasattr(e, 'read') else str(e))
