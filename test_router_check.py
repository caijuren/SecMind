from playwright.sync_api import sync_playwright
import time

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1440, "height": 900})

    # Navigate to dashboard
    page.goto('http://localhost:3000/dashboard')
    page.wait_for_load_state('networkidle')
    time.sleep(3)

    # Check if Next.js client-side router is properly loaded
    print("=== Checking Next.js client router ===")
    result = page.evaluate("""() => {
        const next = window.next;
        if (!next) return 'No next object';

        const router = next.router;
        if (!router) return 'No router';

        // Check if the router has the expected methods
        const methods = ['push', 'replace', 'back', 'forward', 'prefetch', 'refresh'];
        const methodTypes = {};
        for (const m of methods) {
            methodTypes[m] = typeof router[m];
        }

        // Try to call push and see what happens
        let pushResult = null;
        try {
            pushResult = router.push('/pipeline');
        } catch (e) {
            pushResult = 'Error: ' + e.message;
        }

        return {
            methodTypes,
            pushResult: String(pushResult),
            routerKeys: Object.keys(router),
        };
    }""")
    print(f"  {result}")

    time.sleep(3)
    print(f"  URL: {page.url}")

    # Check if there are any script errors
    print("\n=== Checking for script loading issues ===")
    scripts = page.evaluate("""() => {
        const scripts = document.querySelectorAll('script');
        return Array.from(scripts).map(s => ({
            src: s.src?.substring(0, 100) || 'inline',
            type: s.type || 'default',
            async: s.async,
            defer: s.defer,
        }));
    }""")
    print(f"  Scripts: {len(scripts)}")
    for s in scripts[:10]:
        print(f"    {s}")

    browser.close()
