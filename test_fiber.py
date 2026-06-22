from playwright.sync_api import sync_playwright
import time

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1440, "height": 900})

    # Navigate to dashboard
    page.goto('http://localhost:3000/dashboard')
    page.wait_for_load_state('networkidle')
    time.sleep(3)

    # Check the React fiber tree to understand the component structure
    print("=== Checking React component tree ===")
    result = page.evaluate("""() => {
        // Find the root React fiber
        const rootEl = document.getElementById('__next');
        if (!rootEl) return 'No __next element';

        const fiberKey = Object.keys(rootEl).find(k => k.startsWith('__reactFiber'));
        if (!fiberKey) return 'No React fiber found';

        const fiber = rootEl[fiberKey];

        // Walk the fiber tree to find the router
        function findFiber(fiber, depth = 0, maxDepth = 5) {
            if (!fiber || depth > maxDepth) return [];
            const result = [{
                type: fiber.type?.name || fiber.type?.toString()?.substring(0, 50) || typeof fiber.type,
                tag: fiber.tag,
            }];
            let child = fiber.child;
            while (child) {
                result.push(...findFiber(child, depth + 1, maxDepth));
                child = child.sibling;
            }
            return result;
        }

        const treeInfo = findFiber(fiber, 0, 3);
        return {
            fiberKey,
            treeInfo: treeInfo.slice(0, 20),
        };
    }""")
    print(f"  {result}")

    # Try to navigate using window.next.router.push with await
    print("\n=== Trying router.push with await ===")
    page.evaluate("""async () => {
        const router = window.next?.router;
        if (!router) return 'No router';

        try {
            const result = await router.push('/pipeline');
            console.log('PUSH_RESULT:', JSON.stringify(result));
        } catch (e) {
            console.log('PUSH_ERROR:', e.message);
        }
    }""")

    console_messages = []
    page.on("console", lambda msg: console_messages.append(f"[{msg.type}] {msg.text[:200]}") if "PUSH" in msg.text else None)

    time.sleep(5)
    print(f"  URL: {page.url}")
    print(f"  Messages: {console_messages}")

    browser.close()
