from playwright.sync_api import sync_playwright
import time

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1440, "height": 900})

    # Monitor all network requests
    requests = []
    def on_request(req):
        if "_rsc" in req.url or "pipeline" in req.url:
            requests.append({"type": "request", "method": req.method, "url": req.url[:200]})

    def on_response(resp):
        if "_rsc" in resp.url or "pipeline" in resp.url:
            requests.append({"type": "response", "status": resp.status, "url": resp.url[:200]})

    def on_request_failed(req):
        if "_rsc" in req.url or "pipeline" in req.url:
            requests.append({"type": "failed", "url": req.url[:200], "failure": req.failure})

    page.on("request", on_request)
    page.on("response", on_response)
    page.on("requestfailed", on_request_failed)

    # Navigate to dashboard
    page.goto('http://localhost:5173/dashboard')
    page.wait_for_load_state('networkidle')
    time.sleep(3)
    requests.clear()

    # Click pipeline link
    print("=== Clicking /pipeline ===")
    pipeline_link = page.locator('nav a[href="/pipeline"]')
    if pipeline_link.count() > 0:
        pipeline_link.first.click(force=True, timeout=5000)
        time.sleep(5)
        print(f"  URL: {page.url}")
        print(f"  Network activity:")
        for r in requests:
            print(f"    {r}")
    else:
        print("  Pipeline link not found!")

    browser.close()
