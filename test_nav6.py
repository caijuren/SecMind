from playwright.sync_api import sync_playwright
import time

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1440, "height": 900})

    page.on("pageerror", lambda err: print(f"[PAGE_ERROR] {err}"))

    # Start from dashboard
    page.goto('http://localhost:5173/dashboard')
    page.wait_for_load_state('networkidle')
    time.sleep(3)

    # Get all sidebar nav links
    sidebar_links = page.locator('nav a')
    link_count = sidebar_links.count()
    print(f"Found {link_count} sidebar links")

    # Test clicking each link
    for i in range(link_count):
        # Re-query to avoid stale references
        sidebar_links = page.locator('nav a')
        href = sidebar_links.nth(i).get_attribute('href')
        text = sidebar_links.nth(i).inner_text().strip()
        print(f"\n--- Testing link {i}: {text} -> {href} ---")

        if not href:
            print(f"  SKIP: no href")
            continue

        try:
            sidebar_links.nth(i).click(timeout=5000)
            time.sleep(2)
            current_url = page.url
            print(f"  Current URL: {current_url}")

            if href in current_url:
                print(f"  OK: Navigation successful")
            else:
                print(f"  ISSUE: URL mismatch!")

        except Exception as e:
            print(f"  ERROR: {e}")

        # Navigate back to dashboard for next test
        page.goto('http://localhost:5173/dashboard')
        page.wait_for_load_state('networkidle')
        time.sleep(2)

    browser.close()
    print("\nDone!")
