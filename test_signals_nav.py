from playwright.sync_api import sync_playwright
import time

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1440, "height": 900})

    all_errors = []
    page.on("pageerror", lambda err: all_errors.append(str(err)[:300]))
    page.on("console", lambda msg: all_errors.append(f"[{msg.type}] {msg.text[:200]}") if msg.type == "error" else None)

    # Direct navigation to signals page
    print("=== Direct navigation to /signals ===")
    page.goto('http://localhost:5173/signals')
    page.wait_for_load_state('networkidle')
    time.sleep(3)
    print(f"  URL: {page.url}")
    print(f"  Errors: {len(all_errors)}")

    # Now try clicking sidebar links from the signals page
    print("\n=== From /signals, clicking /dashboard ===")
    all_errors.clear()
    dashboard_link = page.locator('nav a[href="/dashboard"]')
    if dashboard_link.count() > 0:
        dashboard_link.first.click(force=True, timeout=5000)
        time.sleep(3)
        print(f"  URL: {page.url}")
    else:
        print("  Dashboard link not found!")

    # Now try clicking /signals from dashboard
    print("\n=== From /dashboard, clicking /signals ===")
    all_errors.clear()
    signals_link = page.locator('nav a[href="/signals"]')
    print(f"  Signals link count: {signals_link.count()}")
    if signals_link.count() > 0:
        signals_link.first.click(force=True, timeout=5000)
        time.sleep(3)
        print(f"  URL: {page.url}")
        print(f"  Errors: {len(all_errors)}")
        for e in all_errors[:5]:
            print(f"    {e}")
    else:
        print("  Signals link not found!")

    browser.close()
