from playwright.sync_api import sync_playwright
import time

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1440, "height": 900})

    # Start from dashboard
    page.goto('http://localhost:5173/dashboard')
    page.wait_for_load_state('networkidle')
    time.sleep(3)

    # Test clicking signals link
    print("=== Clicking /signals ===")
    signals_link = page.locator('nav a[href="/signals"]')
    print(f"  Signals link count: {signals_link.count()}")

    if signals_link.count() > 0:
        # Click with force
        signals_link.first.click(force=True, timeout=5000)
        time.sleep(3)
        print(f"  URL after click: {page.url}")

        # Check if there's a Next.js error overlay
        error_overlay = page.locator('#__next-route-announcer')
        print(f"  Next.js route announcer: {error_overlay.count()}")

        # Check page content
        page.screenshot(path='/tmp/nav-signals-after-click.png', full_page=True)

    # Go back
    page.goto('http://localhost:5173/dashboard')
    page.wait_for_load_state('networkidle')
    time.sleep(2)

    # Test clicking assets link
    print("\n=== Clicking /assets ===")
    assets_link = page.locator('nav a[href="/assets"]')
    print(f"  Assets link count: {assets_link.count()}")

    if assets_link.count() > 0:
        assets_link.first.click(force=True, timeout=5000)
        time.sleep(3)
        print(f"  URL after click: {page.url}")
        page.screenshot(path='/tmp/nav-assets-after-click.png', full_page=True)

    # Go back
    page.goto('http://localhost:5173/dashboard')
    page.wait_for_load_state('networkidle')
    time.sleep(2)

    # Test clicking settings link
    print("\n=== Clicking /settings ===")
    settings_link = page.locator('nav a[href="/settings"]')
    print(f"  Settings link count: {settings_link.count()}")

    if settings_link.count() > 0:
        settings_link.first.click(force=True, timeout=5000)
        time.sleep(3)
        print(f"  URL after click: {page.url}")
        page.screenshot(path='/tmp/nav-settings-after-click.png', full_page=True)

    browser.close()
