from playwright.sync_api import sync_playwright
import time

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1440, "height": 900})

    page.on("pageerror", lambda err: print(f"[PAGE_ERROR] {err}"))

    # Direct navigation to /hunting
    print("=== Direct navigation to /hunting ===")
    page.goto('http://localhost:5173/hunting')
    page.wait_for_load_state('networkidle')
    time.sleep(3)
    print(f"  Current URL: {page.url}")

    # Check page content
    body_text = page.locator('body').inner_text()
    print(f"  Body text (first 200 chars): {body_text[:200]}")

    # Check if there's a Next.js error overlay
    error_overlay = page.locator('#__next-route-announcer, [data-nextjs-dialog-overlay], [data-nextjs-toast]')
    print(f"  Next.js error overlay count: {error_overlay.count()}")

    # Take screenshot
    page.screenshot(path='/tmp/nav-hunting-direct2.png', full_page=True)

    # Now try clicking sidebar links from hunting page
    print("\n=== From /hunting, clicking dashboard link ===")
    dashboard_link = page.locator('nav a[href="/dashboard"]')
    if dashboard_link.count() > 0:
        dashboard_link.first.click(timeout=5000)
        time.sleep(2)
        print(f"  Current URL: {page.url}")

    # Go back to dashboard
    page.goto('http://localhost:5173/dashboard')
    page.wait_for_load_state('networkidle')
    time.sleep(2)

    # Check what happens when we click hunting - monitor URL changes
    print("\n=== Clicking hunting link with URL monitoring ===")
    hunting_link = page.locator('nav a[href="/hunting"]')
    if hunting_link.count() > 0:
        # Click and immediately check URL
        hunting_link.first.click(timeout=5000)
        time.sleep(0.5)
        print(f"  URL after 0.5s: {page.url}")
        time.sleep(1)
        print(f"  URL after 1.5s: {page.url}")
        time.sleep(2)
        print(f"  URL after 3.5s: {page.url}")
        time.sleep(3)
        print(f"  URL after 6.5s: {page.url}")

    browser.close()
