from playwright.sync_api import sync_playwright
import time

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1440, "height": 900})

    errors = []
    page.on("pageerror", lambda err: errors.append(str(err)[:300]))

    # Start from dashboard
    page.goto('http://localhost:5173/dashboard')
    page.wait_for_load_state('networkidle')
    time.sleep(5)

    # Test clicking signals link using JavaScript click
    print("=== Clicking /signals from dashboard ===")
    errors.clear()
    result = page.evaluate("""() => {
        const link = document.querySelector('nav a[href="/signals"]');
        if (link) {
            link.click();
            return 'clicked';
        }
        return 'not found: ' + document.querySelectorAll('nav a').length + ' links';
    }""")
    print(f"  Result: {result}")
    time.sleep(5)
    print(f"  URL: {page.url}")
    print(f"  Errors: {len(errors)}")
    for e in errors[:3]:
        print(f"    {e}")

    # Take screenshot
    page.screenshot(path='/tmp/nav-from-dashboard-signals.png', full_page=True)

    browser.close()
    print("\nDone!")
