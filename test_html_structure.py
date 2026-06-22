from playwright.sync_api import sync_playwright
import time

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1440, "height": 900})

    # Navigate to the home page first
    print("=== Testing from home page ===")
    page.goto('http://localhost:3000/')
    page.wait_for_load_state('networkidle')
    time.sleep(3)
    print(f"  URL: {page.url}")

    # Check if there's a link to dashboard
    links = page.evaluate("""() => {
        const links = document.querySelectorAll('a');
        return Array.from(links).map(a => ({
            href: a.getAttribute('href'),
            text: a.textContent.trim().substring(0, 30),
        }));
    }""")
    print(f"  Links: {links}")

    # Navigate to dashboard
    page.goto('http://localhost:3000/dashboard')
    page.wait_for_load_state('networkidle')
    time.sleep(3)

    # Check if the page has the correct HTML structure
    print("\n=== Checking HTML structure ===")
    html_structure = page.evaluate("""() => {
        const html = document.documentElement;
        const body = document.body;

        // Check for Next.js specific elements
        const hasNextData = !!document.getElementById('__NEXT_DATA__');
        const nextScripts = document.querySelectorAll('script[src*="_next"]');

        // Check for the router state
        const routerState = window.next?.router?.state;

        return {
            hasNextData,
            nextScriptCount: nextScripts.length,
            routerState: routerState ? JSON.stringify(routerState).substring(0, 200) : null,
            bodyChildCount: body.childElementCount,
            bodyChildren: Array.from(body.children).map(c => ({
                tag: c.tagName,
                id: c.id,
                class: c.className?.substring(0, 50),
            })),
        };
    }""")
    print(f"  {html_structure}")

    # Try a simple test: navigate using window.location
    print("\n=== Testing window.location navigation ===")
    page.evaluate("() => window.location.href = '/pipeline'")
    page.wait_for_load_state('networkidle')
    time.sleep(3)
    print(f"  URL: {page.url}")

    # From pipeline, try clicking a link
    print("\n=== Testing link click from /pipeline ===")
    dashboard_link = page.locator('nav a[href="/dashboard"]')
    if dashboard_link.count() > 0:
        dashboard_link.first.click(force=True, timeout=5000)
        time.sleep(3)
        print(f"  URL after click: {page.url}")
    else:
        print("  Dashboard link not found")

    browser.close()
