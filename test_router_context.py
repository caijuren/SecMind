from playwright.sync_api import sync_playwright
import time

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1440, "height": 900})

    # Navigate to dashboard
    page.goto('http://localhost:3000/dashboard')
    page.wait_for_load_state('networkidle')
    time.sleep(3)

    # Check the router context inside the Link component
    print("=== Checking router context ===")
    result = page.evaluate("""() => {
        const link = document.querySelector('nav a[href="/pipeline"]');
        if (!link) return 'Link not found';

        // Find the React fiber
        const fiberKey = Object.keys(link).find(k => k.startsWith('__reactFiber'));
        if (!fiberKey) return 'No fiber';

        let fiber = link[fiberKey];

        // Walk up the fiber tree to find the router context
        const contextValues = [];
        let depth = 0;
        while (fiber && depth < 30) {
            if (fiber.memoizedState) {
                let state = fiber.memoizedState;
                let stateIdx = 0;
                while (state && stateIdx < 10) {
                    if (state.memoizedState && typeof state.memoizedState === 'object') {
                        const keys = Object.keys(state.memoizedState);
                        if (keys.length > 0) {
                            contextValues.push({
                                depth,
                                stateIdx,
                                keys: keys.slice(0, 5),
                                type: fiber.type?.name || typeof fiber.type,
                            });
                        }
                    }
                    state = state.next;
                    stateIdx++;
                }
            }
            fiber = fiber.return;
            depth++;
        }

        return {
            contextValues: contextValues.slice(0, 20),
        };
    }""")
    print(f"  Context values: {len(result.get('contextValues', []))}")
    for cv in result.get('contextValues', []):
        print(f"    {cv}")

    # Also check if there's a NextRouter context
    print("\n=== Checking NextRouter context ===")
    result2 = page.evaluate("""() => {
        // Try to access the router through React's internals
        const link = document.querySelector('nav a[href="/pipeline"]');
        if (!link) return 'Link not found';

        const fiberKey = Object.keys(link).find(k => k.startsWith('__reactFiber'));
        if (!fiberKey) return 'No fiber';

        let fiber = link[fiberKey];

        // Look for the router in the memoizedProps
        const props = fiber.memoizedProps;
        const propKeys = Object.keys(props || {});

        // Look for the router provider
        let currentFiber = fiber;
        let routerFound = false;
        let routerValue = null;
        let depth = 0;

        while (currentFiber && depth < 50) {
            // Check if this is a context provider
            if (currentFiber.type?._context) {
                const contextValue = currentFiber.memoizedProps?.value;
                if (contextValue && (contextValue.push || contextValue.replace || contextValue.pathname)) {
                    routerFound = true;
                    routerValue = {
                        hasPush: typeof contextValue.push,
                        hasReplace: typeof contextValue.replace,
                        pathname: contextValue.pathname,
                        asPath: contextValue.asPath,
                        type: currentFiber.type?.name || 'unknown',
                    };
                    break;
                }
            }
            currentFiber = currentFiber.return;
            depth++;
        }

        return {
            propKeys: propKeys.slice(0, 10),
            routerFound,
            routerValue,
        };
    }""")
    print(f"  {result2}")

    browser.close()
