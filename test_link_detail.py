from playwright.sync_api import sync_playwright
import time

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1440, "height": 900})

    # Navigate to dashboard
    page.goto('http://localhost:3000/dashboard')
    page.wait_for_load_state('networkidle')
    time.sleep(3)

    # Check the Link elements in detail
    print("=== Checking Link elements ===")
    link_details = page.evaluate("""() => {
        const links = document.querySelectorAll('nav a');
        return Array.from(links).slice(0, 5).map(a => {
            return {
                href: a.getAttribute('href'),
                target: a.getAttribute('target'),
                rel: a.getAttribute('rel'),
                onClick: typeof a.onclick,
                hasDataNext: a.hasAttribute('data-next'),
                outerHTML: a.outerHTML.substring(0, 200),
                parentTag: a.parentElement?.tagName,
                parentOuterHTML: a.parentElement?.outerHTML?.substring(0, 200),
            };
        });
    }""")
    for l in link_details:
        print(f"  {l}")

    # Try clicking using JavaScript and check if event is fired
    print("\n=== Testing click event ===")
    result = page.evaluate("""() => {
        const link = document.querySelector('nav a[href="/pipeline"]');
        if (!link) return 'Link not found';

        // Add click listener to see if event fires
        let clickFired = false;
        link.addEventListener('click', (e) => {
            clickFired = true;
            console.log('Click event fired!', e.defaultPrevented, e.cancelable);
        }, true);  // capture phase

        // Also check for any event listeners
        const listeners = getEventListeners(link);

        link.click();

        return {
            clickFired,
            listeners: Object.keys(listeners),
            listenerCounts: Object.fromEntries(Object.entries(listeners).map(([k, v]) => [k, v.length])),
        };
    }""")
    print(f"  Result: {result}")

    time.sleep(3)
    print(f"  URL after JS click: {page.url}")

    browser.close()
