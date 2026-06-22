from playwright.sync_api import sync_playwright
import time

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1440, "height": 900})

    errors = []
    page.on("pageerror", lambda err: errors.append(str(err)))
    page.on("console", lambda msg: errors.append(f"[{msg.type}] {msg.text}") if msg.type == "error" else None)

    # Test each problematic page directly
    test_pages = ['/signals', '/assets', '/hunting', '/settings']

    for path in test_pages:
        errors.clear()
        print(f"\n=== Testing {path} ===")
        page.goto(f'http://localhost:5173{path}')
        page.wait_for_load_state('networkidle')
        time.sleep(3)
        print(f"  URL: {page.url}")
        print(f"  Errors: {len(errors)}")
        for e in errors[:5]:  # Show first 5 errors
            print(f"    {e[:200]}")

    # Now test client-side navigation
    print("\n\n=== Testing client-side navigation ===")
    errors.clear()
    page.goto('http://localhost:5173/dashboard')
    page.wait_for_load_state('networkidle')
    time.sleep(2)

    for path in test_pages:
        errors.clear()
        print(f"\n--- Clicking {path} ---")
        link = page.locator(f'nav a[href="{path}"]')
        if link.count() > 0:
            link.first.click(timeout=5000)
            time.sleep(3)
            print(f"  URL: {page.url}")
            print(f"  Errors: {len(errors)}")
            for e in errors[:5]:
                print(f"    {e[:200]}")

            # Go back to dashboard
            page.goto('http://localhost:5173/dashboard')
            page.wait_for_load_state('networkidle')
            time.sleep(2)
        else:
            print(f"  Link not found!")

    browser.close()
