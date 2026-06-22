from playwright.sync_api import sync_playwright
import time

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1440, "height": 900})

    # Collect console errors
    errors = []
    page.on("console", lambda msg: errors.append(f"[{msg.type}] {msg.text}") if msg.type in ["error", "warning"] else None)
    page.on("pageerror", lambda err: errors.append(f"[PAGE_ERROR] {err}"))

    # Test /hunting
    print("=== Testing /hunting ===")
    page.goto('http://localhost:5173/hunting')
    page.wait_for_load_state('networkidle')
    time.sleep(3)
    current_url = page.url
    print(f"  URL after navigation: {current_url}")
    page.screenshot(path='/tmp/nav-hunting.png', full_page=True)

    # Test /workflows
    print("\n=== Testing /workflows ===")
    errors.clear()
    page.goto('http://localhost:5173/workflows')
    page.wait_for_load_state('networkidle')
    time.sleep(3)
    current_url = page.url
    print(f"  URL after navigation: {current_url}")
    page.screenshot(path='/tmp/nav-workflows.png', full_page=True)

    # Test /signals
    print("\n=== Testing /signals ===")
    errors.clear()
    page.goto('http://localhost:5173/signals')
    page.wait_for_load_state('networkidle')
    time.sleep(3)
    current_url = page.url
    print(f"  URL after navigation: {current_url}")
    page.screenshot(path='/tmp/nav-signals.png', full_page=True)

    # Print all collected errors
    print("\n=== Console Errors ===")
    for e in errors:
        print(f"  {e}")

    browser.close()
