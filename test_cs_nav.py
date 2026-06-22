from playwright.sync_api import sync_playwright
import time

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1440, "height": 900})

    page_errors = []
    page.on("pageerror", lambda err: page_errors.append(str(err)[:300]))
    page.on("console", lambda msg: page_errors.append(f"[{msg.type}] {msg.text[:300]}") if msg.type == "error" else None)

    # Navigate directly to /pipeline (not through client-side navigation)
    print("=== Direct navigation to /pipeline ===")
    page.goto('http://localhost:5173/pipeline')
    page.wait_for_load_state('networkidle')
    time.sleep(3)
    print(f"  URL: {page.url}")
    print(f"  Errors: {len(page_errors)}")
    for e in page_errors[:5]:
        print(f"    {e}")

    # Now try client-side navigation from /pipeline to /dashboard
    print("\n=== Client-side navigation from /pipeline to /dashboard ===")
    page_errors.clear()
    dashboard_link = page.locator('nav a[href="/dashboard"]')
    if dashboard_link.count() > 0:
        dashboard_link.first.click(force=True, timeout=5000)
        time.sleep(3)
        print(f"  URL: {page.url}")
        print(f"  Errors: {len(page_errors)}")
    else:
        print("  Dashboard link not found!")

    # Now try client-side navigation from /dashboard to /pipeline
    print("\n=== Client-side navigation from /dashboard to /pipeline ===")
    page_errors.clear()
    pipeline_link = page.locator('nav a[href="/pipeline"]')
    if pipeline_link.count() > 0:
        pipeline_link.first.click(force=True, timeout=5000)
        time.sleep(3)
        print(f"  URL: {page.url}")
        print(f"  Errors: {len(page_errors)}")
        for e in page_errors[:5]:
            print(f"    {e}")
    else:
        print("  Pipeline link not found!")

    browser.close()
