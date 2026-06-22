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

    # Wait for nav to be ready
    page.wait_for_selector('nav', timeout=10000)
    time.sleep(2)

    # Test all navigation links
    test_links = ['/signals', '/assets', '/hunting', '/settings', '/workflows', '/pipeline', '/investigate', '/cases']

    for href in test_links:
        errors.clear()
        print(f"\n--- Testing {href} ---")

        # Go back to dashboard
        page.goto('http://localhost:5173/dashboard')
        page.wait_for_load_state('networkidle')
        time.sleep(3)
        page.wait_for_selector('nav a', timeout=10000)
        time.sleep(1)

        # Use JavaScript to click the link (bypass any overlay issues)
        result = page.evaluate(f"""() => {{
            const link = document.querySelector('nav a[href="{href}"]');
            if (link) {{
                link.click();
                return 'clicked';
            }}
            return 'not found';
        }}""")

        if result == 'clicked':
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
