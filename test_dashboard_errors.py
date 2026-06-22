from playwright.sync_api import sync_playwright
import time

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1440, "height": 900})

    all_errors = []
    page.on("pageerror", lambda err: all_errors.append(f"[PAGE_ERROR] {str(err)[:300]}"))
    page.on("console", lambda msg: all_errors.append(f"[{msg.type}] {msg.text[:300]}") if msg.type in ["error", "warning"] else None)

    # Navigate to dashboard
    print("=== Loading /dashboard ===")
    page.goto('http://localhost:5173/dashboard')
    page.wait_for_load_state('networkidle')
    time.sleep(5)
    print(f"  URL: {page.url}")
    print(f"  Total errors/warnings: {len(all_errors)}")
    for e in all_errors[:20]:
        print(f"    {e}")

    # Try clicking /pipeline (a simple page)
    print("\n=== Clicking /pipeline ===")
    all_errors.clear()
    pipeline_link = page.locator('nav a[href="/pipeline"]')
    print(f"  Pipeline link count: {pipeline_link.count()}")
    if pipeline_link.count() > 0:
        pipeline_link.first.click(force=True, timeout=5000)
        time.sleep(3)
        print(f"  URL: {page.url}")
        print(f"  Errors: {len(all_errors)}")
        for e in all_errors[:5]:
            print(f"    {e}")
    else:
        print("  Pipeline link not found!")

    browser.close()
