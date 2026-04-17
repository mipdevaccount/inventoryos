import urllib.request
import json
url = "https://hyydccpsvjijhzbpyarw.supabase.co/rest/v1/"
key = "sb_publishable_o-WoS8eG-ZLN17uhvppuoA_irhHqNDE"
req = urllib.request.Request(url, method='GET')
req.add_header('apikey', key)
try:
    with urllib.request.urlopen(req) as f:
        data = json.loads(f.read().decode())
        print(list(data['definitions'].keys()))
except Exception as e:
    print("Error:", e.read().decode() if hasattr(e, 'read') else str(e))
