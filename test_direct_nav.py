from playwright.sync_api import sync_playwright
import time

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1440, "height": 900})

    errors = []
    page.on("pageerror", lambda err: errors.append(str(err)[:300]))
    page.on("console", lambda msg: errors.append(f"[{msg.type}] {msg.text[:200]}") if msg.type == "error" else None)

    # Test each page separately with a fresh browser context
    test_pages = ['/signals', '/assets', '/hunting', '/settings', '/workflows']

    for href in test_pages:
        errors.clear()
        print(f"\n=== Direct navigation to {href} ===")
        page.goto(f'http://localhost:5173{href}')
        page.wait_for_load_state('networkidle')
        time.sleep(5)
        print(f"  URL: {page.url}")
        print(f"  Errors: {len(errors)}")
        for e in errors[:5]:
            print(f"    {e}")

    browser.close()
    print("\nDone!")
