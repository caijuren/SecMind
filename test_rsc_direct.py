from playwright.sync_api import sync_playwright
import time
import urllib.request

# First, test the RSC endpoint directly
print("=== Testing RSC endpoint directly ===")
try:
    req = urllib.request.Request('http://localhost:5173/pipeline?_rsc=test')
    with urllib.request.urlopen(req, timeout=5) as resp:
        print(f"  Status: {resp.status}")
        print(f"  Headers: {dict(resp.headers)}")
        data = resp.read(500)
        print(f"  Body (first 500 bytes): {data}")
except Exception as e:
    print(f"  Error: {e}")

# Test without _rsc parameter
print("\n=== Testing /pipeline directly ===")
try:
    req = urllib.request.Request('http://localhost:5173/pipeline')
    with urllib.request.urlopen(req, timeout=5) as resp:
        print(f"  Status: {resp.status}")
        data = resp.read(200)
        print(f"  Body (first 200 bytes): {data}")
except Exception as e:
    print(f"  Error: {e}")
