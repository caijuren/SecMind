from playwright.sync_api import sync_playwright
import time

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1440, "height": 900})

    # Monitor all network requests with full details
    rsc_requests = []
    def on_request(req):
        if "_rsc" in req.url:
            rsc_requests.append({
                "type": "request",
                "method": req.method,
                "url": req.url,
                "headers": dict(req.headers),
            })

    def on_response(resp):
        if "_rsc" in resp.url:
            # Find matching request
            for r in rsc_requests:
                if r["url"] == resp.url and r["type"] == "request":
                    r["response_status"] = resp.status
                    r["response_headers"] = dict(resp.headers)

    page.on("request", on_request)
    page.on("response", on_response)

    # Navigate to dashboard
    page.goto('http://localhost:5173/dashboard')
    page.wait_for_load_state('networkidle')
    time.sleep(3)
    rsc_requests.clear()

    # Click pipeline link
    print("=== Clicking /pipeline ===")
    pipeline_link = page.locator('nav a[href="/pipeline"]')
    if pipeline_link.count() > 0:
        pipeline_link.first.click(force=True, timeout=5000)
        time.sleep(5)
        print(f"  URL: {page.url}")
        print(f"  RSC requests: {len(rsc_requests)}")
        for r in rsc_requests:
            print(f"  Request: {r['method']} {r['url']}")
            print(f"    Request headers:")
            for k, v in r.get('headers', {}).items():
                if k.startswith('rsc') or k.startswith('next') or k == 'accept':
                    print(f"      {k}: {v}")
            if 'response_status' in r:
                print(f"    Response status: {r['response_status']}")
                print(f"    Response headers:")
                for k, v in r.get('response_headers', {}).items():
                    if k.startswith('x-') or k == 'content-type' or k.startswith('rsc') or k.startswith('next'):
                        print(f"      {k}: {v}")
            else:
                print(f"    No response received!")
    else:
        print("  Pipeline link not found!")

    browser.close()
