from playwright.sync_api import sync_playwright
import time

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1440, "height": 900})

    # Navigate to dashboard
    page.goto('http://localhost:5173/dashboard')
    page.wait_for_load_state('networkidle')
    time.sleep(3)

    # Check event listeners
    print("=== Checking event listeners ===")
    listeners = page.evaluate("""() => {
        const results = {};

        // Check beforeunload
        const beforeUnloadListeners = window._beforeUnloadListeners || 'unknown';

        // Check popstate
        const popstateListeners = window._popstateListeners || 'unknown';

        // Check for route change blockers
        results.hasBeforeUnload = window.onbeforeunload !== null;
        results.hasPopState = window.onpopstate !== null;

        // Try to intercept route changes
        const originalPushState = history.pushState;
        let pushStateCalls = 0;
        history.pushState = function(...args) {
            pushStateCalls++;
            console.log('pushState called:', args[2]);
            return originalPushState.apply(this, args);
        };

        const originalReplaceState = history.replaceState;
        let replaceStateCalls = 0;
        history.replaceState = function(...args) {
            replaceStateCalls++;
            console.log('replaceState called:', args[2]);
            return originalReplaceState.apply(this, args);
        };

        return results;
    }""")
    print(f"  {listeners}")

    # Try clicking a link and monitor what happens
    print("\n=== Clicking /pipeline and monitoring ===")
    page.evaluate("""() => {
        // Intercept all fetch requests
        const originalFetch = window.fetch;
        window.fetch = function(...args) {
            console.log('FETCH:', args[0]?.toString?.()?.substring(0, 100));
            return originalFetch.apply(this, args);
        };
    }""")

    console_messages = []
    page.on("console", lambda msg: console_messages.append(f"[{msg.type}] {msg.text}") if msg.type != "warning" else None)

    pipeline_link = page.locator('nav a[href="/pipeline"]')
    if pipeline_link.count() > 0:
        pipeline_link.first.click(force=True, timeout=5000)
        time.sleep(3)
        print(f"  URL: {page.url}")
        print(f"  Console messages:")
        for msg in console_messages[:20]:
            print(f"    {msg}")
    else:
        print("  Pipeline link not found!")

    browser.close()
