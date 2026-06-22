from playwright.sync_api import sync_playwright
import time

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1440, "height": 900})

    errors = []
    page.on("pageerror", lambda err: errors.append(str(err)[:200]))

    # Start from dashboard
    page.goto('http://localhost:5173/dashboard')
    page.wait_for_load_state('networkidle')
    time.sleep(5)

    # Test all navigation links with force click
    test_links = ['/signals', '/assets', '/hunting', '/settings', '/workflows', '/pipeline', '/investigate', '/cases']

    for href in test_links:
        errors.clear()
        print(f"\n--- Testing {href} ---")

        # Go back to dashboard
        page.goto('http://localhost:5173/dashboard')
        page.wait_for_load_state('networkidle')
        time.sleep(2)

        link = page.locator(f'nav a[href="{href}"]')
        if link.count() > 0:
            link.first.click(force=True, timeout=5000)
            time.sleep(3)
            current_url = page.url
            if href in current_url:
                print(f"  OK: Navigated to {current_url}")
            else:
                print(f"  FAIL: URL is {current_url}, expected {href}")

            if errors:
                print(f"  Page errors: {len(errors)}")
                for e in errors[:3]:
                    print(f"    {e}")
        else:
            print(f"  SKIP: Link not found")

    browser.close()
    print("\nDone!")
