from playwright.sync_api import sync_playwright
import time

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1440, "height": 900})

    # Navigate to dashboard
    page.goto('http://localhost:3000/dashboard')
    page.wait_for_load_state('networkidle')
    time.sleep(3)

    # Check for multiple React instances
    print("=== Checking for multiple React instances ===")
    result = page.evaluate("""() => {
        const reactRoot = document.querySelector('[data-reactroot]') || document.querySelector('#__next');

        // Check if there are multiple React instances
        const reactKeys = [];
        const allElements = document.querySelectorAll('*');
        let react1Count = 0;
        let react2Count = 0;

        for (const el of allElements) {
            const keys = Object.keys(el);
            for (const k of keys) {
                if (k.startsWith('__reactInternalInstance$') || k.startsWith('__reactFiber$')) {
                    react1Count++;
                }
                if (k.startsWith('__reactInternalInstance$')) {
                    if (!reactKeys.includes(k)) reactKeys.push(k);
                }
            }
        }

        return {
            reactKeyCount: reactKeys.length,
            reactKeys: reactKeys.slice(0, 5),
        };
    }""")
    print(f"  {result}")

    # Check the Link component's router reference
    print("\n=== Checking Link's router ref ===")
    result2 = page.evaluate("""() => {
        const link = document.querySelector('nav a[href="/pipeline"]');
        if (!link) return 'Link not found';

        const fiberKey = Object.keys(link).find(k => k.startsWith('__reactFiber'));
        if (!fiberKey) return 'No fiber';

        let fiber = link[fiberKey];

        // Walk up to find the LinkComponent
        let linkFiber = fiber;
        let depth = 0;
        while (linkFiber && depth < 5) {
            if (linkFiber.type?.name === 'LinkComponent') {
                break;
            }
            linkFiber = linkFiber.return;
            depth++;
        }

        if (!linkFiber) return 'No LinkComponent found';

        // Check the memoizedState of the LinkComponent
        const state = linkFiber.memoizedState;
        const stateValues = [];
        let s = state;
        let idx = 0;
        while (s && idx < 10) {
            stateValues.push({
                idx,
                key: s.memoizedState ? Object.keys(s.memoizedState).slice(0, 5) : null,
                queue: s.queue ? Object.keys(s.queue).slice(0, 5) : null,
            });
            s = s.next;
            idx++;
        }

        return {
            linkFound: true,
            stateValues,
            props: Object.keys(linkFiber.memoizedProps || {}),
        };
    }""")
    print(f"  {result2}")

    browser.close()
