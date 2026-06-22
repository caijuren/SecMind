from playwright.sync_api import sync_playwright
import time

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1440, "height": 900})

    # Collect console errors
    page.on("pageerror", lambda err: print(f"[PAGE_ERROR] {err}"))

    # Start from dashboard
    page.goto('http://localhost:5173/dashboard')
    page.wait_for_load_state('networkidle')
    time.sleep(3)

    # Check if there's an onboarding overlay blocking things
    print("=== Checking for overlays ===")
    fixed_elements = page.evaluate("""() => {
        const elements = document.querySelectorAll('*');
        const results = [];
        for (const el of elements) {
            const style = window.getComputedStyle(el);
            if (style.position === 'fixed' && parseInt(style.zIndex) >= 50 &&
                el.offsetWidth > 200 && el.offsetHeight > 200) {
                results.push({
                    tag: el.tagName,
                    id: el.id,
                    class: el.className.toString().substring(0, 100),
                    zIndex: style.zIndex,
                    width: el.offsetWidth,
                    height: el.offsetHeight,
                    pointerEvents: style.pointerEvents,
                    text: el.textContent?.substring(0, 50)
                });
            }
        }
        return results;
    }""")
    print(f"  Fixed overlay elements: {len(fixed_elements)}")
    for o in fixed_elements:
        print(f"    {o}")

    # Check localStorage for onboarding state
    onboarded = page.evaluate("() => localStorage.getItem('secmind-onboarded')")
    wizard_completed = page.evaluate("() => localStorage.getItem('secmind-onboarding-wizard-completed')")
    print(f"\n  secmind-onboarded: {onboarded}")
    print(f"  secmind-onboarding-wizard-completed: {wizard_completed}")

    # Check auth state
    auth_state = page.evaluate("() => localStorage.getItem('secmind-auth')")
    print(f"  secmind-auth (first 200 chars): {str(auth_state)[:200] if auth_state else 'None'}")

    # Try clicking hunting link with force
    print("\n=== Clicking hunting link (with force) ===")
    hunting_link = page.locator('nav a[href="/hunting"]')
    if hunting_link.count() > 0:
        print(f"  Found hunting link")
        # Use force click to bypass any overlay
        hunting_link.first.click(force=True, timeout=5000)
        time.sleep(3)
        print(f"  Current URL: {page.url}")
        page.screenshot(path='/tmp/nav-hunting-force.png', full_page=True)
    else:
        print("  Hunting link NOT found!")

    # Go back
    page.goto('http://localhost:5173/dashboard')
    page.wait_for_load_state('networkidle')
    time.sleep(2)

    # Try clicking workflows link with force
    print("\n=== Clicking workflows link (with force) ===")
    workflows_link = page.locator('nav a[href="/workflows"]')
    if workflows_link.count() > 0:
        print(f"  Found workflows link")
        workflows_link.first.click(force=True, timeout=5000)
        time.sleep(3)
        print(f"  Current URL: {page.url}")
        page.screenshot(path='/tmp/nav-workflows-force.png', full_page=True)
    else:
        print("  Workflows link NOT found!")

    # Now try direct navigation
    print("\n=== Direct navigation to /hunting ===")
    page.goto('http://localhost:5173/hunting')
    page.wait_for_load_state('networkidle')
    time.sleep(3)
    print(f"  Current URL: {page.url}")
    page.screenshot(path='/tmp/nav-hunting-direct.png', full_page=True)

    # Check if there's an error on the page
    page_content = page.content()
    if 'error' in page_content.lower() and 'next' in page_content.lower():
        print("  ERROR: Next.js error page detected!")

    browser.close()
