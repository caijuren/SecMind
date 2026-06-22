from playwright.sync_api import sync_playwright
import time
import json

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1440, "height": 900})

    # Navigate to dashboard
    page.goto('http://localhost:5173/dashboard')
    page.wait_for_load_state('networkidle')
    time.sleep(3)

    # Try to use Next.js router directly with more detailed logging
    print("=== Testing Next.js router ===")
    result = page.evaluate("""async () => {
        // Try to navigate using the router
        const router = window.next?.router;
        if (!router) return 'No router found';

        // Check router methods
        const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(router));
        const ownProps = Object.keys(router);

        return {
            methods: methods.slice(0, 20),
            ownProps: ownProps.slice(0, 20),
            state: router.state,
            pathname: router.pathname,
            asPath: router.asPath,
            query: router.query,
        };
    }""")
    print(f"  Router info: {json.dumps(result, indent=2, default=str)}")

    # Try using the app router's useRouter
    print("\n=== Testing App Router navigation ===")
    page.evaluate("""() => {
        // Intercept the RSC fetch to see what's happening
        const originalFetch = window.fetch;
        window.fetch = async function(...args) {
            const url = typeof args[0] === 'string' ? args[0] : args[0]?.url;
            console.log('FETCH_REQUEST:', url);

            try {
                const response = await originalFetch.apply(this, args);
                console.log('FETCH_RESPONSE:', url, response.status, response.headers.get('content-type'));
                return response;
            } catch (err) {
                console.log('FETCH_ERROR:', url, err.message);
                throw err;
            }
        };
    }""")

    console_messages = []
    page.on("console", lambda msg: console_messages.append(f"{msg.text}") if "FETCH" in msg.text else None)

    # Click pipeline link
    pipeline_link = page.locator('nav a[href="/pipeline"]')
    if pipeline_link.count() > 0:
        pipeline_link.first.click(force=True, timeout=5000)
        time.sleep(5)
        print(f"  URL: {page.url}")
        print(f"  Fetch messages:")
        for msg in console_messages:
            print(f"    {msg}")
    else:
        print("  Pipeline link not found!")

    browser.close()
