from playwright.sync_api import sync_playwright
import time

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1440, "height": 900})

    # Start from dashboard
    page.goto('http://localhost:5173/dashboard')
    page.wait_for_load_state('networkidle')
    time.sleep(5)

    # Check all nav links
    all_links = page.evaluate("""() => {
        const navLinks = document.querySelectorAll('nav a');
        return Array.from(navLinks).map(a => ({
            href: a.getAttribute('href'),
            text: a.textContent.trim(),
            visible: a.offsetParent !== null,
            pointerEvents: window.getComputedStyle(a).pointerEvents,
            rect: a.getBoundingClientRect()
        }));
    }""")

    print("=== All nav links ===")
    for link in all_links:
        print(f"  {link['href']}: visible={link['visible']}, pointerEvents={link['pointerEvents']}, rect={link['rect']}")

    # Check if signals link specifically exists
    signals_count = page.locator('nav a[href="/signals"]').count()
    print(f"\nSignals link count: {signals_count}")

    # Try direct navigation to signals
    print("\n=== Direct navigation to /signals ===")
    page.goto('http://localhost:5173/signals')
    page.wait_for_load_state('networkidle')
    time.sleep(3)
    print(f"  URL: {page.url}")

    browser.close()
