from playwright.sync_api import sync_playwright
import time

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1440, "height": 900})

    # Navigate to dashboard
    page.goto('http://localhost:5173/dashboard')
    page.wait_for_load_state('networkidle')
    time.sleep(3)

    # Check if Next.js router is working
    print("=== Checking Next.js router ===")
    router_check = page.evaluate("""() => {
        const nextData = document.getElementById('__NEXT_DATA__');
        const routerInstance = window?.next?.router;
        return {
            hasNextData: !!nextData,
            nextDataContent: nextData?.textContent?.substring(0, 200),
            hasRouter: !!routerInstance,
            routerState: routerInstance?.state,
            windowNext: !!window.next,
        };
    }""")
    print(f"  Router info: {router_check}")

    # Try using Next.js router directly
    print("\n=== Using Next.js router.push directly ===")
    page.evaluate("""() => {
        if (window.next?.router) {
            window.next.router.push('/pipeline');
        } else {
            console.log('No Next.js router found');
        }
    }""")
    time.sleep(3)
    print(f"  URL: {page.url}")

    # Try using history.pushState
    print("\n=== Using history.pushState ===")
    page.evaluate("() => history.pushState({}, '', '/pipeline')")
    time.sleep(1)
    print(f"  URL: {page.url}")

    # Try using window.location
    print("\n=== Using window.location.href ===")
    page.evaluate("() => { window.location.href = '/pipeline' }")
    time.sleep(3)
    print(f"  URL: {page.url}")

    browser.close()
