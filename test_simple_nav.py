from playwright.sync_api import sync_playwright
import time

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1440, "height": 900}")

    # Navigate directly to pipeline
    print("=== Direct navigation to /pipeline ===")
    page.goto('http://localhost:3000/pipeline')
    page.wait_for_load_state('networkidle')
    time.sleep(3)
    print(f"  URL: {page.url}")

    # Check page content
    body_text = page.evaluate("() => document.body?.innerText?.substring(0, 200) || 'empty'")
    print(f"  Body: {body_text[:100]}")

    # Check if sidebar is visible
    sidebar = page.locator('nav')
    print(f"  Sidebar visible: {sidebar.count() > 0}")

    # Click dashboard link
    print("\n=== Clicking /dashboard link ===")
    dashboard_link = page.locator('nav a[href="/dashboard"]')
    print(f"  Dashboard link count: {dashboard_link.count()}")

    if dashboard_link.count() > 0:
        # Use JavaScript click to avoid Playwright issues
        page.evaluate("""() => {
            const link = document.querySelector('nav a[href="/dashboard"]');
            if (link) link.click();
        }""")
        time.sleep(3)
        print(f"  URL after click: {page.url}")

    # Now go back to dashboard
    print("\n=== Going back to dashboard ===")
    page.goto('http://localhost:3000/dashboard')
    page.wait_for_load_state('networkidle')
    time.sleep(3)
    print(f"  URL: {page.url}")

    # Click pipeline link using JavaScript
    print("\n=== Clicking /pipeline link from dashboard ===")
    page.evaluate("""() => {
        const link = document.querySelector('nav a[href="/pipeline"]');
        if (link) link.click();
    }""")
    time.sleep(3)
    print(f"  URL after click: {page.url}")

    browser.close()
