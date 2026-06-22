from playwright.sync_api import sync_playwright
import time

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1440, "height": 900})

    # Intercept network requests
    responses = []
    page.on("response", lambda resp: responses.append({
        "url": resp.url[:150],
        "status": resp.status,
        "headers": dict(resp.headers) if resp.url.includes("_rsc") else {}
    }) if "_rsc" in resp.url else None)

    # Navigate to dashboard
    page.goto('http://localhost:5173/dashboard')
    page.wait_for_load_state('networkidle')
    time.sleep(3)

    # Click pipeline link
    print("=== Clicking /pipeline ===")
    responses.clear()
    pipeline_link = page.locator('nav a[href="/pipeline"]')
    if pipeline_link.count() > 0:
        pipeline_link.first.click(force=True, timeout=5000)
        time.sleep(5)
        print(f"  URL: {page.url}")
        print(f"  RSC responses: {len(responses)}")
        for r in responses:
            print(f"    Status: {r['status']}, URL: {r['url']}")
            if r['headers']:
                for k, v in r['headers'].items():
                    if k.startswith('x-') or k == 'content-type':
                        print(f"      {k}: {v}")
    else:
        print("  Pipeline link not found!")

    browser.close()
