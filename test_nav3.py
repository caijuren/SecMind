from playwright.sync_api import sync_playwright
import time

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1440, "height": 900})

    # Collect console errors
    page.on("console", lambda msg: print(f"[{msg.type}] {msg.text}") if msg.type in ["error", "warning"] else None)
    page.on("pageerror", lambda err: print(f"[PAGE_ERROR] {err}"))

    # Start from dashboard
    page.goto('http://localhost:5173/dashboard')
    page.wait_for_load_state('networkidle')
    time.sleep(2)

    # Try clicking hunting link
    print("=== Clicking hunting link ===")
    hunting_link = page.locator('nav a[href="/hunting"]')
    if hunting_link.count() > 0:
        print(f"  Found hunting link, clicking...")
        hunting_link.first.click(timeout=10000)
        time.sleep(3)
        print(f"  Current URL: {page.url}")
    else:
        print("  Hunting link NOT found in nav!")

    # Go back to dashboard
    page.goto('http://localhost:5173/dashboard')
    page.wait_for_load_state('networkidle')
    time.sleep(2)

    # Try clicking workflows link
    print("\n=== Clicking workflows link ===")
    workflows_link = page.locator('nav a[href="/workflows"]')
    if workflows_link.count() > 0:
        print(f"  Found workflows link, clicking...")
        workflows_link.first.click(timeout=10000)
        time.sleep(3)
        print(f"  Current URL: {page.url}")
    else:
        print("  Workflows link NOT found in nav!")

    # Go back to dashboard
    page.goto('http://localhost:5173/dashboard')
    page.wait_for_load_state('networkidle')
    time.sleep(2)

    # Try clicking signals link
    print("\n=== Clicking signals link ===")
    signals_link = page.locator('nav a[href="/signals"]')
    if signals_link.count() > 0:
        print(f"  Found signals link, clicking...")
        signals_link.first.click(timeout=10000)
        time.sleep(3)
        print(f"  Current URL: {page.url}")
    else:
        print("  Signals link NOT found in nav!")

    # Test: check if there's an overlay blocking clicks
    page.goto('http://localhost:5173/dashboard')
    page.wait_for_load_state('networkidle')
    time.sleep(2)

    print("\n=== Checking for overlay elements ===")
    # Check for onboarding overlay
    onboarding = page.locator('[data-onboarding], .onboarding, [role="dialog"]')
    print(f"  Dialog/onboarding elements: {onboarding.count()}")

    # Check for any fixed/absolute positioned overlays
    overlays = page.evaluate("""() => {
        const elements = document.querySelectorAll('*');
        const results = [];
        for (const el of elements) {
            const style = window.getComputedStyle(el);
            if ((style.position === 'fixed' || style.position === 'absolute') &&
                style.zIndex !== 'auto' && parseInt(style.zIndex) > 10 &&
                el.offsetWidth > 100 && el.offsetHeight > 100) {
                results.push({
                    tag: el.tagName,
                    class: el.className.substring(0, 80),
                    zIndex: style.zIndex,
                    width: el.offsetWidth,
                    height: el.offsetHeight,
                    display: style.display,
                    visibility: style.visibility,
                    opacity: style.opacity
                });
            }
        }
        return results;
    }""")
    print(f"  Overlay elements found: {len(overlays)}")
    for o in overlays:
        print(f"    {o}")

    browser.close()
